ALTER TABLE public.agencies 
ADD IF NOT EXISTS "position" public.geography(Point, 4326) NOT NULL DEFAULT public.st_geographyfromtext('POINT(0.00 0.00)'::text);
