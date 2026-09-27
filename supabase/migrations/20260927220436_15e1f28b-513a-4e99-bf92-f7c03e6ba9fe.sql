DROP FUNCTION IF EXISTS public.claim_admin_if_none();

CREATE SCHEMA IF NOT EXISTS app_private;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY "own payments read" ON public.payments;
DROP POLICY "admin payments update" ON public.payments;
CREATE POLICY "own payments read" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR app_private.has_role(auth.uid(),'admin'));
CREATE POLICY "admin payments update" ON public.payments FOR UPDATE TO authenticated USING (app_private.has_role(auth.uid(),'admin')) WITH CHECK (app_private.has_role(auth.uid(),'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);