-- SQL para inserir usuário professor
-- Email: cristiano@example.com
-- Senha: senha123
-- Role: TEACHER (enum em maiúsculas no PostgreSQL)

INSERT INTO public.users
(id, name, email, role, password_hash, is_active, created_at, updated_at)
VALUES(
    'db3c13f9-8850-4b9f-b36a-10ca4345f7f4',
    'Cristiano',
    'cristiano@example.com',
    'TEACHER',
    '$2b$12$ePNs7ORfrFn5wcGrrWlM4eRjAFNRbnfDPvPraq3T9zMg1kEnWgS52',
    'true',
    '2025-11-14 08:22:13',
    '2025-11-14 08:22:13'
);

