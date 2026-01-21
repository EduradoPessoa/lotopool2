
-- Adicionar constraint de unicidade para CPF em profiles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_cpf_key UNIQUE (cpf);

-- Adicionar constraint de unicidade para CPF em participants
ALTER TABLE public.participants ADD CONSTRAINT participants_cpf_key UNIQUE (cpf);

-- Atualizar a função trigger para incluir CPF
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, cpf, "pixKey", whatsapp)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name', 
    COALESCE(new.raw_user_meta_data->>'role', 'POOL_MEMBER'),
    new.raw_user_meta_data->>'cpf',
    new.raw_user_meta_data->>'pixKey',
    new.raw_user_meta_data->>'whatsapp'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
