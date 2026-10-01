CREATE TYPE public.station_type AS ENUM ('swap','charging','both');
CREATE TYPE public.review_status AS ENUM ('pending','approved','rejected','suspended');

CREATE TABLE public.stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  station_type public.station_type NOT NULL DEFAULT 'both',
  services text[] NOT NULL DEFAULT '{}',
  compatibility text[] NOT NULL DEFAULT '{}',
  swap_price text NOT NULL DEFAULT '',
  charging_price text NOT NULL DEFAULT '',
  contact_for_pricing boolean NOT NULL DEFAULT false,
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  opening_hours jsonb NOT NULL DEFAULT '[]'::jsonb,
  address text NOT NULL DEFAULT '',
  town text NOT NULL DEFAULT '',
  county text NOT NULL DEFAULT '',
  access_instructions text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  photo_paths text[] NOT NULL DEFAULT '{}',
  review_status public.review_status NOT NULL DEFAULT 'pending',
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stations_owner_idx ON public.stations(owner_id);
CREATE INDEX stations_status_idx ON public.stations(review_status);

GRANT SELECT ON public.stations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stations TO authenticated;
GRANT ALL ON public.stations TO service_role;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads approved stations" ON public.stations FOR SELECT TO anon, authenticated USING (review_status = 'approved');
CREATE POLICY "Owners read own stations" ON public.stations FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Admins read all stations" ON public.stations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners insert own stations" ON public.stations FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND review_status = 'pending');
CREATE POLICY "Owners update own stations" ON public.stations FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins update stations" ON public.stations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete own stations" ON public.stations FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.guard_station_review_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.review_status IS DISTINCT FROM OLD.review_status
     AND NOT public.has_role(auth.uid(),'admin')
     AND coalesce(auth.role(),'') <> 'service_role' THEN
    RAISE EXCEPTION 'Only admins can change review status';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER stations_guard BEFORE UPDATE ON public.stations FOR EACH ROW EXECUTE FUNCTION public.guard_station_review_status();

CREATE POLICY "Station photos read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'station-photos');
CREATE POLICY "Owners upload station photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'station-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete station photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'station-photos' AND (storage.foldername(name))[1] = auth.uid()::text);