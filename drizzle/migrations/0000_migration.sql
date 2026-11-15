
-- ===================== PROFILES =====================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  creator_type text NOT NULL DEFAULT 'storyteller',
  genres text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  interests text[] NOT NULL DEFAULT '{}',
  experience text NOT NULL DEFAULT 'Emerging',
  years integer NOT NULL DEFAULT 0,
  availability text NOT NULL DEFAULT 'open',
  collab_prefs text[] NOT NULL DEFAULT '{}',
  looking_for text[] NOT NULL DEFAULT '{}',
  studio_role text NOT NULL DEFAULT 'Scriptwriter',
  skill_category text NOT NULL DEFAULT '',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view creator profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email,''), '@', 1), ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================== CONNECTIONS =====================
CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id uuid NOT NULL,
  to_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  note text NOT NULL DEFAULT '',
  project_title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  genre text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_id <> to_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view connections" ON public.connections FOR SELECT TO authenticated USING (auth.uid() = from_id OR auth.uid() = to_id);
CREATE POLICY "Users send connection requests" ON public.connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_id);
CREATE POLICY "Participants update connections" ON public.connections FOR UPDATE TO authenticated USING (auth.uid() = from_id OR auth.uid() = to_id);
CREATE POLICY "Participants delete connections" ON public.connections FOR DELETE TO authenticated USING (auth.uid() = from_id OR auth.uid() = to_id);
CREATE TRIGGER connections_touch BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===================== PROJECTS =====================
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  genres text[] NOT NULL DEFAULT '{}',
  primary_genre text NOT NULL DEFAULT 'Other',
  status text NOT NULL DEFAULT 'Planning',
  is_draft boolean NOT NULL DEFAULT false,
  owner_id uuid NOT NULL,
  owner_name text NOT NULL DEFAULT '',
  required_roles text[] NOT NULL DEFAULT '{}',
  milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  feedback jsonb NOT NULL DEFAULT '[]'::jsonb,
  portfolio jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

