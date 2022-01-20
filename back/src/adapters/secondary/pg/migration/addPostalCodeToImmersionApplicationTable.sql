ALTER TABLE public.immersion_applications
ADD IF NOT EXISTS "postal_code" char(5) NULL;
