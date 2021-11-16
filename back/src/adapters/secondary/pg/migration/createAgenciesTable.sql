CREATE TABLE public.agencies (
    id uuid PRIMARY KEY,
    created_at timestamp without time zone DEFAULT now(),
    name varchar(255) NOT NULL,
    counsellor_emails jsonb NOT NULL,
    validator_emails jsonb NOT NULL,
    admin_emails jsonb NOT NULL,
    questionnaire_url varchar(255) NOT NULL,
    email_signature varchar(255) NOT NULL
);
