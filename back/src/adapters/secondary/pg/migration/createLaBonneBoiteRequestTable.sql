CREATE TABLE public.lbb_request (
    requested_at timestamp without time zone PRIMARY KEY NOT NULL,
    rome character(5) NOT NULL,
    lat double precision NOT NULL,
    lon double precision NOT NULL,
    distance_km double precision NOT NULL,
    result jsonb NOT NULL
);
