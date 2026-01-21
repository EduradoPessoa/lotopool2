-- Function to handle safe joining of a group by a new or existing participant
CREATE OR REPLACE FUNCTION public.join_pool_group(
  p_group_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_cpf TEXT,
  p_pix_key TEXT,
  p_lucky_number INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant_id UUID;
  v_group_exists BOOLEAN;
  v_profile_id UUID;
BEGIN
  -- 1. Verify group exists
  SELECT EXISTS(SELECT 1 FROM public.groups WHERE id = p_group_id) INTO v_group_exists;
  IF NOT v_group_exists THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  -- 2. Check for existing participant by CPF
  SELECT id INTO v_participant_id FROM public.participants WHERE cpf = p_cpf;

  -- 3. Find profile ID if exists
  SELECT id INTO v_profile_id FROM public.profiles WHERE cpf = p_cpf;

  IF v_participant_id IS NULL THEN
    -- Create new participant
    INSERT INTO public.participants (name, email, phone, cpf, "pixKey", "profileId")
    VALUES (p_name, p_email, p_phone, p_cpf, p_pix_key, v_profile_id)
    RETURNING id INTO v_participant_id;
  ELSE
    -- Update existing participant
    UPDATE public.participants 
    SET "profileId" = COALESCE("profileId", v_profile_id),
        "pixKey" = COALESCE(p_pix_key, "pixKey")
    WHERE id = v_participant_id;
  END IF;

  -- 4. Update Group's participants JSONB if not already there
  IF NOT EXISTS (
      SELECT 1 
      FROM public.groups g, jsonb_array_elements(g.participants) as p 
      WHERE g.id = p_group_id 
      AND (p->>'participantId')::uuid = v_participant_id
  ) THEN
      UPDATE public.groups
      SET participants = COALESCE(participants, '[]'::jsonb) || jsonb_build_object(
        'participantId', v_participant_id,
        'luckyNumber', p_lucky_number,
        'joinedAt', now()
      )
      WHERE id = p_group_id;
  END IF;

  -- 5. Return data
  RETURN jsonb_build_object(
    'id', v_participant_id,
    'name', p_name,
    'email', p_email,
    'role', 'POOL_MEMBER',
    'cpf', p_cpf,
    'pixKey', p_pix_key
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.join_pool_group TO anon, authenticated, service_role;
