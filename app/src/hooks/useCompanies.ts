import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  partner_id: string;
  created_at: string;
  updated_at: string;
}

export interface StudentCompany {
  id: string;
  student_id: string;
  company_id: string;
  role: string;
  is_primary: boolean;
  start_date?: string;
  end_date?: string;
  notes?: string;
  student_name: string;
  student_email: string;
}

export interface CompanyStudent {
  student_id: string;
  student_name: string;
  student_email: string;
  role: string;
  is_primary: boolean;
  start_date?: string;
  end_date?: string;
}

export function useCompanies() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch companies
  const { data: companies = [], isLoading: loading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Company[];
    },
  });

  // Fetch company students relationships
  const { data: companyStudents = {} } = useQuery({
    queryKey: ['company-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_companies')
        .select(`
          *,
          student:students(name, email)
        `);

      if (error) throw error;

      // Group by company_id
      const grouped: Record<string, CompanyStudent[]> = {};
      
      data.forEach((item: any) => {
        if (!grouped[item.company_id]) {
          grouped[item.company_id] = [];
        }
        
        grouped[item.company_id].push({
          student_id: item.student_id,
          student_name: item.student.name,
          student_email: item.student.email,
          role: item.role,
          is_primary: item.is_primary,
          start_date: item.start_date,
          end_date: item.end_date,
        });
      });

      return grouped;
    },
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Company> }) => {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company-students'] });
    },
  });

  // Add student to company mutation
  const addStudentToCompanyMutation = useMutation({
    mutationFn: async ({ 
      studentId, 
      companyId, 
      role = 'Dipendente',
      isPrimary = false 
    }: { 
      studentId: string; 
      companyId: string; 
      role?: string;
      isPrimary?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('student_companies')
        .insert({
          student_id: studentId,
          company_id: companyId,
          role,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-students'] });
    },
  });

  // Remove student from company mutation
  const removeStudentFromCompanyMutation = useMutation({
    mutationFn: async ({ studentId, companyId }: { studentId: string; companyId: string }) => {
      const { error } = await supabase
        .from('student_companies')
        .delete()
        .eq('student_id', studentId)
        .eq('company_id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-students'] });
    },
  });

  // Update student role mutation
  const updateStudentRoleMutation = useMutation({
    mutationFn: async ({ 
      studentId, 
      companyId, 
      updates 
    }: { 
      studentId: string; 
      companyId: string; 
      updates: Partial<StudentCompany> 
    }) => {
      const { data, error } = await supabase
        .from('student_companies')
        .update(updates)
        .eq('student_id', studentId)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-students'] });
    },
  });

  return {
    companies,
    companyStudents,
    loading,
    createCompany: createCompanyMutation.mutate,
    updateCompany: updateCompanyMutation.mutate,
    deleteCompany: deleteCompanyMutation.mutate,
    addStudentToCompany: addStudentToCompanyMutation.mutate,
    removeStudentFromCompany: removeStudentFromCompanyMutation.mutate,
    updateStudentRole: updateStudentRoleMutation.mutate,
  };
}

