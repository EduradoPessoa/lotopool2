-- Corrigir permissões de acesso às tabelas para usuários logados
-- Isso é necessário porque o script anterior pode ter restringido o acesso apenas ao sistema

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Garante que usuários logados (authenticated) e anônimos (anon) possam acessar as tabelas
-- A segurança real continua sendo feita pelas Policies (RLS) que já criamos
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- Garante acesso às sequências (caso existam futuramente)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