CREATE TABLE public.project_members (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role_in_project text NOT NULL DEFAULT 'member',
  creative_role text NOT NULL DEFAULT 'Scriptwriter',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;

CREATE OR REPLACE FUNCTION public.is_project_member(_project uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.project_members WHERE project_id = _project AND user_id = _user)
      OR EXISTS (SELECT 1 FROM public.projects WHERE id = _project AND owner_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.is_project_owner(_project uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = _project AND owner_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.is_project_public(_project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = _project AND is_draft = false);
$$;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View public or member projects" ON public.projects FOR SELECT TO authenticated
  USING (is_draft = false OR owner_id = auth.uid() OR public.is_project_member(id, auth.uid()));
CREATE POLICY "Create own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Members update projects" ON public.projects FOR UPDATE TO authenticated
  USING (public.is_project_member(id, auth.uid())) WITH CHECK (public.is_project_member(id, auth.uid()));
CREATE POLICY "Owners delete projects" ON public.projects FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.guard_project_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  IF auth.uid() IS NOT NULL AND OLD.owner_id <> auth.uid() THEN
    IF NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.genres IS DISTINCT FROM OLD.genres OR NEW.primary_genre IS DISTINCT FROM OLD.primary_genre
       OR NEW.status IS DISTINCT FROM OLD.status OR NEW.is_draft IS DISTINCT FROM OLD.is_draft
       OR NEW.required_roles IS DISTINCT FROM OLD.required_roles OR NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
      RAISE EXCEPTION 'Only the project owner can change project details';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER projects_guard BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.guard_project_update();

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View members of visible projects" ON public.project_members FOR SELECT TO authenticated
  USING (public.is_project_public(project_id) OR public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Join public projects or owner adds" ON public.project_members FOR INSERT TO authenticated
  WITH CHECK (
    public.is_project_owner(project_id, auth.uid())
    OR (user_id = auth.uid() AND role_in_project = 'member' AND public.is_project_public(project_id))
  );
CREATE POLICY "Owner updates members" ON public.project_members FOR UPDATE TO authenticated
  USING (public.is_project_owner(project_id, auth.uid()));
CREATE POLICY "Leave or owner removes" ON public.project_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_project_owner(project_id, auth.uid()));

-- ===================== SCRIPTS =====================
CREATE TABLE public.project_scripts (
  project_id uuid PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name text NOT NULL DEFAULT 'script.txt',
  format text NOT NULL DEFAULT 'editor',
  file_path text,
  text_content text NOT NULL DEFAULT '',
  html_preview text,
  access_level text NOT NULL DEFAULT 'team_members',
  uploaded_by uuid NOT NULL,
  uploaded_by_name text NOT NULL DEFAULT '',
  file_size integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_scripts TO authenticated;
GRANT ALL ON public.project_scripts TO service_role;
ALTER TABLE public.project_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read scripts by access level" ON public.project_scripts FOR SELECT TO authenticated
  USING (
    public.is_project_owner(project_id, auth.uid())
    OR (access_level = 'team_members' AND public.is_project_member(project_id, auth.uid()))
    OR (access_level = 'all_collaborators' AND (public.is_project_member(project_id, auth.uid()) OR public.is_project_public(project_id)))
  );
CREATE POLICY "Members write scripts" ON public.project_scripts FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id, auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "Members update scripts" ON public.project_scripts FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members delete scripts" ON public.project_scripts FOR DELETE TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));
CREATE TRIGGER scripts_touch BEFORE UPDATE ON public.project_scripts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===================== MESSAGES =====================
CREATE TABLE public.project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'chat',
  topic_title text,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  sender_avatar text NOT NULL DEFAULT '',
  sender_role text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  attachment jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX project_messages_project_idx ON public.project_messages(project_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.project_messages TO authenticated;
GRANT ALL ON public.project_messages TO service_role;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read messages" ON public.project_messages FOR SELECT TO authenticated USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members post messages" ON public.project_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Senders delete messages" ON public.project_messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

CREATE TABLE public.message_reactions (
  message_id uuid NOT NULL REFERENCES public.project_messages(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, reaction)
);
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read reactions" ON public.message_reactions FOR SELECT TO authenticated USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members react" ON public.message_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Users remove own reactions" ON public.message_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ===================== MEDIA =====================
CREATE TABLE public.project_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  media_category text NOT NULL DEFAULT 'document',
  file_size bigint NOT NULL DEFAULT 0,
  uploaded_by uuid NOT NULL,
  uploaded_by_name text NOT NULL DEFAULT '',
  duration_seconds numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.project_media TO authenticated;
GRANT ALL ON public.project_media TO service_role;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read media" ON public.project_media FOR SELECT TO authenticated USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members add media" ON public.project_media FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Uploaders delete media" ON public.project_media FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.is_project_owner(project_id, auth.uid()));

-- ===================== INVITES =====================
CREATE TABLE public.project_invites (
  code text PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role_offered text,
  target_user_id uuid,
  target_name text,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_invites TO authenticated;
GRANT ALL ON public.project_invites TO service_role;
ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or project invites" ON public.project_invites FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR target_user_id = auth.uid() OR public.is_project_owner(project_id, auth.uid()));
CREATE POLICY "Owners create invites" ON public.project_invites FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_project_owner(project_id, auth.uid()));
CREATE POLICY "Owners or targets update invites" ON public.project_invites FOR UPDATE TO authenticated
  USING (public.is_project_owner(project_id, auth.uid()) OR target_user_id = auth.uid());
CREATE POLICY "Owners delete invites" ON public.project_invites FOR DELETE TO authenticated
  USING (public.is_project_owner(project_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.lookup_invite(_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to view invites'; END IF;
  SELECT i.*, p.title, p.primary_genre, p.status AS project_status, p.owner_id, p.owner_name
    INTO r FROM public.project_invites i JOIN public.projects p ON p.id = i.project_id
    WHERE i.code = upper(trim(_code));
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite code not found'; END IF;
  RETURN jsonb_build_object(
    'code', r.code, 'project_id', r.project_id, 'project_title', r.title,
    'project_primary_genre', r.primary_genre, 'project_status', r.project_status,
    'owner_id', r.owner_id, 'owner_name', r.owner_name, 'role_offered', r.role_offered,
    'target_user_id', r.target_user_id, 'target_name', r.target_name,
    'created_by', r.created_by, 'created_at', r.created_at, 'status', r.status);
END; $$;

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
  IF NOT already THEN
    INSERT INTO public.project_members(project_id, user_id, role_in_project, creative_role)
    VALUES (inv.project_id, auth.uid(), 'member', COALESCE(NULLIF(_role, ''), inv.role_offered, 'Scriptwriter'));
  END IF;
  IF inv.target_user_id IS NOT NULL THEN
    UPDATE public.project_invites SET status = 'accepted', accepted_by = auth.uid(), updated_at = now() WHERE code = inv.code;
  END IF;
  RETURN jsonb_build_object('project_id', inv.project_id, 'already_member', already);
END; $$;

REVOKE EXECUTE ON FUNCTION public.lookup_invite(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_invite(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_invite(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_public(uuid) TO authenticated;

-- ===================== REALTIME =====================
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_media;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_scripts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ===================== STORAGE POLICIES =====================
CREATE POLICY "Signed-in users read profile media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-media');
CREATE POLICY "Users upload own profile media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own profile media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own profile media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.can_read_project_file(_name text, _user uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE parts text[]; pid uuid;
BEGIN
  parts := string_to_array(_name, '/');
  BEGIN pid := parts[1]::uuid; EXCEPTION WHEN others THEN RETURN false; END;
  IF public.is_project_member(pid, _user) THEN RETURN true; END IF;
  RETURN parts[2] = 'portfolio' AND public.is_project_public(pid);
END; $$;

CREATE OR REPLACE FUNCTION public.can_write_project_file(_name text, _user uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid;
BEGIN
  BEGIN pid := (string_to_array(_name, '/'))[1]::uuid; EXCEPTION WHEN others THEN RETURN false; END;
  RETURN public.is_project_member(pid, _user);
END; $$;
GRANT EXECUTE ON FUNCTION public.can_read_project_file(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_project_file(text, uuid) TO authenticated;

CREATE POLICY "Members read project files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'project-files' AND public.can_read_project_file(name, auth.uid()));
CREATE POLICY "Members upload project files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files' AND public.can_write_project_file(name, auth.uid()));
CREATE POLICY "Members delete project files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-files' AND public.can_write_project_file(name, auth.uid()));
