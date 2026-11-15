CREATE OR REPLACE FUNCTION public.redeem_invite(_code text, _role text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv record; already boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to join a project'; END IF;
  SELECT * INTO inv FROM public.project_invites WHERE code = upper(trim(_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite code not found'; END IF;
  IF inv.target_user_id IS NOT NULL AND inv.target_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'This invite was sent to a different creator';
  END IF;
  already := public.is_project_member(inv.project_id, auth.uid());
  IF already THEN
    RETURN jsonb_build_object('project_id', inv.project_id, 'already_member', true);
  END IF;
  IF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'This invite code has already been used';
  END IF;
  INSERT INTO public.project_members(project_id, user_id, role_in_project, creative_role)
  VALUES (inv.project_id, auth.uid(), 'member', COALESCE(NULLIF(_role, ''), inv.role_offered, 'Scriptwriter'));
  UPDATE public.project_invites SET status = 'accepted', accepted_by = auth.uid(), updated_at = now() WHERE code = inv.code;
  RETURN jsonb_build_object('project_id', inv.project_id, 'already_member', false);
END; $$;

REVOKE EXECUTE ON FUNCTION public.redeem_invite(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_invite(text, text) TO authenticated;