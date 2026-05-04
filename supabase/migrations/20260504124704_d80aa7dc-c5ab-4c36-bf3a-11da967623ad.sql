INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'moderator'::app_role FROM public.profiles
WHERE username IN ('kijujan','mavi','barutcumd','needforscore')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role FROM public.profiles
WHERE username IN ('kijujan','mavi','barutcumd','needforscore')
ON CONFLICT (user_id, role) DO NOTHING;