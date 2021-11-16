

CREATE TABLE public.appellations_public_data (
    ogr_appellation INTEGER PRIMARY KEY,
    code_rome character(5) NOT NULL,
    libelle_appellation_long varchar(255) NOT NULL,
    libelle_appellation_court varchar(255) NOT NULL,
    libelle_appellation_long_tsvector tsvector
);

CREATE TABLE public.romes_public_data (
    code_rome character(5) NOT NULL PRIMARY KEY,
    libelle_rome varchar(255) NOT NULL,
    libelle_rome_tsvector tsvector
);

-- for full text search :
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA pg_catalog;

ALTER TABLE ONLY public.appellations_public_data
    ADD CONSTRAINT fk_establishment_contact FOREIGN KEY (code_rome) REFERENCES public.romes_public_data(code_rome) NOT VALID;


CREATE INDEX textsearch_libelle_appellation_long ON public.appellations_public_data USING GIN (libelle_appellation_long_tsvector);
CREATE INDEX textsearch_libelle_rome ON public.romes_public_data USING GIN (libelle_rome_tsvector);

CREATE INDEX textsearch_libelle_appellation_long_like ON public.appellations_public_data USING GIN (libelle_appellation_long gin_trgm_ops);
CREATE INDEX textsearch_libelle_rome_like ON public.romes_public_data USING GIN (libelle_rome gin_trgm_ops);
