CREATE TABLE public.outbox (
    id uuid PRIMARY KEY,
    occurred_at timestamp NOT NULL,
    was_published boolean DEFAULT false,
    was_quarantined boolean DEFAULT false,
    topic varchar(255) NOT NULL,
    payload jsonb NOT NULL
);
