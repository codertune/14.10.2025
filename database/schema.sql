--
-- PostgreSQL database dump
--

\restrict IihKgcA0JRh4dHgCb3Zxl8KLWHX06fkDDXdM1kC7zgfnU4KSYTjbq0Mk5EtgbcU

-- Dumped from database version 17.6 (Ubuntu 17.6-0ubuntu0.25.04.1)
-- Dumped by pg_dump version 17.6 (Ubuntu 17.6-0ubuntu0.25.04.1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: spf_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO spf_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: spf_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: automation_jobs; Type: TABLE; Schema: public; Owner: spf_user
--

CREATE TABLE public.automation_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    service_id text NOT NULL,
    service_name text NOT NULL,
    status text NOT NULL,
    priority integer DEFAULT 0,
    input_file_path text NOT NULL,
    input_file_name text NOT NULL,
    output_directory text,
    result_files jsonb DEFAULT '[]'::jsonb,
    download_url text,
    credits_used numeric(10,2) DEFAULT 0.00,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    CONSTRAINT automation_jobs_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


ALTER TABLE public.automation_jobs OWNER TO spf_user;

--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: spf_user
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(500) NOT NULL,
    slug character varying(500) NOT NULL,
    content text NOT NULL,
    excerpt text,
    author character varying(255) NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    featured boolean DEFAULT false,
    status character varying(20) DEFAULT 'draft'::character varying,
    views integer DEFAULT 0,
    meta_title character varying(500),
    meta_description text,
    meta_keywords text,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.blog_posts OWNER TO spf_user;

--
-- Name: bulk_uploads; Type: TABLE; Schema: public; Owner: spf_user
--

CREATE TABLE public.bulk_uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    service_id character varying(100) NOT NULL,
    service_name character varying(255) NOT NULL,
    original_file_name text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    total_rows integer DEFAULT 0,
    processed_rows integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.bulk_uploads OWNER TO spf_user;

--
-- Name: cleanup_logs; Type: TABLE; Schema: public; Owner: spf_user
--

CREATE TABLE public.cleanup_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cleanup_date timestamp with time zone DEFAULT now() NOT NULL,
    files_deleted integer DEFAULT 0 NOT NULL,
    space_freed_mb numeric(10,2) DEFAULT 0,
    work_history_ids jsonb DEFAULT '[]'::jsonb,
    bulk_upload_ids jsonb DEFAULT '[]'::jsonb,
    status character varying(20) DEFAULT 'success'::character varying,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cleanup_logs OWNER TO spf_user;

--
-- Name: service_templates; Type: TABLE; Schema: public; Owner: spf_user
--

CREATE TABLE public.service_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_id character varying(100) NOT NULL,
    service_name character varying(255) NOT NULL,
    description text,
    credit_cost numeric(5,2) DEFAULT 1.0,
    template_path text,
    automation_script_path text,
    validation_rules jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.service_templates OWNER TO spf_user;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: spf_user
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    credits_per_bdt numeric(5,2) DEFAULT 2.0,
    free_trial_credits integer DEFAULT 100,
    min_purchase_credits integer DEFAULT 200,
    enabled_services jsonb DEFAULT '[]'::jsonb,
    service_credits_config jsonb DEFAULT '{}'::jsonb,
    system_notification jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_settings OWNER TO spf_user;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: spf_user
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    transaction_type character varying(50) DEFAULT 'credit_purchase'::character varying,
    amount_bdt numeric(10,2) NOT NULL,
    credits_amount integer NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    transaction_id character varying(100) NOT NULL,
    gateway_reference character varying(255),
    payment_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.transactions OWNER TO spf_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: spf_user
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    company character varying(255) NOT NULL,
    mobile character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    credits numeric(10,2) DEFAULT 100.00,
    is_admin boolean DEFAULT false,
    status character varying(20) DEFAULT 'active'::character varying,
    email_verified boolean DEFAULT false,
    member_since date DEFAULT CURRENT_DATE,
    trial_ends_at date,
    total_spent numeric(10,2) DEFAULT 0,
    last_activity date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO spf_user;

--
-- Name: work_history; Type: TABLE; Schema: public; Owner: spf_user
--

CREATE TABLE public.work_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    service_id character varying(100) NOT NULL,
    service_name character varying(255) NOT NULL,
    file_name text NOT NULL,
    credits_used integer NOT NULL,
    status character varying(20) DEFAULT 'completed'::character varying,
    result_files jsonb DEFAULT '[]'::jsonb,
    download_url text,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    files_generated_count integer DEFAULT 1,
    bulk_upload_id uuid,
    row_number integer
);


