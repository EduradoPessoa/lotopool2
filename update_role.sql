-- Atualizar o papel (role) de um usuário específico
-- Substitua 'seu_email@exemplo.com' pelo e-mail do usuário que você quer promover

UPDATE public.profiles
SET role = 'SAAS_ADMIN' -- Opções: 'SAAS_ADMIN', 'POOL_ADMIN', 'POOL_MEMBER'
WHERE email = 'eduardo@phoenyx.com.br'; -- Coloque o e-mail correto aqui
