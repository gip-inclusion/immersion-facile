CREATE TABLE public.form_establishments (
    id uuid PRIMARY KEY,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    siret char(14) NOT NULL,
    business_name varchar(255) NOT NULL,
    business_address varchar(255) NOT NULL,
    naf jsonb,
    professions jsonb NOT NULL,
    business_contacts jsonb NOT NULL,
    preferred_contact_methods jsonb NOT NULL
);

-- Automatically update the form_establishments column on any row change.

CREATE OR REPLACE FUNCTION public.update_form_establishments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_form_establishments_updated_at BEFORE UPDATE
  ON public.form_establishments FOR EACH ROW EXECUTE PROCEDURE
  public.update_form_establishments_updated_at_column();
