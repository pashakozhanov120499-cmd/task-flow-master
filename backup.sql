--
-- PostgreSQL database dump
--

\restrict N98SkGTwQ79myWOF3gUgOvqqiwCaHkWRdAFDNcE57QQkKSjiJaXMsyKG8FvFwTf

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: boards; Type: TABLE; Schema: public; Owner: taskflow
--

CREATE TABLE public.boards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.boards OWNER TO taskflow;

--
-- Name: columns; Type: TABLE; Schema: public; Owner: taskflow
--

CREATE TABLE public.columns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    board_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    status_id character varying(100) NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.columns OWNER TO taskflow;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: taskflow
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    board_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(100) DEFAULT 'plan'::character varying NOT NULL,
    priority character varying(20),
    assignee character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tasks_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])))
);


ALTER TABLE public.tasks OWNER TO taskflow;

--
-- Data for Name: boards; Type: TABLE DATA; Schema: public; Owner: taskflow
--

COPY public.boards (id, name, description, created_at, updated_at) FROM stdin;
791a76ec-cc8b-429a-9e02-29dfbad7c75c	task-flow-repo	Система управления задачами	2025-12-16 16:50:19.32386	2025-12-16 16:50:19.32386
\.


--
-- Data for Name: columns; Type: TABLE DATA; Schema: public; Owner: taskflow
--

COPY public.columns (id, board_id, title, status_id, "position", created_at) FROM stdin;
4fed794c-3899-4c73-8d8b-5bc74232ee3c	791a76ec-cc8b-429a-9e02-29dfbad7c75c	План	plan	0	2025-12-16 16:50:19.326887
869e2c43-5f0f-4d13-a663-4c8aee4fb44c	791a76ec-cc8b-429a-9e02-29dfbad7c75c	Анализ	analysis	1	2025-12-16 16:50:19.33068
59d96351-7873-4b19-848b-e9ae57dd0b65	791a76ec-cc8b-429a-9e02-29dfbad7c75c	Разработка	development	2	2025-12-16 16:50:19.332622
cbc92704-741f-4f1a-93a3-32abc3db7c09	791a76ec-cc8b-429a-9e02-29dfbad7c75c	Тестирование	testing	3	2025-12-16 16:50:19.33358
77674995-98d5-49f1-8d5e-27f7e9c9718d	791a76ec-cc8b-429a-9e02-29dfbad7c75c	Закрыто	closed	4	2025-12-16 16:50:19.334555
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: taskflow
--

COPY public.tasks (id, board_id, title, description, status, priority, assignee, created_at, updated_at) FROM stdin;
197a4661-069a-485e-abfc-532fa78a2fe7	791a76ec-cc8b-429a-9e02-29dfbad7c75c	Задача 2	Описание задачи 2	plan	high	\N	2025-12-16 19:50:45.692607	2025-12-16 19:50:45.692607
73e03a19-9f0f-4bb6-9323-8822c557b5e6	791a76ec-cc8b-429a-9e02-29dfbad7c75c	Изучить требования	Описание	analysis	low	\N	2025-12-16 19:50:33.65485	2025-12-16 19:50:47.188608
\.


--
-- Name: boards boards_pkey; Type: CONSTRAINT; Schema: public; Owner: taskflow
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_pkey PRIMARY KEY (id);


--
-- Name: columns columns_board_id_status_id_key; Type: CONSTRAINT; Schema: public; Owner: taskflow
--

ALTER TABLE ONLY public.columns
    ADD CONSTRAINT columns_board_id_status_id_key UNIQUE (board_id, status_id);


--
-- Name: columns columns_pkey; Type: CONSTRAINT; Schema: public; Owner: taskflow
--

ALTER TABLE ONLY public.columns
    ADD CONSTRAINT columns_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: taskflow
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: idx_columns_board_id; Type: INDEX; Schema: public; Owner: taskflow
--

CREATE INDEX idx_columns_board_id ON public.columns USING btree (board_id);


--
-- Name: idx_tasks_board_id; Type: INDEX; Schema: public; Owner: taskflow
--

CREATE INDEX idx_tasks_board_id ON public.tasks USING btree (board_id);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: taskflow
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: columns columns_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskflow
--

ALTER TABLE ONLY public.columns
    ADD CONSTRAINT columns_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: taskflow
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict N98SkGTwQ79myWOF3gUgOvqqiwCaHkWRdAFDNcE57QQkKSjiJaXMsyKG8FvFwTf

