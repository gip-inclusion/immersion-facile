--
-- PostgreSQL database dump
--

-- Dumped from database version 13.4 (Debian 13.4-1.pgdg100+1)
-- Dumped by pg_dump version 14.0 (Ubuntu 14.0-1.pgdg18.04+1)

-- Started on 2021-10-06 19:32:16 CEST

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

--
-- TOC entry 632 (class 1247 OID 16424)
-- Name: contact_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contact_mode AS ENUM (
    'phone',
    'mail',
    'in_person'
);


ALTER TYPE public.contact_mode OWNER TO postgres;

--
-- TOC entry 635 (class 1247 OID 16432)
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
-- TOC entry 202 (class 1259 OID 16459)
-- Name: immersion_contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.immersion_contacts (
    uuid uuid NOT NULL,
    name text,
    firstname text,
    email text,
    role text,
    siret_institution bigint
);


ALTER TABLE public.immersion_contacts OWNER TO postgres;

--
-- TOC entry 200 (class 1259 OID 16385)
-- Name: immersion_proposals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.immersion_proposals (
    uuid uuid,
    rome character(5) NOT NULL,
    naf character(5) NOT NULL,
    siret bigint NOT NULL,
    name text,
    number_displays bigint DEFAULT 0,
    number_connections integer DEFAULT 0,
    number_immersions integer DEFAULT 0,
    voluntary_to_immersion boolean DEFAULT false,
    data_source public.data_source,
    contact_in_company_uuid uuid,
    creation_date timestamp without time zone DEFAULT now(),
    update_date timestamp without time zone DEFAULT now(),
    score real DEFAULT 0
);


ALTER TABLE public.immersion_proposals OWNER TO postgres;

--
-- TOC entry 201 (class 1259 OID 16415)
-- Name: institutions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.institutions (
    siret bigint NOT NULL,
    name text,
    address text,
    number_employees integer,
    naf character(5),
    contact_mode public.contact_mode,
    data_source public.data_source,
    update_date timestamp without time zone DEFAULT now(),
    creation_date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.institutions OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 16512)
-- Name: searches_made; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.searches_made (
    rome character(5) NOT NULL,
    lat double precision NOT NULL,
    lon double precision NOT NULL,
    distance double precision NOT NULL,
    needstobesearched boolean DEFAULT true,
    update_date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.searches_made OWNER TO postgres;







--
-- TOC entry 2842 (class 2606 OID 16466)
-- Name: immersion_contacts pk_company_contact; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immersion_contacts
    ADD CONSTRAINT pk_company_contact PRIMARY KEY (uuid);


--
-- TOC entry 2837 (class 2606 OID 16414)
-- Name: immersion_proposals pk_immersion_proposals; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immersion_proposals
    ADD CONSTRAINT pk_immersion_proposals PRIMARY KEY (rome, naf, siret);


--
-- TOC entry 2839 (class 2606 OID 16419)
-- Name: institutions pk_institutions; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT pk_institutions PRIMARY KEY (siret);


--
-- TOC entry 2845 (class 2606 OID 16516)
-- Name: searches_made pk_searches_made; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.searches_made
    ADD CONSTRAINT pk_searches_made PRIMARY KEY (rome, lat, lon, distance);


--
-- TOC entry 2833 (class 1259 OID 16472)
-- Name: fki_fk_company_contact; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_fk_company_contact ON public.immersion_proposals USING btree (contact_in_company_uuid);


--
-- TOC entry 2834 (class 1259 OID 16490)
-- Name: fki_fk_institution_siret; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_fk_institution_siret ON public.immersion_proposals USING btree (siret);


--
-- TOC entry 2840 (class 1259 OID 16496)
-- Name: fki_fk_siret_institution; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_fk_siret_institution ON public.immersion_contacts USING btree (siret_institution);


--
-- TOC entry 2843 (class 1259 OID 16518)
-- Name: index_needstobesearched; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_needstobesearched ON public.searches_made USING btree (needstobesearched);


--
-- TOC entry 2835 (class 1259 OID 16497)
-- Name: index_number_displays; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_number_displays ON public.immersion_proposals USING btree (number_displays);


--
-- TOC entry 2846 (class 2606 OID 16467)
-- Name: immersion_proposals fk_company_contact; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immersion_proposals
    ADD CONSTRAINT fk_company_contact FOREIGN KEY (contact_in_company_uuid) REFERENCES public.immersion_contacts(uuid) NOT VALID;


--
-- TOC entry 2847 (class 2606 OID 16485)
-- Name: immersion_proposals fk_institution_siret; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immersion_proposals
    ADD CONSTRAINT fk_institution_siret FOREIGN KEY (siret) REFERENCES public.institutions(siret) NOT VALID;


--
-- TOC entry 2848 (class 2606 OID 16491)
-- Name: immersion_contacts fk_siret_institution; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immersion_contacts
    ADD CONSTRAINT fk_siret_institution FOREIGN KEY (siret_institution) REFERENCES public.institutions(siret) NOT VALID;


-- Completed on 2021-10-06 19:32:20 CEST

--
-- PostgreSQL database dump complete
--

