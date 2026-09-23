-- SOMENTE LEITURA. Metadados, sem contatos, CPF, tokens ou senhas.
-- Executar como administrador no SQL Editor. Isto nao simula o papel anon.
select schemaname, tablename, rowsecurity
from pg_tables where schemaname in ('public', 'privado')
order by schemaname, tablename;

select table_schema, table_name, column_name, data_type, udt_name,
       is_nullable, column_default
from information_schema.columns
where table_schema in ('public', 'privado')
order by table_schema, table_name, ordinal_position;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname in ('public', 'privado', 'storage')
order by schemaname, tablename, policyname;

select grantee, table_schema, table_name, privilege_type
from information_schema.table_privileges
where table_schema in ('public', 'privado')
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by table_schema, table_name, grantee, privilege_type;

select grantee, table_schema, table_name, column_name, privilege_type
from information_schema.column_privileges
where table_schema in ('public', 'privado')
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by table_schema, table_name, column_name, grantee;

select n.nspname as esquema, p.proname as funcao,
       pg_get_function_identity_arguments(p.oid) as argumentos,
       p.prosecdef as security_definer, p.proconfig, p.proacl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'privado')
order by n.nspname, p.proname;

select n.nspname as esquema, c.relname as view, c.reloptions
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v';

select id, public from storage.buckets order by id;

-- Contagens sozinhas nao comprovam cadastro, login nem seguranca de PII.
select count(*) as usuarios_auth from auth.users;
select count(*) as perfis from public.profiles;
select count(*) as atletas_publicos from public.athletes_public;
