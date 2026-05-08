update public.profiles
set email_verified = false,
    email_verification_token = encode(extensions.gen_random_bytes(24), 'hex'),
    updated_at = now()
where username = 'kijujan';