ALTER TABLE public.work_history OWNER TO spf_user;

--
-- Data for Name: automation_jobs; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.automation_jobs (id, user_id, service_id, service_name, status, priority, input_file_path, input_file_name, output_directory, result_files, download_url, credits_used, error_message, created_at, started_at, completed_at) FROM stdin;
4ec37a2f-2aa2-4523-8f8e-146872454046	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759531276829-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_4ec37a2f-2aa2-4523-8f8e-146872454046	["damco_tracking_report_20251003_224142.pdf", "pdfs/001_CTG2358534_tracking.pdf", "pdfs/002_CTG2358538_tracking.pdf"]	/api/download/job/4ec37a2f-2aa2-4523-8f8e-146872454046/damco_tracking_report_20251003_224142.pdf	1	\N	2025-10-03 22:41:16.837394+00	2025-10-03 22:41:16.842+00	2025-10-03 22:41:43.693+00
98c661e2-b81e-4b5d-8967-abe7edf90c9a	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759532391290-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_98c661e2-b81e-4b5d-8967-abe7edf90c9a	["damco_tracking_report_20251003_230016.pdf"]	/api/download/job/98c661e2-b81e-4b5d-8967-abe7edf90c9a/damco_tracking_report_20251003_230016.pdf	1	\N	2025-10-03 22:59:51.296853+00	2025-10-03 22:59:51.301+00	2025-10-03 23:00:17.525+00
33c8b2d7-12d5-4193-b62f-10be86088959	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759532788607-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_33c8b2d7-12d5-4193-b62f-10be86088959	["damco_tracking_report_20251003_230653.pdf"]	/api/download/job/33c8b2d7-12d5-4193-b62f-10be86088959/damco_tracking_report_20251003_230653.pdf	1	\N	2025-10-03 23:06:28.618734+00	2025-10-03 23:06:28.626+00	2025-10-03 23:06:53.844+00
0ff32ff5-a560-4b74-9ce1-a629d2736978	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759533022186-fcr_numbers.csv	fcr_numbers.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_0ff32ff5-a560-4b74-9ce1-a629d2736978	["damco_tracking_report_20251003_231103.pdf"]	/api/download/job/0ff32ff5-a560-4b74-9ce1-a629d2736978/damco_tracking_report_20251003_231103.pdf	1	\N	2025-10-03 23:10:22.193923+00	2025-10-03 23:10:22.197+00	2025-10-03 23:11:04.533+00
7d30d020-0598-4b5e-81bc-908337f0d1cd	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759533526952-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_7d30d020-0598-4b5e-81bc-908337f0d1cd	["damco_tracking_report_20251003_231912.pdf"]	/api/download/job/7d30d020-0598-4b5e-81bc-908337f0d1cd/damco_tracking_report_20251003_231912.pdf	1	\N	2025-10-03 23:18:46.978006+00	2025-10-03 23:18:46.982+00	2025-10-03 23:19:12.942+00
c5630365-69b1-41d7-b768-f8768fabd50c	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759534010752-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_c5630365-69b1-41d7-b768-f8768fabd50c	["damco_tracking_report_20251003_232715.pdf"]	/api/download/job/c5630365-69b1-41d7-b768-f8768fabd50c/damco_tracking_report_20251003_232715.pdf	1	\N	2025-10-03 23:26:50.76262+00	2025-10-03 23:26:50.767+00	2025-10-03 23:27:15.948+00
27d8b372-dc7d-4fc7-8189-6e985e0d9144	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759534118458-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_27d8b372-dc7d-4fc7-8189-6e985e0d9144	["damco_tracking_report_20251003_232903.pdf"]	/api/download/job/27d8b372-dc7d-4fc7-8189-6e985e0d9144/damco_tracking_report_20251003_232903.pdf	1	\N	2025-10-03 23:28:38.464029+00	2025-10-03 23:28:38.468+00	2025-10-03 23:29:04.036+00
ab188366-82e5-4c8f-bc06-9322bd3b1488	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759534225296-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_ab188366-82e5-4c8f-bc06-9322bd3b1488	["damco_tracking_report_20251003_233050.pdf"]	/api/download/job/ab188366-82e5-4c8f-bc06-9322bd3b1488/damco_tracking_report_20251003_233050.pdf	1	\N	2025-10-03 23:30:25.32049+00	2025-10-03 23:30:25.324+00	2025-10-03 23:30:51.257+00
5d509b97-59dd-4141-8ad3-b10f6e45f75d	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759534320889-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_5d509b97-59dd-4141-8ad3-b10f6e45f75d	["damco_tracking_report_20251003_233226.pdf"]	/api/download/job/5d509b97-59dd-4141-8ad3-b10f6e45f75d/damco_tracking_report_20251003_233226.pdf	1	\N	2025-10-03 23:32:00.894644+00	2025-10-03 23:32:00.899+00	2025-10-03 23:32:26.833+00
affe41f7-cba3-4cf4-b995-1645ca36425a	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759561434554-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_affe41f7-cba3-4cf4-b995-1645ca36425a	["damco_tracking_report_20251004_070420.pdf"]	/api/download/job/affe41f7-cba3-4cf4-b995-1645ca36425a/damco_tracking_report_20251004_070420.pdf	1	\N	2025-10-04 07:03:54.575582+00	2025-10-04 07:03:54.581+00	2025-10-04 07:04:20.786+00
952360c4-093e-4d9d-8c5d-ee13bbab8848	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759563267032-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_952360c4-093e-4d9d-8c5d-ee13bbab8848	["damco_tracking_report_20251004_073451.pdf"]	/api/download/job/952360c4-093e-4d9d-8c5d-ee13bbab8848/damco_tracking_report_20251004_073451.pdf	1	\N	2025-10-04 07:34:27.056321+00	2025-10-04 07:34:27.061+00	2025-10-04 07:34:52.493+00
1a92f434-843f-43b8-b965-0234542694aa	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759563354445-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_1a92f434-843f-43b8-b965-0234542694aa	["damco_tracking_report_20251004_073619.pdf"]	/api/download/job/1a92f434-843f-43b8-b965-0234542694aa/damco_tracking_report_20251004_073619.pdf	1	\N	2025-10-04 07:35:54.463074+00	2025-10-04 07:35:54.467+00	2025-10-04 07:36:20.948+00
427c2155-c3ff-4f6f-b9a5-758577190bba	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759563445158-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_427c2155-c3ff-4f6f-b9a5-758577190bba	["damco_tracking_report_20251004_073750.pdf"]	/api/download/job/427c2155-c3ff-4f6f-b9a5-758577190bba/damco_tracking_report_20251004_073750.pdf	1	\N	2025-10-04 07:37:25.177829+00	2025-10-04 07:37:25.184+00	2025-10-04 07:37:51.014+00
f8e1aedd-ae07-4cf5-a613-3c8569675456	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	failed	0	/var/www/smart-process-flow/uploads/1759534169529-fcr_numbers.csv	fcr_numbers.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_f8e1aedd-ae07-4cf5-a613-3c8569675456	[]	\N	1	Job timeout - exceeded 10 minutes	2025-10-03 23:29:29.542912+00	2025-10-03 23:29:29.545+00	2025-10-04 08:46:58.361+00
5cb147b7-b565-4967-92f9-9b2f35e97e6b	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759574114313-fcr_numbers.csv	fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_5cb147b7-b565-4967-92f9-9b2f35e97e6b	["damco_tracking_report_20251004_103539.pdf"]	/api/download/job/5cb147b7-b565-4967-92f9-9b2f35e97e6b/damco_tracking_report_20251004_103539.pdf	1	\N	2025-10-04 10:35:14.327348+00	2025-10-04 10:35:14.331+00	2025-10-04 10:35:39.916+00
d52a9be5-5030-46ae-b964-4b03861a0a5a	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	failed	0	/var/www/smart-process-flow/uploads/1759634962878-1759523381163-fcr_numbers copy.csv	1759523381163-fcr_numbers copy.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_d52a9be5-5030-46ae-b964-4b03861a0a5a	["damco_tracking_report_20251005_032948.pdf"]	/api/download/job/d52a9be5-5030-46ae-b964-4b03861a0a5a/damco_tracking_report_20251005_032948.pdf	1	column "files_generated_count" of relation "work_history" does not exist	2025-10-05 03:29:22.90396+00	2025-10-05 03:29:22.911+00	2025-10-05 03:29:49.706+00
ae249cb7-e76a-4ef8-af1a-993c2780c1c3	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759635682951-1759523396856-fcr_numbers.csv	1759523396856-fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_ae249cb7-e76a-4ef8-af1a-993c2780c1c3	["damco_tracking_report_20251005_034147.pdf"]	/api/download/job/ae249cb7-e76a-4ef8-af1a-993c2780c1c3/damco_tracking_report_20251005_034147.pdf	1	\N	2025-10-05 03:41:22.966115+00	2025-10-05 03:41:22.97+00	2025-10-05 03:41:48.48+00
50fb72a6-fe04-4c9a-a5ea-2ea06c546921	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759635779497-1759523396856-fcr_numbers.csv	1759523396856-fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_50fb72a6-fe04-4c9a-a5ea-2ea06c546921	["damco_tracking_report_20251005_034325.pdf"]	/api/download/job/50fb72a6-fe04-4c9a-a5ea-2ea06c546921/damco_tracking_report_20251005_034325.pdf	1	\N	2025-10-05 03:42:59.499624+00	2025-10-05 03:42:59.504+00	2025-10-05 03:43:26.21+00
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.blog_posts (id, title, slug, content, excerpt, author, tags, featured, status, views, meta_title, meta_description, meta_keywords, published_at, created_at, updated_at) FROM stdin;
f6e2f6c4-583f-4392-972c-d472c91dfebd	test	test	tesert	tes	Admin	{}	f	published	\N	test			2025-10-03 23:08:40.633+00	2025-10-03 23:08:40.642764+00	2025-10-03 23:08:40.642764+00
\.


