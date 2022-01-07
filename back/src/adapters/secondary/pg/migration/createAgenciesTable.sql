CREATE TABLE public.agencies (
    id uuid PRIMARY KEY,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    name varchar(255) NOT NULL,
    counsellor_emails jsonb NOT NULL,
    validator_emails jsonb NOT NULL,
    admin_emails jsonb NOT NULL,
    questionnaire_url varchar(255) NOT NULL,
    email_signature varchar(255) NOT NULL,
    position public.geography(Point, 4326) NOT NULL DEFAULT public.st_geographyfromtext('POINT(0.00 0.00)'::text)
);

-- Automatically update the updated_at column on any row change.

CREATE OR REPLACE FUNCTION public.update_agencies_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE
  ON public.agencies FOR EACH ROW EXECUTE PROCEDURE
  public.update_agencies_updated_at_column();
