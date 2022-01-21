ALTER TABLE  public.establishments
ADD IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true; 