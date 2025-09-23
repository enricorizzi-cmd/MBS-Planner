import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Revenue {
  id: string;
  company_id: string;
  month: number;
  year: number;
  amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyRevenueData {
  month: number;
  year: number;
  amount: number | null;
  increment_percent: number | null;
}

export interface AnnualRevenueData {
  year: number;
  total_amount: number | null;
  increment_percent: number | null;
  ytd_increment_percent: number | null;
}

export interface LastMonthRevenueData {
  month: number;
  year: number;
  amount: number | null;
  increment_percent: number | null;
  is_missing: boolean;
}

export function useRevenues(companyId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch revenues
  const { data: revenues = [], isLoading: loading } = useQuery({
    queryKey: ['revenues', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenues')
        .select('*')
        .eq('company_id', companyId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      return data as Revenue[];
    },
    enabled: !!companyId,
  });

  // Fetch monthly data with increments
  const { data: monthlyData = [] } = useQuery({
    queryKey: ['monthly-revenues', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_monthly_revenue_with_increment', {
          company_uuid: companyId
        });

      if (error) throw error;
      return data as MonthlyRevenueData[];
    },
    enabled: !!companyId,
  });

  // Fetch annual data with increments
  const { data: annualData = [] } = useQuery({
    queryKey: ['annual-revenues', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_annual_revenue_with_increment', {
          company_uuid: companyId
        });

      if (error) throw error;
      return data as AnnualRevenueData[];
    },
    enabled: !!companyId,
  });

  // Fetch last month data
  const { data: lastMonthData } = useQuery({
    queryKey: ['last-month-revenue', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_last_month_revenue', {
          company_uuid: companyId
        });

      if (error) throw error;
      return data?.[0] as LastMonthRevenueData | null;
    },
    enabled: !!companyId,
  });

  // Create revenue mutation
  const createRevenueMutation = useMutation({
    mutationFn: async (revenueData: Omit<Revenue, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('revenues')
        .insert(revenueData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenues', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-revenues', companyId] });
      queryClient.invalidateQueries({ queryKey: ['annual-revenues', companyId] });
      queryClient.invalidateQueries({ queryKey: ['last-month-revenue', companyId] });
    },
  });

  // Update revenue mutation
  const updateRevenueMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Revenue> }) => {
      const { data, error } = await supabase
        .from('revenues')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenues', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-revenues', companyId] });
      queryClient.invalidateQueries({ queryKey: ['annual-revenues', companyId] });
      queryClient.invalidateQueries({ queryKey: ['last-month-revenue', companyId] });
    },
  });

  // Delete revenue mutation
  const deleteRevenueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('revenues')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenues', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-revenues', companyId] });
      queryClient.invalidateQueries({ queryKey: ['annual-revenues', companyId] });
      queryClient.invalidateQueries({ queryKey: ['last-month-revenue', companyId] });
    },
  });

  return {
    revenues,
    monthlyData,
    annualData,
    lastMonthData,
    loading,
    createRevenue: createRevenueMutation.mutate,
    updateRevenue: updateRevenueMutation.mutate,
    deleteRevenue: deleteRevenueMutation.mutate,
  };
}

