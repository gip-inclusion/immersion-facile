CREATE TABLE public.agencies (
    id uuid PRIMARY KEY,
    name varchar(255) NOT NULL,
    counsellor_emails jsonb NOT NULL,
    validator_emails jsonb NOT NULL,
    admin_emails jsonb NOT NULL,
    questionnaire_url varchar(255),
    email_signature varchar(255) NOT NULL
);
