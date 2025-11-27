import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zqpygsdlwvajfrxkmqnl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcHlnc2Rsd3ZhamZyeGttcW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTYyMDQsImV4cCI6MjA3OTQ3MjIwNH0.F4_VTL65qIQ13hsXMBcIhxcuk18zwr83QV86Nbnq4S4'

export const supabase = createClient(supabaseUrl, supabaseKey)

// ========== FUNCIONES PARA LA BASE DE DATOS ==========

// Obtener todos los pacientes
export const getPacientes = async () => {
  const { data, error } = await supabase
    .from('personas_base')
    .select('*')
    .order('apellidos', { ascending: true });
  
  if (error) {
    console.error('Error al obtener pacientes:', error);
    throw error;
  }
  return data;
};

// Buscar pacientes
export const searchPacientes = async (searchTerm) => {
  const { data, error } = await supabase
    .from('personas_base')
    .select('*')
    .or(`apellidos.ilike.%${searchTerm}%,nombres.ilike.%${searchTerm}%,dni.ilike.%${searchTerm}%,lugar.ilike.%${searchTerm}%`)
    .order('apellidos', { ascending: true });
  
  if (error) {
    console.error('Error al buscar pacientes:', error);
    throw error;
  }
  return data;
};

// Obtener un paciente por ID
export const getPacienteById = async (id) => {
  const { data, error } = await supabase
    .from('personas_base')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error al obtener paciente:', error);
    throw error;
  }
  return data;
};

// Crear nuevo paciente
export const createPaciente = async (paciente) => {
  const { data, error } = await supabase
    .from('personas_base')
    .insert([paciente])
    .select()
    .single();
  
  if (error) {
    console.error('Error al crear paciente:', error);
    throw error;
  }
  return data;
};

// Actualizar paciente
export const updatePaciente = async (id, paciente) => {
  const { data, error } = await supabase
    .from('personas_base')
    .update(paciente)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error al actualizar paciente:', error);
    throw error;
  }
  return data;
};

// Eliminar paciente
export const deletePaciente = async (id) => {
  const { data, error } = await supabase
    .from('personas_base')
    .delete()
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error al eliminar paciente:', error);
    throw error;
  }
  return data;
};

// Obtener estadísticas
export const getEstadisticas = async () => {
  // Total de pacientes
  const { count: total, error: errorTotal } = await supabase
    .from('personas_base')
    .select('*', { count: 'exact', head: true });

  // Total de hombres
  const { count: hombres, error: errorHombres } = await supabase
    .from('personas_base')
    .select('*', { count: 'exact', head: true })
    .eq('sexo', 'M');

  // Total de mujeres
  const { count: mujeres, error: errorMujeres } = await supabase
    .from('personas_base')
    .select('*', { count: 'exact', head: true })
    .eq('sexo', 'F');

  if (errorTotal || errorHombres || errorMujeres) {
    console.error('Error al obtener estadísticas');
    throw errorTotal || errorHombres || errorMujeres;
  }

  return {
    total: total || 0,
    hombres: hombres || 0,
    mujeres: mujeres || 0
  };
};