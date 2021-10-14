

--
-- PostgreSQL database dump
--

-- Dumped from database version 13.4 (Debian 13.4-1.pgdg100+1)
-- Dumped by pg_dump version 14.0 (Ubuntu 14.0-1.pgdg18.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS postgis;
--
-- Name: contact_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contact_mode AS ENUM (
    'phone',
    'mail',
    'in_person'
);


ALTER TYPE public.contact_mode OWNER TO postgres;

--
-- Name: data_source; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.data_source AS ENUM (
    'form',
    'api_sirene',
    'api_labonneboite',
    'api_laplateformedelinclusion'
);


ALTER TYPE public.data_source OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: establishments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.establishments (
    siret bigint NOT NULL,
    name text,
    address text,
    number_employees integer,
    naf character(5),
    contact_mode public.contact_mode,
    data_source public.data_source,
    update_date timestamp without time zone DEFAULT now(),
    creation_date timestamp without time zone DEFAULT now(),
    gps public.geography(Point,4326) DEFAULT public.st_geographyfromtext('POINT(2.19 48.5200)'::text)
);


ALTER TABLE public.establishments OWNER TO postgres;

--
-- Name: immersion_contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.immersion_contacts (
    uuid uuid NOT NULL,
    name text,
    firstname text,
    email text,
    role text,
    siret_establishment bigint,
    phone text
);


ALTER TABLE public.immersion_contacts OWNER TO postgres;

--
-- Name: immersion_offers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.immersion_offers (
    uuid uuid,
    rome character(5) NOT NULL,
    division character(5) NOT NULL,
    siret bigint NOT NULL,
    naf character(5) NOT NULL,
    name text,
    number_displays bigint DEFAULT 0,
    number_connections integer DEFAULT 0,
    number_immersions integer DEFAULT 0,
    voluntary_to_immersion boolean DEFAULT false,
    data_source public.data_source,
    contact_in_establishment_uuid uuid,
    creation_date timestamp without time zone DEFAULT now(),
    update_date timestamp without time zone DEFAULT now(),
    score real DEFAULT 0,
    gps public.geography(Point,4326) DEFAULT public.st_geographyfromtext('POINT(2.19 48.5200)'::text)
);


ALTER TABLE public.immersion_offers OWNER TO postgres;

--
-- Name: searches_made; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.searches_made (
    rome character(5) NOT NULL,
    lat double precision NOT NULL,
    lon double precision NOT NULL,
    distance double precision NOT NULL,
    needstobesearched boolean DEFAULT true,
    update_date timestamp without time zone DEFAULT now(),
    gps public.geography(Point,4326) DEFAULT public.st_geographyfromtext('POINT(2.19 48.5200)'::text)
);


ALTER TABLE public.searches_made OWNER TO postgres;

--
-- Name: immersion_contacts pk_establishment_contact; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immersion_contacts
    ADD CONSTRAINT pk_establishment_contact PRIMARY KEY (uuid);


--
-- Name: establishments pk_establishments; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.establishments
    ADD CONSTRAINT pk_establishments PRIMARY KEY (siret);


--
-- Name: immersion_offers pk_immersion_offers; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immersion_offers
    ADD CONSTRAINT pk_immersion_offers PRIMARY KEY (rome, division, siret);


--
-- Name: searches_made pk_searches_made; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.searches_made
    ADD CONSTRAINT pk_searches_made PRIMARY KEY (rome, lat, lon, distance);


--
-- Name: fki_fk_establishment_contact; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_fk_establishment_contact ON public.immersion_offers USING btree (contact_in_establishment_uuid);


--
-- Name: fki_fk_establishment_siret; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_fk_establishment_siret ON public.immersion_offers USING btree (siret);


--
-- Name: fki_fk_siret_establishment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_fk_siret_establishment ON public.immersion_contacts USING btree (siret_establishment);


--
-- Name: index_needstobesearched; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_needstobesearched ON public.searches_made USING btree (needstobesearched);


--
-- Name: index_number_displays; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_number_displays ON public.immersion_offers USING btree (number_displays);


--
-- Name: immersion_offers fk_establishment_contact; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immersion_offers
    ADD CONSTRAINT fk_establishment_contact FOREIGN KEY (contact_in_establishment_uuid) REFERENCES public.immersion_contacts(uuid) NOT VALID;


--
-- Name: immersion_offers fk_establishment_siret; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immersion_offers
    ADD CONSTRAINT fk_establishment_siret FOREIGN KEY (siret) REFERENCES public.establishments(siret) NOT VALID;


--
-- Name: immersion_contacts fk_siret_establishment; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immersion_contacts
    ADD CONSTRAINT fk_siret_establishment FOREIGN KEY (siret_establishment) REFERENCES public.establishments(siret) NOT VALID;


--
-- PostgreSQL database dump complete
--
