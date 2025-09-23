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

export interface Manual {
  id: string;
  code: string;
  name: string;
  area: 'A' | 'B' | 'C';
  color: string;
  order_priority: number;
  total_points: number;
}

export interface Booking {
  id: string;
  session_day_id: string;
  student_id: string;
  manual_id: string;
  company_reference_id?: string; // Azienda di riferimento per questa prenotazione
  status: 'confirmed' | 'pending' | 'cancelled';
  tags: string[];
  keep_seat_between_days: boolean;
  notes?: string;
  student?: Student;
  manual?: Manual;
  company_reference?: {
    id: string;
    name: string;
  };
}

export function useBookings(sessionId: string | null) {
  const { user } = useAuth();
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

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          company:companies(*)
        `)
        .order('name');

      if (error) throw error;
      return data as Student[];
    },
  });

  // Fetch manuals
  const { data: manuals = [] } = useQuery({
    queryKey: ['manuals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manuals')
        .select('*')
        .order('order_priority');

      if (error) throw error;
      return data as Manual[];
    },
  });

  // Fetch bookings for selected session
  const { data: bookings = [], isLoading: loading } = useQuery({
    queryKey: ['bookings', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          student:students(
            *,
            company:companies(*)
          ),
          manual:manuals(*),
          company_reference:companies(*)
        `)
        .in('session_day_id', 
          sessions.find(s => s.id === sessionId)?.days?.map(d => d.id) || []
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!sessionId,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: Omit<Booking, 'id'>) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select(`
          *,
          student:students(
            *,
            company:companies(*)
          ),
          manual:manuals(*),
          company_reference:companies(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', sessionId] });
    },
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Booking> }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          student:students(
            *,
            company:companies(*)
          ),
          manual:manuals(*),
          company_reference:companies(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', sessionId] });
    },
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', sessionId] });
    },
  });

  return {
    sessions,
    students,
    manuals,
    bookings,
    loading,
    createBooking: createBookingMutation.mutate,
    updateBooking: updateBookingMutation.mutate,
    deleteBooking: deleteBookingMutation.mutate,
  };
}
