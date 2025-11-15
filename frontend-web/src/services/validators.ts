import * as yup from 'yup';

export const studentSchema = yup.object().shape({
  name: yup.string().required('Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  matricula: yup.string().required('Matrícula é obrigatória'),
  curso: yup.string(),
  class_id: yup.string(),
  password: yup.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const courseSchema = yup.object().shape({
  code: yup.string().required('Código é obrigatório'),
  name: yup.string().required('Nome é obrigatório'),
});

export const classSchema = yup.object().shape({
  name: yup.string().required('Nome é obrigatório'),
  course_id: yup.string().required('Curso é obrigatório'),
});

export const sessionSchema = yup.object().shape({
  class_id: yup.string().required('Turma é obrigatória'),
  start_at: yup.string().required('Data de início é obrigatória'),
});

