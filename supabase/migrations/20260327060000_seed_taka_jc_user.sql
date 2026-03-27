DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'taka_jc@hotmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Update password and confirm email to match the one the user is trying to use
    UPDATE auth.users 
    SET encrypted_password = crypt('Taka@126110', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = v_user_id;
  ELSE
    -- Insert if missing
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'taka_jc@hotmail.com',
      crypt('Taka@126110', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin"}',
      false, 'authenticated', 'authenticated',
      '',    
      '',    
      '',    
      '',    
      '',    
      NULL,  
      '',    
      '',    
      ''     
    );

    INSERT INTO public.usuarios (id, email, nome)
    VALUES (v_user_id, 'taka_jc@hotmail.com', 'Admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
