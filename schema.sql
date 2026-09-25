--
-- PostgreSQL database dump
--

\restrict 5BX8WtgpkmESPpPx4WosZCzGCNavKEAgLRsIgMu6eEuVTcjC8myA7h9j50GzeXH

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendance_status AS ENUM (
    'present',
    'absent',
    'excused'
);


--
-- Name: gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.gender AS ENUM (
    'male',
    'female',
    'other'
);


--
-- Name: media_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.media_status AS ENUM (
    'draft',
    'active',
    'archived'
);


--
-- Name: medical_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.medical_status AS ENUM (
    'fit',
    'unfit',
    'pending'
);


--
-- Name: mission_assignment_grading_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mission_assignment_grading_status AS ENUM (
    'pending',
    'scored',
    'exempt'
);


--
-- Name: mission_result; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mission_result AS ENUM (
    'passed',
    'failed'
);


--
-- Name: mission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mission_status AS ENUM (
    'draft',
    'published',
    'completed',
    'cancelled',
    'in_progress'
);


--
-- Name: personnel_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.personnel_type AS ENUM (
    'pilot',
    'trainee',
    'instructor'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aircraft; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aircraft (
    id integer NOT NULL,
    name character varying NOT NULL,
    tail_number character varying NOT NULL,
    serial_number character varying,
    aircraft_type character varying,
    induction_date date,
    remarks character varying,
    status character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: aircraft_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.aircraft ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.aircraft_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: area; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.area (
    id integer NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    description character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    address character varying
);


--
-- Name: area_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.area ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.area_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: grading_template_attribute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grading_template_attribute (
    id integer CONSTRAINT gradding_template_criteria_id_not_null NOT NULL,
    grading_template_id integer CONSTRAINT gradding_template_criteria_template_id_not_null NOT NULL,
    attribute_id integer CONSTRAINT gradding_template_criteria_criteria_id_not_null NOT NULL,
    weight integer CONSTRAINT gradding_template_criteria_weight_not_null NOT NULL,
    created_at timestamp without time zone DEFAULT now() CONSTRAINT gradding_template_criteria_created_at_not_null NOT NULL,
    updated_at timestamp without time zone DEFAULT now() CONSTRAINT gradding_template_criteria_updated_at_not_null NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: gradding_template_criteria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.grading_template_attribute ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.gradding_template_criteria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: grading_attribute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grading_attribute (
    id integer CONSTRAINT grading_criteria_id_not_null NOT NULL,
    name character varying CONSTRAINT grading_criteria_name_not_null NOT NULL,
    notes character varying,
    created_at timestamp without time zone DEFAULT now() CONSTRAINT grading_criteria_created_at_not_null NOT NULL,
    updated_at timestamp without time zone DEFAULT now() CONSTRAINT grading_criteria_updated_at_not_null NOT NULL
);


--
-- Name: grading_criteria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.grading_attribute ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.grading_criteria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: grading_scale; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grading_scale (
    id integer NOT NULL,
    name character varying NOT NULL,
    notes character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: grading_scale_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.grading_scale ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.grading_scale_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: grading_scale_option; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grading_scale_option (
    id integer NOT NULL,
    grading_scale_id integer NOT NULL,
    label character varying NOT NULL,
    point numeric(5,2) NOT NULL,
    lower_bound numeric(5,2) CONSTRAINT grading_scale_option_min_value_not_null NOT NULL,
    upper_bound numeric(5,2) CONSTRAINT grading_scale_option_max_value_not_null NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: grading_scale_option_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.grading_scale_option ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.grading_scale_option_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: grading_template; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grading_template (
    id integer NOT NULL,
    name character varying NOT NULL,
    notes character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    grading_scale_id integer NOT NULL
);


--
-- Name: grading_template_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.grading_template ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.grading_template_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: location; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location (
    id integer NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    description character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    address character varying,
    phone character varying
);


--
-- Name: location_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.location ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.location_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media (
    id integer NOT NULL,
    path character varying NOT NULL,
    status public.media_status DEFAULT 'draft'::public.media_status NOT NULL,
    mime_type character varying NOT NULL,
    size integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    original_file_name character varying NOT NULL,
    status_updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.media ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mission (
    id integer NOT NULL,
    name character varying NOT NULL,
    aircraft_id integer,
    description character varying DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    duration_minutes integer DEFAULT 60 NOT NULL,
    mission_type character varying DEFAULT 'flight'::character varying NOT NULL,
    grading_template_id integer
);


--
-- Name: mission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.mission ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mission_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mission_schedule (
    id integer NOT NULL,
    mission_id integer NOT NULL,
    schedule_number character varying NOT NULL,
    name character varying NOT NULL,
    description character varying DEFAULT ''::character varying NOT NULL,
    start_date_time timestamp without time zone,
    end_date_time timestamp without time zone,
    area_id integer,
    status public.mission_status DEFAULT 'draft'::public.mission_status NOT NULL,
    remarks character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mission_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.mission_schedule ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mission_schedule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mission_schedule_participant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mission_schedule_participant (
    id integer NOT NULL,
    mission_schedule_id integer NOT NULL,
    personnel_id integer NOT NULL,
    attendance_status public.attendance_status,
    aircraft_id integer,
    aircraft_time timestamp without time zone,
    takeoff_time timestamp without time zone,
    landing_time timestamp without time zone,
    remarks character varying,
    obtained_grade_id integer,
    obtained_score_value numeric(10,2),
    obtained_score_percentage numeric(5,2),
    scored_status public.mission_assignment_grading_status DEFAULT 'pending'::public.mission_assignment_grading_status NOT NULL,
    result public.mission_result,
    "order" integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mission_schedule_participant_grading; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mission_schedule_participant_grading (
    id integer NOT NULL,
    mission_schedule_participant_id integer CONSTRAINT mission_schedule_participan_mission_schedule_participa_not_null NOT NULL,
    grading_template_attribute_id integer CONSTRAINT mission_schedule_participan_grading_template_attribute_not_null NOT NULL,
    grading_scale_option_id integer,
    weight_at_grading integer,
    obtained_score_value numeric(5,2),
    status public.mission_assignment_grading_status DEFAULT 'pending'::public.mission_assignment_grading_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mission_schedule_participant_grading_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.mission_schedule_participant_grading ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mission_schedule_participant_grading_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mission_schedule_participant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.mission_schedule_participant ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mission_schedule_participant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personnel (
    id integer NOT NULL,
    personnel_type public.personnel_type NOT NULL,
    batch_no character varying,
    code character varying,
    first_name character varying NOT NULL,
    last_name character varying,
    gender public.gender NOT NULL,
    date_of_birth date,
    date_of_join date,
    rank character varying,
    phone character varying,
    email character varying,
    address character varying,
    image_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    medical_status public.medical_status DEFAULT 'pending'::public.medical_status NOT NULL,
    medical_exam_date date,
    medical_valid_until date,
    user_id integer,
    qualification character varying
);


--
-- Name: personnel_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.personnel ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.personnel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire_at timestamp without time zone NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    username character varying(60) NOT NULL,
    password character varying,
    last_login_at timestamp without time zone,
    password_changed_at timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    email character varying(255),
    name character varying(255),
    role character varying
);


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."user" ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: aircraft aircraft_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aircraft
    ADD CONSTRAINT aircraft_pkey PRIMARY KEY (id);


--
-- Name: aircraft aircraft_tail_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aircraft
    ADD CONSTRAINT aircraft_tail_number_key UNIQUE (tail_number);


--
-- Name: area area_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area
    ADD CONSTRAINT area_code_key UNIQUE (code);


--
-- Name: area area_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area
    ADD CONSTRAINT area_pkey PRIMARY KEY (id);


--
-- Name: grading_template_attribute gradding_template_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grading_template_attribute
    ADD CONSTRAINT gradding_template_criteria_pkey PRIMARY KEY (id);


--
-- Name: grading_attribute grading_criteria_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grading_attribute
    ADD CONSTRAINT grading_criteria_name_key UNIQUE (name);


--
-- Name: grading_attribute grading_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grading_attribute
    ADD CONSTRAINT grading_criteria_pkey PRIMARY KEY (id);


--
-- Name: grading_scale_option grading_scale_option_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grading_scale_option
    ADD CONSTRAINT grading_scale_option_pkey PRIMARY KEY (id);


--
-- Name: grading_scale grading_scale_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grading_scale
    ADD CONSTRAINT grading_scale_pkey PRIMARY KEY (id);


--
-- Name: grading_template grading_template_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grading_template
    ADD CONSTRAINT grading_template_pkey PRIMARY KEY (id);


--
-- Name: location location_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_code_key UNIQUE (code);


--
-- Name: location location_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: mission mission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission
    ADD CONSTRAINT mission_pkey PRIMARY KEY (id);


--
-- Name: mission_schedule_participant_grading mission_schedule_participant_grading_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule_participant_grading
    ADD CONSTRAINT mission_schedule_participant_grading_pkey PRIMARY KEY (id);


--
-- Name: mission_schedule_participant mission_schedule_participant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule_participant
    ADD CONSTRAINT mission_schedule_participant_pkey PRIMARY KEY (id);


--
-- Name: mission_schedule mission_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule
    ADD CONSTRAINT mission_schedule_pkey PRIMARY KEY (id);


--
-- Name: mission_schedule mission_schedule_schedule_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule
    ADD CONSTRAINT mission_schedule_schedule_number_key UNIQUE (schedule_number);


--
-- Name: personnel personnel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_pkey PRIMARY KEY (id);


--
-- Name: personnel personnel_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_user_id_key UNIQUE (user_id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: user user_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_username_key UNIQUE (username);


--
-- Name: media_status_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_status_created_idx ON public.media USING btree (status, created_at);


--
-- Name: unique_grading_scale_id_label_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_grading_scale_id_label_idx ON public.grading_scale_option USING btree (grading_scale_id, label);


--
-- Name: unique_mission_schedule_id_personnel_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_mission_schedule_id_personnel_id_idx ON public.mission_schedule_participant USING btree (mission_schedule_id, personnel_id);


--
-- Name: unique_mission_schedule_participant_id_grading_template_attribu; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_mission_schedule_participant_id_grading_template_attribu ON public.mission_schedule_participant_grading USING btree (mission_schedule_participant_id, grading_template_attribute_id);


--
-- Name: unique_template_id_attribute_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_template_id_attribute_id_idx ON public.grading_template_attribute USING btree (grading_template_id, attribute_id);


--
-- Name: grading_template_attribute gradding_template_criteria_criteria_id_grading_criteria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grading_template_attribute
    ADD CONSTRAINT gradding_template_criteria_criteria_id_grading_criteria_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.grading_attribute(id);


--
-- Name: grading_template_attribute gradding_template_criteria_template_id_grading_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grading_template_attribute
    ADD CONSTRAINT gradding_template_criteria_template_id_grading_template_id_fkey FOREIGN KEY (grading_template_id) REFERENCES public.grading_template(id) ON DELETE CASCADE;


--
-- Name: grading_scale_option grading_scale_option_grading_scale_id_grading_scale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grading_scale_option
    ADD CONSTRAINT grading_scale_option_grading_scale_id_grading_scale_id_fkey FOREIGN KEY (grading_scale_id) REFERENCES public.grading_scale(id) ON DELETE CASCADE;


--
-- Name: grading_template grading_template_grading_scale_id_grading_scale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grading_template
    ADD CONSTRAINT grading_template_grading_scale_id_grading_scale_id_fkey FOREIGN KEY (grading_scale_id) REFERENCES public.grading_scale(id);


--
-- Name: mission mission_aircraft_id_aircraft_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission
    ADD CONSTRAINT mission_aircraft_id_aircraft_id_fkey FOREIGN KEY (aircraft_id) REFERENCES public.aircraft(id);


--
-- Name: mission mission_grading_template_id_grading_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission
    ADD CONSTRAINT mission_grading_template_id_grading_template_id_fkey FOREIGN KEY (grading_template_id) REFERENCES public.grading_template(id);


--
-- Name: mission_schedule mission_schedule_area_id_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule
    ADD CONSTRAINT mission_schedule_area_id_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.area(id);


--
-- Name: mission_schedule mission_schedule_mission_id_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule
    ADD CONSTRAINT mission_schedule_mission_id_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.mission(id);


--
-- Name: mission_schedule_participant mission_schedule_participant_8QMkCI2LrHrF_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule_participant
    ADD CONSTRAINT "mission_schedule_participant_8QMkCI2LrHrF_fkey" FOREIGN KEY (obtained_grade_id) REFERENCES public.grading_scale_option(id);


--
-- Name: mission_schedule_participant mission_schedule_participant_aircraft_id_aircraft_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule_participant
    ADD CONSTRAINT mission_schedule_participant_aircraft_id_aircraft_id_fkey FOREIGN KEY (aircraft_id) REFERENCES public.aircraft(id);


--
-- Name: mission_schedule_participant mission_schedule_participant_eundV0tqkcyU_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule_participant
    ADD CONSTRAINT "mission_schedule_participant_eundV0tqkcyU_fkey" FOREIGN KEY (mission_schedule_id) REFERENCES public.mission_schedule(id) ON DELETE CASCADE;


--
-- Name: mission_schedule_participant_grading mission_schedule_participant_grading_H1YYr46q8p2v_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule_participant_grading
    ADD CONSTRAINT "mission_schedule_participant_grading_H1YYr46q8p2v_fkey" FOREIGN KEY (grading_template_attribute_id) REFERENCES public.grading_template_attribute(id);


--
-- Name: mission_schedule_participant_grading mission_schedule_participant_grading_RZy9ohg6DdLj_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule_participant_grading
    ADD CONSTRAINT "mission_schedule_participant_grading_RZy9ohg6DdLj_fkey" FOREIGN KEY (grading_scale_option_id) REFERENCES public.grading_scale_option(id);


--
-- Name: mission_schedule_participant_grading mission_schedule_participant_grading_ZO8d1i2Hgqll_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule_participant_grading
    ADD CONSTRAINT "mission_schedule_participant_grading_ZO8d1i2Hgqll_fkey" FOREIGN KEY (mission_schedule_participant_id) REFERENCES public.mission_schedule_participant(id) ON DELETE CASCADE;


--
-- Name: mission_schedule_participant mission_schedule_participant_personnel_id_personnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_schedule_participant
    ADD CONSTRAINT mission_schedule_participant_personnel_id_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES public.personnel(id);


--
-- Name: personnel personnel_image_id_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_image_id_media_id_fkey FOREIGN KEY (image_id) REFERENCES public.media(id);


--
-- Name: personnel personnel_user_id_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_user_id_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 5BX8WtgpkmESPpPx4WosZCzGCNavKEAgLRsIgMu6eEuVTcjC8myA7h9j50GzeXH