--
-- Data for Name: bulk_uploads; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.bulk_uploads (id, user_id, service_id, service_name, original_file_name, status, total_rows, processed_rows, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cleanup_logs; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.cleanup_logs (id, cleanup_date, files_deleted, space_freed_mb, work_history_ids, bulk_upload_ids, status, error_message, created_at) FROM stdin;
\.


--
-- Data for Name: service_templates; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.service_templates (id, service_id, service_name, description, credit_cost, template_path, automation_script_path, validation_rules, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.system_settings (id, credits_per_bdt, free_trial_credits, min_purchase_credits, enabled_services, service_credits_config, system_notification, created_at, updated_at) FROM stdin;
18ad4b52-a35a-4aef-80fc-ed1559984af9	2.00	100	200	["pdf-excel-converter", "webcontainer-demo", "ctg-port-tracking", "damco-tracking-maersk"]	{"exp-issue": 2, "exp-search": 0.5, "egm-download": 1, "damco-booking": 3, "bepza-ep-issue": 2.5, "bepza-ip-issue": 2.5, "exp-correction": 1.5, "bepza-ip-submit": 2, "custom-tracking": 1.5, "hm-packing-list": 1, "bepza-ep-download": 1, "bepza-ip-download": 1, "ctg-port-tracking": 1, "damco-edoc-upload": 1, "hm-einvoice-create": 2, "bepza-ep-submission": 2, "damco-fcr-extractor": 1.5, "myshipment-tracking": 1, "pdf-excel-converter": 1, "damco-fcr-submission": 2, "hm-einvoice-download": 1, "damco-tracking-maersk": 1.1, "damco-booking-download": 1, "hm-einvoice-correction": 1.5, "exp-duplicate-reporting": 2, "cash-incentive-application": 3}	{"type": "info", "enabled": false, "message": "", "showToAll": true}	2025-10-03 22:39:48.903702+00	2025-10-04 07:35:35.340643+00
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.transactions (id, user_id, transaction_type, amount_bdt, credits_amount, payment_method, payment_status, transaction_id, gateway_reference, payment_date, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.users (id, email, name, company, mobile, password_hash, credits, is_admin, status, email_verified, member_since, trial_ends_at, total_spent, last_activity, created_at, updated_at) FROM stdin;
52cd7f19-58f1-4667-b0e4-cd3e5c885b54	demo@demo.com	demoo	demo	01222	$2a$10$4ifg1jsi61ExhAzJirZCNO5wZYv.p2vhIKIHmHgpHQigg20atNXSO	74	f	active	t	2025-10-03	2025-11-02	0.00	2025-10-03	2025-10-03 22:57:24.224604+00	2025-10-04 07:34:27.054338+00
5ecd2736-a218-4850-8711-04522026846b	izaz.sub@gmail.com	Izaz Ahamed	PR3f9m602	02155552	$2a$10$e0y2/GazY0iYcm8b/HHSFeGIaPgcFQus9AqkN1dmk3FXkgmt0gHJ2	98	t	active	t	2025-10-03	2025-11-02	0.00	2025-10-03	2025-10-03 22:40:52.908844+00	2025-10-03 22:46:37.145841+00
\.


--
-- Data for Name: work_history; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.work_history (id, user_id, service_id, service_name, file_name, credits_used, status, result_files, download_url, created_at, expires_at, files_generated_count, bulk_upload_id, row_number) FROM stdin;
1de5b0fe-0887-4ec4-8d14-b9337876717b	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1	completed	["damco_tracking_report_20251003_224142.pdf", "pdfs/001_CTG2358534_tracking.pdf", "pdfs/002_CTG2358538_tracking.pdf"]	/api/download/job/4ec37a2f-2aa2-4523-8f8e-146872454046/damco_tracking_report_20251003_224142.pdf	2025-10-03 22:41:43.695805+00	2025-10-10 22:41:43.695805+00	3	\N	\N
6a2820a4-ee17-4e25-8852-87378315f1e9	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1	completed	["damco_tracking_report_20251003_230016.pdf"]	/api/download/job/98c661e2-b81e-4b5d-8967-abe7edf90c9a/damco_tracking_report_20251003_230016.pdf	2025-10-03 23:00:17.527807+00	2025-10-10 23:00:17.527807+00	1	\N	\N
28d6004a-c7bb-4d20-be82-80c86239fa93	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1	completed	["damco_tracking_report_20251003_230653.pdf"]	/api/download/job/33c8b2d7-12d5-4193-b62f-10be86088959/damco_tracking_report_20251003_230653.pdf	2025-10-03 23:06:53.846741+00	2025-10-10 23:06:53.846741+00	1	\N	\N
e5bdae08-b808-46f0-b352-02e2c987460e	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers.csv	1	completed	["damco_tracking_report_20251003_231103.pdf"]	/api/download/job/0ff32ff5-a560-4b74-9ce1-a629d2736978/damco_tracking_report_20251003_231103.pdf	2025-10-03 23:11:04.534868+00	2025-10-10 23:11:04.534868+00	1	\N	\N
52db98cb-a9fd-4356-af47-da97b9272008	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1	completed	["damco_tracking_report_20251003_231912.pdf"]	/api/download/job/7d30d020-0598-4b5e-81bc-908337f0d1cd/damco_tracking_report_20251003_231912.pdf	2025-10-03 23:19:12.945377+00	2025-10-10 23:19:12.945377+00	1	\N	\N
327f2b86-0605-452f-b169-fc1aae933676	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1	completed	["damco_tracking_report_20251003_232715.pdf"]	/api/download/job/c5630365-69b1-41d7-b768-f8768fabd50c/damco_tracking_report_20251003_232715.pdf	2025-10-03 23:27:15.951674+00	2025-10-10 23:27:15.951674+00	1	\N	\N
114f9122-92ce-45a0-8307-d75e624890a8	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1	completed	["damco_tracking_report_20251003_232903.pdf"]	/api/download/job/27d8b372-dc7d-4fc7-8189-6e985e0d9144/damco_tracking_report_20251003_232903.pdf	2025-10-03 23:29:04.038893+00	2025-10-10 23:29:04.038893+00	1	\N	\N
f9fad488-64f3-4312-9804-09c8d520c1bf	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1	completed	["damco_tracking_report_20251003_233050.pdf"]	/api/download/job/ab188366-82e5-4c8f-bc06-9322bd3b1488/damco_tracking_report_20251003_233050.pdf	2025-10-03 23:30:51.260358+00	2025-10-10 23:30:51.260358+00	1	\N	\N
618f68e5-a307-421e-b408-6273029cbd12	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1	completed	["damco_tracking_report_20251003_233226.pdf"]	/api/download/job/5d509b97-59dd-4141-8ad3-b10f6e45f75d/damco_tracking_report_20251003_233226.pdf	2025-10-03 23:32:26.841626+00	2025-10-10 23:32:26.841626+00	1	\N	\N
8a900d4c-4b2e-47a9-b88f-8b36e088ede3	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1	completed	["damco_tracking_report_20251004_070420.pdf"]	/api/download/job/affe41f7-cba3-4cf4-b995-1645ca36425a/damco_tracking_report_20251004_070420.pdf	2025-10-04 07:04:20.788997+00	2025-10-11 07:04:20.788997+00	1	\N	\N
68f3e676-5138-475f-bf4e-5bd0318e7ab4	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1	completed	["damco_tracking_report_20251004_073451.pdf"]	/api/download/job/952360c4-093e-4d9d-8c5d-ee13bbab8848/damco_tracking_report_20251004_073451.pdf	2025-10-04 07:34:52.496068+00	2025-10-11 07:34:52.496068+00	1	\N	\N
e8803839-a113-49ee-ac5e-3486944051a2	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1	completed	["damco_tracking_report_20251004_073619.pdf"]	/api/download/job/1a92f434-843f-43b8-b965-0234542694aa/damco_tracking_report_20251004_073619.pdf	2025-10-04 07:36:20.951049+00	2025-10-11 07:36:20.951049+00	1	\N	\N
116c0df5-60ff-48b2-a905-fbe8b036ff40	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1	completed	["damco_tracking_report_20251004_073750.pdf"]	/api/download/job/427c2155-c3ff-4f6f-b9a5-758577190bba/damco_tracking_report_20251004_073750.pdf	2025-10-04 07:37:51.017994+00	2025-10-11 07:37:51.017994+00	1	\N	\N
267ab333-50e6-4f3c-a94b-9bf642f0593a	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers.csv	1	completed	["damco_tracking_report_20251004_103539.pdf"]	/api/download/job/5cb147b7-b565-4967-92f9-9b2f35e97e6b/damco_tracking_report_20251004_103539.pdf	2025-10-04 10:35:39.919226+00	2025-10-11 10:35:39.919226+00	1	\N	\N
157ff4de-8531-495d-bd9e-1898937749bc	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1759523396856-fcr_numbers.csv	1	completed	["damco_tracking_report_20251005_034147.pdf"]	/api/download/job/ae249cb7-e76a-4ef8-af1a-993c2780c1c3/damco_tracking_report_20251005_034147.pdf	2025-10-05 03:41:48.486927+00	2025-10-12 03:41:48.486927+00	1	\N	\N
d73ff83a-cd3e-4bef-a67c-4b51072512b7	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1759523396856-fcr_numbers.csv	1	completed	["damco_tracking_report_20251005_034325.pdf"]	/api/download/job/50fb72a6-fe04-4c9a-a5ea-2ea06c546921/damco_tracking_report_20251005_034325.pdf	2025-10-05 03:43:26.212734+00	2025-10-12 03:43:26.212734+00	1	\N	\N
\.


--
-- Name: automation_jobs automation_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.automation_jobs
    ADD CONSTRAINT automation_jobs_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: bulk_uploads bulk_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.bulk_uploads
    ADD CONSTRAINT bulk_uploads_pkey PRIMARY KEY (id);


--
-- Name: cleanup_logs cleanup_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.cleanup_logs
    ADD CONSTRAINT cleanup_logs_pkey PRIMARY KEY (id);


--
-- Name: service_templates service_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.service_templates
    ADD CONSTRAINT service_templates_pkey PRIMARY KEY (id);


--
-- Name: service_templates service_templates_service_id_key; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.service_templates
    ADD CONSTRAINT service_templates_service_id_key UNIQUE (service_id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_transaction_id_key UNIQUE (transaction_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: work_history work_history_pkey; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.work_history
    ADD CONSTRAINT work_history_pkey PRIMARY KEY (id);


--
-- Name: idx_blog_posts_published_at; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_blog_posts_published_at ON public.blog_posts USING btree (published_at);


--
-- Name: idx_blog_posts_slug; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_blog_posts_slug ON public.blog_posts USING btree (slug);


--
-- Name: idx_blog_posts_status; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_blog_posts_status ON public.blog_posts USING btree (status);


--
-- Name: idx_jobs_created_at; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_jobs_created_at ON public.automation_jobs USING btree (created_at DESC);


--
-- Name: idx_jobs_queue; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_jobs_queue ON public.automation_jobs USING btree (service_id, status, priority DESC, created_at);


--
-- Name: idx_jobs_status; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_jobs_status ON public.automation_jobs USING btree (status);


--
-- Name: idx_jobs_user_id; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_jobs_user_id ON public.automation_jobs USING btree (user_id);


--
-- Name: idx_transactions_created_at; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at);


--
-- Name: idx_transactions_payment_status; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_transactions_payment_status ON public.transactions USING btree (payment_status);


--
-- Name: idx_transactions_transaction_type; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_transactions_transaction_type ON public.transactions USING btree (transaction_type);


--
-- Name: idx_transactions_user_id; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_mobile; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_users_mobile ON public.users USING btree (mobile);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: idx_work_history_bulk_row; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_work_history_bulk_row ON public.work_history USING btree (bulk_upload_id, row_number) WHERE (bulk_upload_id IS NOT NULL);


--
-- Name: idx_work_history_bulk_upload_id; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_work_history_bulk_upload_id ON public.work_history USING btree (bulk_upload_id);


--
-- Name: idx_work_history_created_at; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_work_history_created_at ON public.work_history USING btree (created_at);


--
-- Name: idx_work_history_expires_at; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_work_history_expires_at ON public.work_history USING btree (expires_at);


--
-- Name: idx_work_history_row_number; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_work_history_row_number ON public.work_history USING btree (row_number);


--
-- Name: idx_work_history_service_id; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_work_history_service_id ON public.work_history USING btree (service_id);


--
-- Name: idx_work_history_user_id; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_work_history_user_id ON public.work_history USING btree (user_id);


--
-- Name: automation_jobs automation_jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.automation_jobs
    ADD CONSTRAINT automation_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bulk_uploads bulk_uploads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.bulk_uploads
    ADD CONSTRAINT bulk_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: work_history work_history_bulk_upload_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.work_history
    ADD CONSTRAINT work_history_bulk_upload_id_fkey FOREIGN KEY (bulk_upload_id) REFERENCES public.bulk_uploads(id) ON DELETE CASCADE;


--
-- Name: work_history work_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.work_history
    ADD CONSTRAINT work_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: automation_jobs Service can manage jobs; Type: POLICY; Schema: public; Owner: spf_user
--

CREATE POLICY "Service can manage jobs" ON public.automation_jobs TO spf_user USING (true);


--
-- Name: automation_jobs Users can view own jobs; Type: POLICY; Schema: public; Owner: spf_user
--

CREATE POLICY "Users can view own jobs" ON public.automation_jobs FOR SELECT TO spf_user USING (true);


--
-- Name: automation_jobs; Type: ROW SECURITY; Schema: public; Owner: spf_user
--

ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: spf_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict IihKgcA0JRh4dHgCb3Zxl8KLWHX06fkDDXdM1kC7zgfnU4KSYTjbq0Mk5EtgbcU
