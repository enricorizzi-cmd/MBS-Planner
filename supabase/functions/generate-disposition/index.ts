import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error('Session ID is required');
    }

    // Get session details
    const { data: session, error: sessionError } = await supabaseClient
      .from('sessions')
      .select(`
        *,
        days:session_days(*)
      `)
      .eq('id', session_id)
      .single();

    if (sessionError) throw sessionError;

    // Get bookings for both days
    const { data: bookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        student:students(*),
        manual:manuals(*)
      `)
      .in('session_day_id', session.days.map((d: any) => d.id))
      .eq('status', 'confirmed');

    if (bookingsError) throw bookingsError;

    // Calculate total attendance
    const day1Bookings = bookings.filter((b: any) => 
      session.days.find((d: any) => d.id === b.session_day_id)?.day_index === 1
    );
    const day2Bookings = bookings.filter((b: any) => 
      session.days.find((d: any) => d.id === b.session_day_id)?.day_index === 2
    );

    const totalAttendance = Math.max(day1Bookings.length, day2Bookings.length);
    const seatsPerBlock = totalAttendance > 100 ? 4 : 3;
    const columnsCount = seatsPerBlock * 3; // 3 areas

    // Calculate required rows
    const areaCounts = { A: 0, B: 0, C: 0 };
    bookings.forEach((booking: any) => {
      if (booking.manual?.area) {
        areaCounts[booking.manual.area as keyof typeof areaCounts]++;
      }
    });

    const maxAreaCount = Math.max(...Object.values(areaCounts));
    const requiredRows = Math.ceil(maxAreaCount / seatsPerBlock);
    const rowsCount = Math.min(Math.max(requiredRows, 8), 12);

    // Create or update layout
    const { data: existingLayout } = await supabaseClient
      .from('layouts')
      .select('*')
      .eq('session_id', session_id)
      .single();

    let layoutId;
    if (existingLayout) {
      const { data: updatedLayout, error: updateError } = await supabaseClient
        .from('layouts')
        .update({
          seats_per_block: seatsPerBlock,
          rows_count: rowsCount,
          columns_count: columnsCount,
        })
        .eq('id', existingLayout.id)
        .select()
        .single();

      if (updateError) throw updateError;
      layoutId = updatedLayout.id;
    } else {
      const { data: newLayout, error: createError } = await supabaseClient
        .from('layouts')
        .insert({
          session_id,
          seats_per_block: seatsPerBlock,
          rows_count: rowsCount,
          columns_count: columnsCount,
        })
        .select()
        .single();

      if (createError) throw createError;
      layoutId = newLayout.id;
    }

    // Clear existing seats
    await supabaseClient
      .from('seats')
      .delete()
      .in('session_day_id', session.days.map((d: any) => d.id));

    // Generate seats for both days
    const rows = Array.from({ length: rowsCount }, (_, i) => 
      String.fromCharCode(97 + i) // a, b, c, ...
    );

    for (const day of session.days) {
      for (const row of rows) {
        for (let col = 1; col <= columnsCount; col++) {
          const area = col <= seatsPerBlock ? 'A' : 
                      col <= seatsPerBlock * 2 ? 'B' : 'C';

          await supabaseClient
            .from('seats')
            .insert({
              session_day_id: day.id,
              row_letter: row,
              column_number: col,
              area,
              status: 'empty',
            });
        }
      }
    }

    // Apply disposition algorithm
    await applyDispositionAlgorithm(supabaseClient, session, bookings, layoutId);

    // Log the action
    await supabaseClient
      .from('disposition_history')
      .insert({
        session_id,
        action_type: 'auto_generate',
        description: `Disposizione generata automaticamente: ${rowsCount} righe, ${columnsCount} colonne, ${seatsPerBlock} posti/blocco`,
        new_data: {
          layout: { seats_per_block: seatsPerBlock, rows_count: rowsCount, columns_count: columnsCount },
          total_attendance: totalAttendance,
        },
        user_id: (await supabaseClient.auth.getUser()).data.user?.id,
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        layout: { seats_per_block: seatsPerBlock, rows_count: rowsCount, columns_count: columnsCount },
        total_attendance: totalAttendance 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function applyDispositionAlgorithm(
  supabaseClient: any,
  session: any,
  bookings: any[],
  layoutId: string
) {
  // Group bookings by day and area
  const dayBookings = {
    1: bookings.filter(b => session.days.find((d: any) => d.id === b.session_day_id)?.day_index === 1),
    2: bookings.filter(b => session.days.find((d: any) => d.id === b.session_day_id)?.day_index === 2),
  };

  // Get layout details
  const { data: layout } = await supabaseClient
    .from('layouts')
    .select('*')
    .eq('id', layoutId)
    .single();

  const seatsPerBlock = layout.seats_per_block;
  const rowsCount = layout.rows_count;

  // Process each day
  for (const [dayIndex, dayBookingList] of Object.entries(dayBookings)) {
    const dayId = session.days.find((d: any) => d.day_index === parseInt(dayIndex))?.id;
    if (!dayId) continue;

    // Group by area and manual
    const areaGroups: Record<string, any[]> = { A: [], B: [], C: [] };
    
    dayBookingList.forEach((booking: any) => {
      if (booking.manual?.area) {
        areaGroups[booking.manual.area].push(booking);
      }
    });

    // Sort by progress (more advanced first) and apply anti-affiliation rules
    Object.keys(areaGroups).forEach(area => {
      areaGroups[area].sort((a, b) => {
        // Get student enrollment progress
        const aProgress = a.student?.enrollments?.[0]?.current_progress || 0;
        const bProgress = b.student?.enrollments?.[0]?.current_progress || 0;
        return bProgress - aProgress;
      });
      
      // Apply anti-affiliation: separate students from same company
      const separatedBookings: any[] = [];
      const companyGroups: Record<string, any[]> = {};
      
      // Group by company reference
      areaGroups[area].forEach(booking => {
        const companyId = booking.company_reference_id || 'no-company';
        if (!companyGroups[companyId]) {
          companyGroups[companyId] = [];
        }
        companyGroups[companyId].push(booking);
      });
      
      // Interleave companies to avoid adjacency
      const companyIds = Object.keys(companyGroups);
      let maxLength = Math.max(...companyIds.map(id => companyGroups[id].length));
      
      for (let i = 0; i < maxLength; i++) {
        companyIds.forEach(companyId => {
          if (companyGroups[companyId][i]) {
            separatedBookings.push(companyGroups[companyId][i]);
          }
        });
      }
      
      areaGroups[area] = separatedBookings;
    });

    // Assign seats
    const rows = Array.from({ length: rowsCount }, (_, i) => String.fromCharCode(97 + i));
    
    Object.entries(areaGroups).forEach(([area, areaBookings]) => {
      const startCol = area === 'A' ? 1 : area === 'B' ? seatsPerBlock + 1 : seatsPerBlock * 2 + 1;
      const endCol = area === 'A' ? seatsPerBlock : area === 'B' ? seatsPerBlock * 2 : layout.columns_count;
      
      let currentRow = 0;
      let currentCol = startCol;
      
      areaBookings.forEach((booking: any) => {
        if (currentRow >= rowsCount) return; // No more rows available
        
        // Check if student is almost finished (reserve next manual)
        const progress = booking.student?.enrollments?.[0]?.current_progress || 0;
        const totalPoints = booking.student?.enrollments?.[0]?.total_points || 60;
        const isAlmostFinished = (totalPoints - progress) < 10;
        
        if (isAlmostFinished) {
          // Create reservation for next manual
          const nextManual = booking.student?.enrollments?.[0]?.next_manual_id;
          if (nextManual) {
            // Find next area
            const { data: nextManualData } = await supabaseClient
              .from('manuals')
              .select('area')
              .eq('id', nextManual)
              .single();
            
            if (nextManualData) {
              // Reserve seat in next area
              const nextArea = nextManualData.area;
              const nextStartCol = nextArea === 'A' ? 1 : nextArea === 'B' ? seatsPerBlock + 1 : seatsPerBlock * 2 + 1;
              const nextEndCol = nextArea === 'A' ? seatsPerBlock : nextArea === 'B' ? seatsPerBlock * 2 : layout.columns_count;
              
              // Find empty seat in next area
              const { data: nextSeats } = await supabaseClient
                .from('seats')
                .select('*')
                .eq('session_day_id', dayId)
                .eq('area', nextArea)
                .eq('status', 'empty')
                .limit(1);
              
              if (nextSeats && nextSeats.length > 0) {
                await supabaseClient
                  .from('seats')
                  .update({
                    status: 'reserved',
                    reservation_for_student_id: booking.student_id,
                  })
                  .eq('id', nextSeats[0].id);
              }
            }
          }
        }
        
        // Assign current seat
        const { data: availableSeats } = await supabaseClient
          .from('seats')
          .select('*')
          .eq('session_day_id', dayId)
          .eq('row_letter', rows[currentRow])
          .eq('column_number', currentCol)
          .eq('status', 'empty')
          .limit(1);
        
        if (availableSeats && availableSeats.length > 0) {
          await supabaseClient
            .from('seats')
            .update({
              status: 'occupied',
              booking_id: booking.id,
            })
            .eq('id', availableSeats[0].id);
        }
        
        // Move to next position
        currentCol++;
        if (currentCol > endCol) {
          currentCol = startCol;
          currentRow++;
        }
      });
    });
  }
}
