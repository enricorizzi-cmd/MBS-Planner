import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Session {
  id: string;
  month: number;
  year: number;
  location: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  estimated_attendance: number;
  days?: SessionDay[];
}

export interface SessionDay {
  id: string;
  session_id: string;
  day_index: number;
  date: string;
  estimated_attendance: number;
  actual_attendance?: number;
}

export interface Manual {
  id: string;
  code: string;
  name: string;
  area: 'A' | 'B' | 'C';
  color: string;
  order_priority: number;
  total_points: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_id: string;
  company?: {
    id: string;
    name: string;
  };
}

export interface Booking {
  id: string;
  session_day_id: string;
  student_id: string;
  manual_id: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  tags: string[];
  keep_seat_between_days: boolean;
  notes?: string;
  student?: Student;
  manual?: Manual;
}

export interface Layout {
  id: string;
  session_id: string;
  seats_per_block: number;
  rows_count: number;
  columns_count: number;
}

export interface Seat {
  id: string;
  session_day_id: string;
  row_letter: string;
  column_number: number;
  area: 'A' | 'B' | 'C';
  status: 'occupied' | 'reserved' | 'empty' | 'locked';
  booking_id?: string;
  reservation_for_student_id?: string;
  is_locked: boolean;
  notes?: string;
  booking?: Booking;
  reservation_student?: Student;
}

export interface DispositionStats {
  totalSeats: number;
  occupiedSeats: number;
  reservedSeats: number;
  emptySeats: number;
  areaStats: {
    A: { total: number; occupied: number; reserved: number };
    B: { total: number; occupied: number; reserved: number };
    C: { total: number; occupied: number; reserved: number };
  };
  companyStats: Record<string, number>;
  manualStats: Record<string, number>;
}

export function useDisposition(_sessionId: string | null, _dayIndex: 1 | 2) {
  const { } = useAuth();
  const queryClient = useQueryClient();

  // Fetch sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          days:session_days(*)
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      return data as Session[];
    },
  });

  // Fetch current session details
  const { data: currentSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          days:session_days(*)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data as Session;
    },
    enabled: !!sessionId,
  });

  // Fetch layout
  const { data: currentLayout } = useQuery({
    queryKey: ['layout', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      
      const { data, error } = await supabase
        .from('layouts')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Layout | null;
    },
    enabled: !!sessionId,
  });

  // Fetch seats for current day
  const { data: seats = [], isLoading: loading } = useQuery({
    queryKey: ['seats', sessionId, dayIndex],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('seats')
        .select(`
          *,
          booking:bookings(
            *,
            student:students(*),
            manual:manuals(*)
          ),
          reservation_student:students(*)
        `)
        .eq('session_day_id', currentSession?.days?.find(d => d.day_index === dayIndex)?.id)
        .order('row_letter')
        .order('column_number');

      if (error) throw error;
      return data as Seat[];
    },
    enabled: !!sessionId && !!currentSession?.days,
  });

  // Fetch bookings for current day
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', sessionId, dayIndex],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          student:students(*),
          manual:manuals(*)
        `)
        .eq('session_day_id', currentSession?.days?.find(d => d.day_index === dayIndex)?.id)
        .eq('status', 'confirmed');

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!sessionId && !!currentSession?.days,
  });

  // Calculate stats
  const stats: DispositionStats = {
    totalSeats: seats.length,
    occupiedSeats: seats.filter(s => s.status === 'occupied').length,
    reservedSeats: seats.filter(s => s.status === 'reserved').length,
    emptySeats: seats.filter(s => s.status === 'empty').length,
    areaStats: {
      A: {
        total: seats.filter(s => s.area === 'A').length,
        occupied: seats.filter(s => s.area === 'A' && s.status === 'occupied').length,
        reserved: seats.filter(s => s.area === 'A' && s.status === 'reserved').length,
      },
      B: {
        total: seats.filter(s => s.area === 'B').length,
        occupied: seats.filter(s => s.area === 'B' && s.status === 'occupied').length,
        reserved: seats.filter(s => s.area === 'B' && s.status === 'reserved').length,
      },
      C: {
        total: seats.filter(s => s.area === 'C').length,
        occupied: seats.filter(s => s.area === 'C' && s.status === 'occupied').length,
        reserved: seats.filter(s => s.area === 'C' && s.status === 'reserved').length,
      },
    },
    companyStats: {},
    manualStats: {},
  };

  // Calculate company and manual stats
  seats.forEach(seat => {
    if (seat.booking?.student?.company_id) {
      const companyName = seat.booking.student.company?.name || 'Unknown';
      stats.companyStats[companyName] = (stats.companyStats[companyName] || 0) + 1;
    }
    if (seat.booking?.manual_id) {
      const manualName = seat.booking.manual?.name || 'Unknown';
      stats.manualStats[manualName] = (stats.manualStats[manualName] || 0) + 1;
    }
  });

  // Generate disposition mutation
  const generateDispositionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-disposition', {
        body: { session_id: sessionId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seats', sessionId, dayIndex] });
      queryClient.invalidateQueries({ queryKey: ['layout', sessionId] });
    },
  });

  // Update seat mutation
  const updateSeatMutation = useMutation({
    mutationFn: async ({ seatId, updates }: { seatId: string; updates: Partial<Seat> }) => {
      const { data, error } = await supabase
        .from('seats')
        .update(updates)
        .eq('id', seatId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seats', sessionId, dayIndex] });
    },
  });

  // Add row mutation
  const addRowMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke('add-row', {
        body: { session_id: sessionId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seats', sessionId, dayIndex] });
      queryClient.invalidateQueries({ queryKey: ['layout', sessionId] });
    },
  });

  // Change layout mutation
  const changeLayoutMutation = useMutation({
    mutationFn: async ({ sessionId, seatsPerBlock }: { sessionId: string; seatsPerBlock: number }) => {
      const { data, error } = await supabase.functions.invoke('change-layout', {
        body: { session_id: sessionId, seats_per_block: seatsPerBlock }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seats', sessionId, dayIndex] });
      queryClient.invalidateQueries({ queryKey: ['layout', sessionId] });
    },
  });

  // Print disposition
  const printDisposition = (sessionId: string, dayIndex: 1 | 2) => {
    // This would typically open a print dialog or generate a PDF
    window.print();
  };

  return {
    sessions,
    currentSession,
    currentLayout,
    seats,
    bookings,
    stats,
    loading,
    generateDisposition: generateDispositionMutation.mutate,
    updateSeat: updateSeatMutation.mutate,
    addRow: addRowMutation.mutate,
    changeLayout: changeLayoutMutation.mutate,
    printDisposition,
  };
}

