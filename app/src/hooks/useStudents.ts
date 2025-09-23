import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
  company_name: string;
}

export interface CompanyStudent {
  company_id: string;
  company_name: string;
  role: string;
  is_primary: boolean;
  start_date?: string;
  end_date?: string;
}

export function useStudents() {
  const queryClient = useQueryClient();

  // Fetch students
  const { data: students = [], isLoading: loading, error: studentsError } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Student[];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch student companies relationships
  const { data: studentCompanies = {} } = useQuery({
    queryKey: ['student-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_companies')
        .select(`
          *,
          company:companies(name)
        `);

      if (error) throw error;

      // Group by student_id
      const grouped: Record<string, CompanyStudent[]> = {};
      
      data.forEach((item: any) => {
        if (!grouped[item.student_id]) {
          grouped[item.student_id] = [];
        }
        
        grouped[item.student_id].push({
          company_id: item.company_id,
          company_name: item.company.name,
          role: item.role,
          is_primary: item.is_primary,
          start_date: item.start_date,
          end_date: item.end_date,
        });
      });

      return grouped;
    },
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Student> }) => {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-companies'] });
    },
  });

  // Add company to student mutation
  const addCompanyToStudentMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['student-companies'] });
    },
  });

  // Remove company from student mutation
  const removeCompanyFromStudentMutation = useMutation({
    mutationFn: async ({ studentId, companyId }: { studentId: string; companyId: string }) => {
      const { error } = await supabase
        .from('student_companies')
        .delete()
        .eq('student_id', studentId)
        .eq('company_id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-companies'] });
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
      queryClient.invalidateQueries({ queryKey: ['student-companies'] });
    },
  });

  return {
    students,
    studentCompanies,
    loading,
    error: studentsError,
    createStudent: createStudentMutation.mutate,
    updateStudent: updateStudentMutation.mutate,
    deleteStudent: deleteStudentMutation.mutate,
    addCompanyToStudent: addCompanyToStudentMutation.mutate,
    removeCompanyFromStudent: removeCompanyFromStudentMutation.mutate,
    updateStudentRole: updateStudentRoleMutation.mutate,
  };
}

