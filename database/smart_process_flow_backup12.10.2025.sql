--
-- PostgreSQL database dump
--

\restrict OvqoIGtVDOUuLKkzfjHXUxLCAxV5PPemifzmjFyMNZjeY6ioybOCAiDZ31DcOoB

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
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: spf_user
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    company text,
    subject text NOT NULL,
    message text NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address text,
    status text DEFAULT 'new'::text NOT NULL,
    CONSTRAINT contact_messages_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'resolved'::text])))
);


ALTER TABLE public.contact_messages OWNER TO spf_user;

--
-- Name: TABLE contact_messages; Type: COMMENT; Schema: public; Owner: spf_user
--

COMMENT ON TABLE public.contact_messages IS 'Stores all contact form submissions from users';


--
-- Name: COLUMN contact_messages.status; Type: COMMENT; Schema: public; Owner: spf_user
--

COMMENT ON COLUMN public.contact_messages.status IS 'Message status: new, read, or resolved';


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
    updated_at timestamp with time zone DEFAULT now(),
    reset_password_token text,
    reset_password_expires_at timestamp with time zone,
    verification_token character varying(255),
    verification_token_expires timestamp with time zone,
    password_reset_token character varying(255),
    password_reset_token_expires timestamp with time zone
);


ALTER TABLE public.users OWNER TO spf_user;

--
-- Name: COLUMN users.verification_token; Type: COMMENT; Schema: public; Owner: spf_user
--

COMMENT ON COLUMN public.users.verification_token IS 'Token sent via email for email verification, expires after 24 hours';


--
-- Name: COLUMN users.verification_token_expires; Type: COMMENT; Schema: public; Owner: spf_user
--

COMMENT ON COLUMN public.users.verification_token_expires IS 'Timestamp when verification token expires (24 hours from generation)';


--
-- Name: COLUMN users.password_reset_token; Type: COMMENT; Schema: public; Owner: spf_user
--

COMMENT ON COLUMN public.users.password_reset_token IS 'Token sent via email for password reset, expires after 1 hour';


--
-- Name: COLUMN users.password_reset_token_expires; Type: COMMENT; Schema: public; Owner: spf_user
--

COMMENT ON COLUMN public.users.password_reset_token_expires IS 'Timestamp when password reset token expires (1 hour from generation)';


--
-- Name: work_history; Type: TABLE; Schema: public; Owner: spf_user
--

CREATE TABLE public.work_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    service_id character varying(100) NOT NULL,
    service_name character varying(255) NOT NULL,
    file_name text NOT NULL,
    credits_used numeric(10,2) NOT NULL,
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
4ec37a2f-2aa2-4523-8f8e-146872454046	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759531276829-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_4ec37a2f-2aa2-4523-8f8e-146872454046	["damco_tracking_report_20251003_224142.pdf", "pdfs/001_CTG2358534_tracking.pdf", "pdfs/002_CTG2358538_tracking.pdf"]	/api/download/job/4ec37a2f-2aa2-4523-8f8e-146872454046/damco_tracking_report_20251003_224142.pdf	1.00	\N	2025-10-03 22:41:16.837394+00	2025-10-03 22:41:16.842+00	2025-10-03 22:41:43.693+00
98c661e2-b81e-4b5d-8967-abe7edf90c9a	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759532391290-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_98c661e2-b81e-4b5d-8967-abe7edf90c9a	["damco_tracking_report_20251003_230016.pdf"]	/api/download/job/98c661e2-b81e-4b5d-8967-abe7edf90c9a/damco_tracking_report_20251003_230016.pdf	1.00	\N	2025-10-03 22:59:51.296853+00	2025-10-03 22:59:51.301+00	2025-10-03 23:00:17.525+00
33c8b2d7-12d5-4193-b62f-10be86088959	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759532788607-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_33c8b2d7-12d5-4193-b62f-10be86088959	["damco_tracking_report_20251003_230653.pdf"]	/api/download/job/33c8b2d7-12d5-4193-b62f-10be86088959/damco_tracking_report_20251003_230653.pdf	1.00	\N	2025-10-03 23:06:28.618734+00	2025-10-03 23:06:28.626+00	2025-10-03 23:06:53.844+00
0ff32ff5-a560-4b74-9ce1-a629d2736978	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759533022186-fcr_numbers.csv	fcr_numbers.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_0ff32ff5-a560-4b74-9ce1-a629d2736978	["damco_tracking_report_20251003_231103.pdf"]	/api/download/job/0ff32ff5-a560-4b74-9ce1-a629d2736978/damco_tracking_report_20251003_231103.pdf	1.00	\N	2025-10-03 23:10:22.193923+00	2025-10-03 23:10:22.197+00	2025-10-03 23:11:04.533+00
7d30d020-0598-4b5e-81bc-908337f0d1cd	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759533526952-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_7d30d020-0598-4b5e-81bc-908337f0d1cd	["damco_tracking_report_20251003_231912.pdf"]	/api/download/job/7d30d020-0598-4b5e-81bc-908337f0d1cd/damco_tracking_report_20251003_231912.pdf	1.00	\N	2025-10-03 23:18:46.978006+00	2025-10-03 23:18:46.982+00	2025-10-03 23:19:12.942+00
c5630365-69b1-41d7-b768-f8768fabd50c	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759534010752-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_c5630365-69b1-41d7-b768-f8768fabd50c	["damco_tracking_report_20251003_232715.pdf"]	/api/download/job/c5630365-69b1-41d7-b768-f8768fabd50c/damco_tracking_report_20251003_232715.pdf	1.00	\N	2025-10-03 23:26:50.76262+00	2025-10-03 23:26:50.767+00	2025-10-03 23:27:15.948+00
27d8b372-dc7d-4fc7-8189-6e985e0d9144	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759534118458-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_27d8b372-dc7d-4fc7-8189-6e985e0d9144	["damco_tracking_report_20251003_232903.pdf"]	/api/download/job/27d8b372-dc7d-4fc7-8189-6e985e0d9144/damco_tracking_report_20251003_232903.pdf	1.00	\N	2025-10-03 23:28:38.464029+00	2025-10-03 23:28:38.468+00	2025-10-03 23:29:04.036+00
ab188366-82e5-4c8f-bc06-9322bd3b1488	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759534225296-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_ab188366-82e5-4c8f-bc06-9322bd3b1488	["damco_tracking_report_20251003_233050.pdf"]	/api/download/job/ab188366-82e5-4c8f-bc06-9322bd3b1488/damco_tracking_report_20251003_233050.pdf	1.00	\N	2025-10-03 23:30:25.32049+00	2025-10-03 23:30:25.324+00	2025-10-03 23:30:51.257+00
5d509b97-59dd-4141-8ad3-b10f6e45f75d	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759534320889-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_5d509b97-59dd-4141-8ad3-b10f6e45f75d	["damco_tracking_report_20251003_233226.pdf"]	/api/download/job/5d509b97-59dd-4141-8ad3-b10f6e45f75d/damco_tracking_report_20251003_233226.pdf	1.00	\N	2025-10-03 23:32:00.894644+00	2025-10-03 23:32:00.899+00	2025-10-03 23:32:26.833+00
affe41f7-cba3-4cf4-b995-1645ca36425a	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759561434554-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_affe41f7-cba3-4cf4-b995-1645ca36425a	["damco_tracking_report_20251004_070420.pdf"]	/api/download/job/affe41f7-cba3-4cf4-b995-1645ca36425a/damco_tracking_report_20251004_070420.pdf	1.00	\N	2025-10-04 07:03:54.575582+00	2025-10-04 07:03:54.581+00	2025-10-04 07:04:20.786+00
952360c4-093e-4d9d-8c5d-ee13bbab8848	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759563267032-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_952360c4-093e-4d9d-8c5d-ee13bbab8848	["damco_tracking_report_20251004_073451.pdf"]	/api/download/job/952360c4-093e-4d9d-8c5d-ee13bbab8848/damco_tracking_report_20251004_073451.pdf	1.00	\N	2025-10-04 07:34:27.056321+00	2025-10-04 07:34:27.061+00	2025-10-04 07:34:52.493+00
1a92f434-843f-43b8-b965-0234542694aa	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759563354445-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_1a92f434-843f-43b8-b965-0234542694aa	["damco_tracking_report_20251004_073619.pdf"]	/api/download/job/1a92f434-843f-43b8-b965-0234542694aa/damco_tracking_report_20251004_073619.pdf	1.00	\N	2025-10-04 07:35:54.463074+00	2025-10-04 07:35:54.467+00	2025-10-04 07:36:20.948+00
427c2155-c3ff-4f6f-b9a5-758577190bba	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759563445158-fcr_numbers copy.csv	fcr_numbers copy.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_427c2155-c3ff-4f6f-b9a5-758577190bba	["damco_tracking_report_20251004_073750.pdf"]	/api/download/job/427c2155-c3ff-4f6f-b9a5-758577190bba/damco_tracking_report_20251004_073750.pdf	1.00	\N	2025-10-04 07:37:25.177829+00	2025-10-04 07:37:25.184+00	2025-10-04 07:37:51.014+00
f8e1aedd-ae07-4cf5-a613-3c8569675456	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	failed	0	/var/www/smart-process-flow/uploads/1759534169529-fcr_numbers.csv	fcr_numbers.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_f8e1aedd-ae07-4cf5-a613-3c8569675456	[]	\N	1.00	Job timeout - exceeded 10 minutes	2025-10-03 23:29:29.542912+00	2025-10-03 23:29:29.545+00	2025-10-04 08:46:58.361+00
5cb147b7-b565-4967-92f9-9b2f35e97e6b	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759574114313-fcr_numbers.csv	fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_5cb147b7-b565-4967-92f9-9b2f35e97e6b	["damco_tracking_report_20251004_103539.pdf"]	/api/download/job/5cb147b7-b565-4967-92f9-9b2f35e97e6b/damco_tracking_report_20251004_103539.pdf	1.00	\N	2025-10-04 10:35:14.327348+00	2025-10-04 10:35:14.331+00	2025-10-04 10:35:39.916+00
d52a9be5-5030-46ae-b964-4b03861a0a5a	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	failed	0	/var/www/smart-process-flow/uploads/1759634962878-1759523381163-fcr_numbers copy.csv	1759523381163-fcr_numbers copy.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_d52a9be5-5030-46ae-b964-4b03861a0a5a	["damco_tracking_report_20251005_032948.pdf"]	/api/download/job/d52a9be5-5030-46ae-b964-4b03861a0a5a/damco_tracking_report_20251005_032948.pdf	1.00	column "files_generated_count" of relation "work_history" does not exist	2025-10-05 03:29:22.90396+00	2025-10-05 03:29:22.911+00	2025-10-05 03:29:49.706+00
ae249cb7-e76a-4ef8-af1a-993c2780c1c3	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759635682951-1759523396856-fcr_numbers.csv	1759523396856-fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_ae249cb7-e76a-4ef8-af1a-993c2780c1c3	["damco_tracking_report_20251005_034147.pdf"]	/api/download/job/ae249cb7-e76a-4ef8-af1a-993c2780c1c3/damco_tracking_report_20251005_034147.pdf	1.00	\N	2025-10-05 03:41:22.966115+00	2025-10-05 03:41:22.97+00	2025-10-05 03:41:48.48+00
50fb72a6-fe04-4c9a-a5ea-2ea06c546921	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759635779497-1759523396856-fcr_numbers.csv	1759523396856-fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_50fb72a6-fe04-4c9a-a5ea-2ea06c546921	["damco_tracking_report_20251005_034325.pdf"]	/api/download/job/50fb72a6-fe04-4c9a-a5ea-2ea06c546921/damco_tracking_report_20251005_034325.pdf	1.00	\N	2025-10-05 03:42:59.499624+00	2025-10-05 03:42:59.504+00	2025-10-05 03:43:26.21+00
2b8c2c21-94a0-4488-ad66-2d31c3898833	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759641152032-1759523396856-fcr_numbers.csv	1759523396856-fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_2b8c2c21-94a0-4488-ad66-2d31c3898833	["damco_tracking_report_20251005_051257.pdf"]	/api/download/job/2b8c2c21-94a0-4488-ad66-2d31c3898833/damco_tracking_report_20251005_051257.pdf	1.00	\N	2025-10-05 05:12:32.047229+00	2025-10-05 05:12:32.053+00	2025-10-05 05:12:59.149+00
6dcb5be6-9dd7-4b8b-b877-c0e642b70929	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759641471740-1759523831235-fcr_numbers.csv	1759523831235-fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_6dcb5be6-9dd7-4b8b-b877-c0e642b70929	["damco_tracking_report_20251005_051816.pdf"]	/api/download/job/6dcb5be6-9dd7-4b8b-b877-c0e642b70929/damco_tracking_report_20251005_051816.pdf	1.00	\N	2025-10-05 05:17:51.747227+00	2025-10-05 05:17:51.752+00	2025-10-05 05:18:17.431+00
2486ea69-8db1-47ea-8975-21ee1e635231	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759642046436-1759523396856-fcr_numbers.csv	1759523396856-fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_2486ea69-8db1-47ea-8975-21ee1e635231	["damco_tracking_report_20251005_052751.pdf"]	/api/download/job/2486ea69-8db1-47ea-8975-21ee1e635231/damco_tracking_report_20251005_052751.pdf	1.00	\N	2025-10-05 05:27:26.458724+00	2025-10-05 05:27:26.465+00	2025-10-05 05:27:52.127+00
23b4e6d6-677d-4508-85bc-fc2e4e1289af	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759645601413-1759523831235-fcr_numbers.csv	1759523831235-fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_23b4e6d6-677d-4508-85bc-fc2e4e1289af	["damco_tracking_report_20251005_062706.pdf"]	/api/download/job/23b4e6d6-677d-4508-85bc-fc2e4e1289af/damco_tracking_report_20251005_062706.pdf	1.00	\N	2025-10-05 06:26:41.427661+00	2025-10-05 06:26:41.431+00	2025-10-05 06:27:06.779+00
72426a6d-3333-4756-a6f1-712d141b5e45	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759650342512-1759523967693-fcr_numbers.csv	1759523967693-fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_72426a6d-3333-4756-a6f1-712d141b5e45	["damco_tracking_report_20251005_074607.pdf"]	/api/download/job/72426a6d-3333-4756-a6f1-712d141b5e45/damco_tracking_report_20251005_074607.pdf	2.00	\N	2025-10-05 07:45:42.525616+00	2025-10-05 07:45:42.529+00	2025-10-05 07:46:08.127+00
9601f70d-437f-4aa6-84c1-4f3e4a83bce7	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759650420768-1759523967693-fcr_numbers.csv	1759523967693-fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_9601f70d-437f-4aa6-84c1-4f3e4a83bce7	["damco_tracking_report_20251005_074728.pdf"]	/api/download/job/9601f70d-437f-4aa6-84c1-4f3e4a83bce7/damco_tracking_report_20251005_074728.pdf	2.00	\N	2025-10-05 07:47:00.780775+00	2025-10-05 07:47:00.785+00	2025-10-05 07:47:29.43+00
c6646878-7854-4031-8eb9-e6bc4d9ab732	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759652219587-1759523396856-fcr_numbers.csv	1759523396856-fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_c6646878-7854-4031-8eb9-e6bc4d9ab732	["damco_tracking_report_20251005_081724.pdf"]	/api/download/job/c6646878-7854-4031-8eb9-e6bc4d9ab732/damco_tracking_report_20251005_081724.pdf	2.00	\N	2025-10-05 08:16:59.605166+00	2025-10-05 08:16:59.61+00	2025-10-05 08:17:25.259+00
a4fd8d86-ea65-4854-b02b-cbd53e968950	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759654649454-1759523381163-fcr_numbers copy.csv	1759523381163-fcr_numbers copy.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_a4fd8d86-ea65-4854-b02b-cbd53e968950	["damco_tracking_report_20251005_085754.pdf"]	/api/download/job/a4fd8d86-ea65-4854-b02b-cbd53e968950/damco_tracking_report_20251005_085754.pdf	2.00	\N	2025-10-05 08:57:29.477979+00	2025-10-05 08:57:29.484+00	2025-10-05 08:57:55.092+00
46b64d47-7142-4a19-a367-4c3361e26090	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759654247546-1759523831235-fcr_numbers.csv	1759523831235-fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_46b64d47-7142-4a19-a367-4c3361e26090	["damco_tracking_report_20251005_085113.pdf"]	/api/download/job/46b64d47-7142-4a19-a367-4c3361e26090/damco_tracking_report_20251005_085113.pdf	2.00	\N	2025-10-05 08:50:47.557419+00	2025-10-05 08:50:47.563+00	2025-10-05 08:51:13.663+00
822bacec-3601-4726-abb0-0c6aac71510f	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759655596914-1759523396856-fcr_numbers.csv	1759523396856-fcr_numbers.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_822bacec-3601-4726-abb0-0c6aac71510f	["damco_tracking_report_20251005_091342.pdf"]	/api/download/job/822bacec-3601-4726-abb0-0c6aac71510f/damco_tracking_report_20251005_091342.pdf	2.00	\N	2025-10-05 09:13:16.938228+00	2025-10-05 09:13:16.942+00	2025-10-05 09:13:42.722+00
c56a3306-9218-40e2-8e1d-78102cfbc79a	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759654363034-1759523831235-fcr_numbers.csv	1759523831235-fcr_numbers.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_c56a3306-9218-40e2-8e1d-78102cfbc79a	["damco_tracking_report_20251005_085308.pdf"]	/api/download/job/c56a3306-9218-40e2-8e1d-78102cfbc79a/damco_tracking_report_20251005_085308.pdf	2.00	\N	2025-10-05 08:52:43.060583+00	2025-10-05 08:52:43.065+00	2025-10-05 08:53:08.586+00
9dd70200-cb49-4633-bad5-bc41311940e3	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759656262714-1759523831235-fcr_numbers.csv	1759523831235-fcr_numbers.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_9dd70200-cb49-4633-bad5-bc41311940e3	["damco_tracking_report_20251005_092447.pdf"]	/api/download/job/9dd70200-cb49-4633-bad5-bc41311940e3/damco_tracking_report_20251005_092447.pdf	2.00	\N	2025-10-05 09:24:22.731224+00	2025-10-05 09:24:22.735+00	2025-10-05 09:24:48.092+00
c93617ff-8951-4c2d-8d77-555c160a5026	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	completed	0	/var/www/smart-process-flow/uploads/1759996893669-fcr_numbers.csv	fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_c93617ff-8951-4c2d-8d77-555c160a5026	[]	\N	2.00	\N	2025-10-09 08:01:33.687448+00	2025-10-09 08:01:33.693+00	2025-10-09 08:02:05.872+00
38973276-7c56-457c-ad7b-b1dc75cb0da9	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759656391471-1759523831235-fcr_numbers.csv	1759523831235-fcr_numbers.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_38973276-7c56-457c-ad7b-b1dc75cb0da9	["damco_tracking_report_20251005_092656.pdf"]	/api/download/job/38973276-7c56-457c-ad7b-b1dc75cb0da9/damco_tracking_report_20251005_092656.pdf	2.00	\N	2025-10-05 09:26:31.490062+00	2025-10-05 09:26:31.497+00	2025-10-05 09:26:57.684+00
8697444b-a014-4b65-86df-636c1c231675	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	completed	1	/var/www/smart-process-flow/uploads/1760241447419-egm-download-template.csv	1760241447419-egm-download-template.csv	/var/www/smart-process-flow/results/job_8697444b-a014-4b65-86df-636c1c231675	["egm_bill_tracking_report_8697444b-a014-4b65-86df-636c1c231675.pdf", "pdfs/301_C_1340868_2023.pdf", "pdfs/301_C_1340867_2023.pdf"]	/api/download/job/8697444b-a014-4b65-86df-636c1c231675/egm_bill_tracking_report_8697444b-a014-4b65-86df-636c1c231675.pdf	2.00	\N	2025-10-12 03:57:27.435986+00	2025-10-12 03:57:27.439+00	2025-10-12 03:58:46.528+00
c5fa20f1-0943-407e-83a7-a20b44bb1e24	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	completed	1	/var/www/smart-process-flow/uploads/1760258146944-egm-download-template.csv	1760258146944-egm-download-template.csv	/var/www/smart-process-flow/results/job_c5fa20f1-0943-407e-83a7-a20b44bb1e24	[]	\N	2.00	\N	2025-10-12 08:35:46.96572+00	2025-10-12 08:35:46.969+00	2025-10-12 08:37:56.268+00
266fa512-c127-408f-9178-09a92fbdfef1	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	processing	1	/var/www/smart-process-flow/uploads/1760262103411-egm-download-template.csv	1760262103411-egm-download-template.csv	/var/www/smart-process-flow/results/job_266fa512-c127-408f-9178-09a92fbdfef1	[]	\N	2.00	\N	2025-10-12 09:41:43.430907+00	2025-10-12 09:41:43.435+00	\N
c57f6ed8-ac0c-4e75-a8bb-1c8ecb1e45bf	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	processing	1	/var/www/smart-process-flow/uploads/1760262693539-egm-download-template.csv	1760262693539-egm-download-template.csv	/var/www/smart-process-flow/results/job_c57f6ed8-ac0c-4e75-a8bb-1c8ecb1e45bf	[]	\N	2.00	\N	2025-10-12 09:51:33.544414+00	2025-10-12 09:51:33.546+00	\N
780c2055-c8e9-45cf-bb50-3ccaf11039ef	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	processing	1	/var/www/smart-process-flow/uploads/1760264444327-egm-download-template.csv	1760264444327-egm-download-template.csv	/var/www/smart-process-flow/results/job_780c2055-c8e9-45cf-bb50-3ccaf11039ef	[]	\N	2.00	\N	2025-10-12 10:20:44.333553+00	2025-10-12 10:20:44.336+00	\N
9aed8c34-73bf-40b6-8043-2dbb65eaaa2a	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	1	/var/www/smart-process-flow/uploads/1760265071684-fcr_numbers.csv	1760265071684-fcr_numbers.csv	/var/www/smart-process-flow/results/job_9aed8c34-73bf-40b6-8043-2dbb65eaaa2a	["damco_tracking_report_20251012_103232.pdf", "pdfs/002_CTG2358538_tracking.pdf", "pdfs/001_CTG2358534_tracking.pdf"]	/api/download/job/9aed8c34-73bf-40b6-8043-2dbb65eaaa2a/damco_tracking_report_20251012_103232.pdf	2.20	\N	2025-10-12 10:31:11.703145+00	2025-10-12 10:31:11.707+00	2025-10-12 10:32:33.062+00
5ed54e23-f5c5-4af2-b282-03e0aa8d2ffe	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759658882287-1759523967693-fcr_numbers.csv	1759523967693-fcr_numbers.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_5ed54e23-f5c5-4af2-b282-03e0aa8d2ffe	["damco_tracking_report_20251005_100827.pdf"]	/api/download/job/5ed54e23-f5c5-4af2-b282-03e0aa8d2ffe/damco_tracking_report_20251005_100827.pdf	2.20	\N	2025-10-05 10:08:02.296549+00	2025-10-05 10:08:02.302+00	2025-10-05 10:08:28.289+00
ad32d897-78f4-4094-97eb-88efaad29e74	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	completed	1	/var/www/smart-process-flow/uploads/1760244133781-egm-download-template.csv	1760244133781-egm-download-template.csv	/var/www/smart-process-flow/results/job_ad32d897-78f4-4094-97eb-88efaad29e74	[]	\N	2.00	\N	2025-10-12 04:42:13.809501+00	2025-10-12 04:42:13.813+00	2025-10-12 04:44:25.456+00
58addcf1-4f78-4a99-8074-6960b51e3cde	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	failed	1	/var/www/smart-process-flow/uploads/1760260109957-egm-download-template.csv	1760260109957-egm-download-template.csv	/var/www/smart-process-flow/results/job_58addcf1-4f78-4a99-8074-6960b51e3cde	[]	\N	2.00	Browser compatibility issue detected. The automation system is attempting to resolve this automatically. Please try again in a few moments.	2025-10-12 09:08:29.964417+00	2025-10-12 09:08:29.967+00	2025-10-12 09:08:31.546+00
68cadf80-be44-48f0-9d68-6903a6917a66	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	completed	1	/var/www/smart-process-flow/uploads/1760262251706-egm-download-template.csv	1760262251706-egm-download-template.csv	/var/www/smart-process-flow/results/job_68cadf80-be44-48f0-9d68-6903a6917a66	[]	\N	2.00	\N	2025-10-12 09:44:11.728229+00	2025-10-12 09:44:11.732+00	2025-10-12 09:44:11.757+00
7147025c-ddf2-4fdc-99b1-8879a08478a1	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	processing	1	/var/www/smart-process-flow/uploads/1760263935049-egm-download-template.csv	1760263935049-egm-download-template.csv	/var/www/smart-process-flow/results/job_7147025c-ddf2-4fdc-99b1-8879a08478a1	[]	\N	2.00	\N	2025-10-12 10:12:15.055236+00	2025-10-12 10:12:15.057+00	\N
8afc2a23-7daf-496d-8d42-1f639f988f03	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	ctg-port-tracking	CTG Port Authority Tracking	failed	1	/var/www/smart-process-flow/uploads/1760264591732-fcr_numbers.csv	1760264591732-fcr_numbers.csv	/var/www/smart-process-flow/results/job_8afc2a23-7daf-496d-8d42-1f639f988f03	[]	\N	2.00	Script exited with code 1	2025-10-12 10:23:11.751942+00	2025-10-12 10:23:11.754+00	2025-10-12 10:23:12.227+00
225fd4df-0ced-4523-a1ea-de8c0d84cfd6	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	ctg-port-tracking	CTG Port Authority Tracking	completed	1	/var/www/smart-process-flow/uploads/1760265351412-ctg-port-tracking-template.csv	1760265351412-ctg-port-tracking-template.csv	/var/www/smart-process-flow/results/job_225fd4df-0ced-4523-a1ea-de8c0d84cfd6	["ctg_port_tracking_report_20251012_103625.pdf", "pdfs/002_TCLU9876543_tracking.pdf", "pdfs/001_MAEU1234567_tracking.pdf"]	/api/download/job/225fd4df-0ced-4523-a1ea-de8c0d84cfd6/ctg_port_tracking_report_20251012_103625.pdf	2.00	\N	2025-10-12 10:35:51.420067+00	2025-10-12 10:35:51.423+00	2025-10-12 10:36:25.462+00
a29d19e5-0fba-4f4e-ae24-e6cf55288d07	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1759663167033-1759523831235-fcr_numbers.csv	1759523831235-fcr_numbers.csv	/var/www/smart-process-flow/results/52cd7f19-58f1-4667-b0e4-cd3e5c885b54_a29d19e5-0fba-4f4e-ae24-e6cf55288d07	["damco_tracking_report_20251005_112009.pdf"]	/api/download/job/a29d19e5-0fba-4f4e-ae24-e6cf55288d07/damco_tracking_report_20251005_112009.pdf	4.40	\N	2025-10-05 11:19:27.048399+00	2025-10-05 11:19:27.051+00	2025-10-05 11:20:10.083+00
7a606b2d-791a-43ac-88e3-f00ed2b3d415	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	completed	1	/var/www/smart-process-flow/uploads/1760244989148-egm-download-template.csv	1760244989148-egm-download-template.csv	/var/www/smart-process-flow/results/job_7a606b2d-791a-43ac-88e3-f00ed2b3d415	[]	\N	2.00	\N	2025-10-12 04:56:29.154758+00	2025-10-12 04:56:29.158+00	2025-10-12 04:58:19.567+00
ea2ef712-7b40-4c6d-9e84-7d45df00e8fd	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	completed	1	/var/www/smart-process-flow/uploads/1760260733212-egm-download-template.csv	1760260733212-egm-download-template.csv	/var/www/smart-process-flow/results/job_ea2ef712-7b40-4c6d-9e84-7d45df00e8fd	["egm_bill_tracking_ea2ef712-7b40-4c6d-9e84-7d45df00e8fd.pdf", "pdfs/301_C_1340868_2023.pdf", "pdfs/301_C_1340867_2023.pdf"]	/api/download/job/ea2ef712-7b40-4c6d-9e84-7d45df00e8fd/egm_bill_tracking_ea2ef712-7b40-4c6d-9e84-7d45df00e8fd.pdf	2.00	\N	2025-10-12 09:18:53.224327+00	2025-10-12 09:18:53.229+00	2025-10-12 09:19:50.391+00
c77cbebe-479f-46cf-8b0e-1e0298fd37f7	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	completed	1	/var/www/smart-process-flow/uploads/1760262537265-egm-download-template.csv	1760262537265-egm-download-template.csv	/var/www/smart-process-flow/results/job_c77cbebe-479f-46cf-8b0e-1e0298fd37f7	[]	\N	2.00	\N	2025-10-12 09:48:57.290001+00	2025-10-12 09:48:57.293+00	2025-10-12 09:48:57.319+00
29ae6f8b-6c91-428b-ad84-8b46f7cf8d70	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	processing	1	/var/www/smart-process-flow/uploads/1760264131849-egm-download-template.csv	1760264131849-egm-download-template.csv	/var/www/smart-process-flow/results/job_29ae6f8b-6c91-428b-ad84-8b46f7cf8d70	[]	\N	2.00	\N	2025-10-12 10:15:31.859806+00	2025-10-12 10:15:31.864+00	\N
3bb414a4-da80-4d4f-8584-0ddcf1cc5e8d	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	failed	1	/var/www/smart-process-flow/uploads/1760264641690-fcr_numbers.csv	1760264641690-fcr_numbers.csv	/var/www/smart-process-flow/results/job_3bb414a4-da80-4d4f-8584-0ddcf1cc5e8d	[]	\N	2.20	Script exited with code 1	2025-10-12 10:24:01.715018+00	2025-10-12 10:24:01.718+00	2025-10-12 10:24:02.481+00
75ee8872-c8c0-4167-8eb6-1d39442f6b34	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	completed	0	/var/www/smart-process-flow/uploads/1759999289348-fcr_numbers.csv	fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_75ee8872-c8c0-4167-8eb6-1d39442f6b34	[]	\N	2.00	\N	2025-10-09 08:41:29.355611+00	2025-10-09 08:41:29.363+00	2025-10-09 08:41:59.526+00
d6aef9c3-52f8-42f6-82e1-36595f733254	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	completed	1	/var/www/smart-process-flow/uploads/1760245295537-egm-download-template.csv	1760245295537-egm-download-template.csv	/var/www/smart-process-flow/results/job_d6aef9c3-52f8-42f6-82e1-36595f733254	[]	\N	2.00	\N	2025-10-12 05:01:35.56646+00	2025-10-12 05:01:35.571+00	2025-10-12 05:04:10.854+00
2b2abe1a-5c55-4c16-b314-722826713284	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	completed	0	/var/www/smart-process-flow/uploads/1759999961470-fcr_numbers.csv	fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_2b2abe1a-5c55-4c16-b314-722826713284	[]	\N	2.00	\N	2025-10-09 08:52:41.476866+00	2025-10-09 08:52:41.484+00	2025-10-09 08:53:21.29+00
3df02137-f0fa-47b4-aba2-8f7027b9fc26	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	completed	0	/var/www/smart-process-flow/uploads/1760001511245-ctg-port-tracking-template.csv	ctg-port-tracking-template.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_3df02137-f0fa-47b4-aba2-8f7027b9fc26	[]	\N	2.00	\N	2025-10-09 09:18:31.267945+00	2025-10-09 09:18:31.272+00	2025-10-09 09:19:10.849+00
6a1632d0-b3e5-4af5-8934-b00f6a464168	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	completed	0	/var/www/smart-process-flow/uploads/1760001695949-ctg-port-tracking-template.csv	ctg-port-tracking-template.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_6a1632d0-b3e5-4af5-8934-b00f6a464168	[]	\N	2.00	\N	2025-10-09 09:21:35.968837+00	2025-10-09 09:21:35.973+00	2025-10-09 09:22:21.791+00
fb7699fe-7d17-4fa8-bd11-e83c45735d39	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	0	/var/www/smart-process-flow/uploads/1760001779004-fcr_numbers.csv	fcr_numbers.csv	/var/www/smart-process-flow/results/5ecd2736-a218-4850-8711-04522026846b_fb7699fe-7d17-4fa8-bd11-e83c45735d39	["damco_tracking_report_20251009_092359.pdf"]	/api/download/job/fb7699fe-7d17-4fa8-bd11-e83c45735d39/damco_tracking_report_20251009_092359.pdf	2.20	\N	2025-10-09 09:22:59.016384+00	2025-10-09 09:22:59.02+00	2025-10-09 09:23:59.953+00
f13346f9-620d-4638-a055-f84676d6150b	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	completed	1	/var/www/smart-process-flow/uploads/1760003594060-ctg-port-tracking-template.csv	1760003594060-ctg-port-tracking-template.csv	/var/www/smart-process-flow/results/job_f13346f9-620d-4638-a055-f84676d6150b	["ctg_port_tracking_summary_20251009_095353.json", "ctg_port_automation_log_20251009_095353.txt", "ctg_port_tracking_report_20251009_095353.pdf", "pdfs/002_CMAU6925487_tracking.pdf", "pdfs/001_FFAU1212809_tracking.pdf"]	/api/download/job/f13346f9-620d-4638-a055-f84676d6150b/ctg_port_tracking_summary_20251009_095353.json	2.00	\N	2025-10-09 09:53:14.078796+00	2025-10-09 09:53:14.082+00	2025-10-09 09:53:53.395+00
c1a774cc-96e5-4455-b988-aed168044f18	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	completed	1	/var/www/smart-process-flow/uploads/1760003740325-ctg-port-tracking-template.csv	1760003740325-ctg-port-tracking-template.csv	/var/www/smart-process-flow/results/job_c1a774cc-96e5-4455-b988-aed168044f18	["ctg_port_tracking_summary_20251009_095619.json", "ctg_port_automation_log_20251009_095619.txt", "ctg_port_tracking_report_20251009_095619.pdf", "pdfs/002_CMAU6925487_tracking.pdf", "pdfs/001_FFAU1212809_tracking.pdf"]	/api/download/job/c1a774cc-96e5-4455-b988-aed168044f18/ctg_port_tracking_summary_20251009_095619.json	2.00	\N	2025-10-09 09:55:40.332848+00	2025-10-09 09:55:40.34+00	2025-10-09 09:56:20.174+00
97357e43-91df-43b8-b8c3-d9bd7745402c	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	1	/var/www/smart-process-flow/uploads/1760003796080-fcr_numbers.csv	1760003796080-fcr_numbers.csv	/var/www/smart-process-flow/results/job_97357e43-91df-43b8-b8c3-d9bd7745402c	["damco_tracking_report_20251009_095702.pdf", "pdfs/002_CTG2399927_tracking.pdf", "pdfs/001_CTG2399919_tracking.pdf"]	/api/download/job/97357e43-91df-43b8-b8c3-d9bd7745402c/damco_tracking_report_20251009_095702.pdf	2.20	\N	2025-10-09 09:56:36.082777+00	2025-10-09 09:56:36.085+00	2025-10-09 09:57:02.786+00
d244757d-0c21-4589-9b55-ed1d0c22a80c	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	1	/var/www/smart-process-flow/uploads/1760007481572-fcr_numbers.csv	1760007481572-fcr_numbers.csv	/var/www/smart-process-flow/results/job_d244757d-0c21-4589-9b55-ed1d0c22a80c	["damco_tracking_report_20251009_105826.pdf", "pdfs/002_CTG2399927_tracking.pdf", "pdfs/001_CTG2399919_tracking.pdf"]	/api/download/job/d244757d-0c21-4589-9b55-ed1d0c22a80c/damco_tracking_report_20251009_105826.pdf	2.20	\N	2025-10-09 10:58:01.593232+00	2025-10-09 10:58:01.598+00	2025-10-09 10:58:28.485+00
24131bd1-ee63-432c-b466-85874ff9c3ec	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	completed	1	/var/www/smart-process-flow/uploads/1760007544683-ctg-port-tracking-template.csv	1760007544683-ctg-port-tracking-template.csv	/var/www/smart-process-flow/results/job_24131bd1-ee63-432c-b466-85874ff9c3ec	["ctg_port_tracking_summary_20251009_105951.json", "ctg_port_automation_log_20251009_105951.txt", "ctg_port_tracking_report_20251009_105951.pdf", "pdfs/002_CMAU6925487_tracking.pdf", "pdfs/001_FFAU1212809_tracking.pdf"]	/api/download/job/24131bd1-ee63-432c-b466-85874ff9c3ec/ctg_port_tracking_summary_20251009_105951.json	2.00	\N	2025-10-09 10:59:04.698203+00	2025-10-09 10:59:04.703+00	2025-10-09 10:59:51.512+00
5990ff3e-6700-4115-9ced-b0a5bf65f225	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	completed	1	/var/www/smart-process-flow/uploads/1760008256599-ctg-port-tracking-template.csv	1760008256599-ctg-port-tracking-template.csv	/var/www/smart-process-flow/results/job_5990ff3e-6700-4115-9ced-b0a5bf65f225	["ctg_port_tracking_summary_20251009_111135.json", "ctg_port_automation_log_20251009_111135.txt", "ctg_port_tracking_report_20251009_111135.pdf", "pdfs/002_CMAU6925487_tracking.pdf", "pdfs/001_FFAU1212809_tracking.pdf"]	/api/download/job/5990ff3e-6700-4115-9ced-b0a5bf65f225/ctg_port_tracking_summary_20251009_111135.json	2.00	\N	2025-10-09 11:10:56.604753+00	2025-10-09 11:10:56.608+00	2025-10-09 11:11:35.469+00
b38da03c-c367-4b3f-9afb-ddf0e638511a	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	completed	1	/var/www/smart-process-flow/uploads/1760008344546-fcr_numbers.csv	1760008344546-fcr_numbers.csv	/var/www/smart-process-flow/results/job_b38da03c-c367-4b3f-9afb-ddf0e638511a	["damco_tracking_report_20251009_111304.pdf", "pdfs/002_CTG2399927_tracking.pdf", "pdfs/001_CTG2399919_tracking.pdf"]	/api/download/job/b38da03c-c367-4b3f-9afb-ddf0e638511a/damco_tracking_report_20251009_111304.pdf	2.20	\N	2025-10-09 11:12:24.557684+00	2025-10-09 11:12:24.561+00	2025-10-09 11:13:04.912+00
5413ad9f-e92d-44d9-b94b-7e0a36390211	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	ctg-port-tracking	CTG Port Authority Tracking	completed	1	/var/www/smart-process-flow/uploads/1760009176076-ctg-port-tracking-template.csv	1760009176076-ctg-port-tracking-template.csv	/var/www/smart-process-flow/results/job_5413ad9f-e92d-44d9-b94b-7e0a36390211	["ctg_port_tracking_report_20251009_112658.pdf", "pdfs/002_CMAU6925487_tracking.pdf", "pdfs/001_FFAU1212809_tracking.pdf", "ctg_port_tracking_summary_20251009_112658.json", "ctg_port_automation_log_20251009_112658.txt"]	/api/download/job/5413ad9f-e92d-44d9-b94b-7e0a36390211/ctg_port_tracking_report_20251009_112658.pdf	2.00	\N	2025-10-09 11:26:16.085134+00	2025-10-09 11:26:16.09+00	2025-10-09 11:26:59.017+00
63a080a7-0e03-4f3b-8b8e-e30127c39341	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	completed	1	/var/www/smart-process-flow/uploads/1760009208186-ctg-port-tracking-template.csv	1760009208186-ctg-port-tracking-template.csv	/var/www/smart-process-flow/results/job_63a080a7-0e03-4f3b-8b8e-e30127c39341	["ctg_port_tracking_report_20251009_112727.pdf", "pdfs/002_CMAU6925487_tracking.pdf", "pdfs/001_FFAU1212809_tracking.pdf", "ctg_port_tracking_summary_20251009_112727.json", "ctg_port_automation_log_20251009_112727.txt"]	/api/download/job/63a080a7-0e03-4f3b-8b8e-e30127c39341/ctg_port_tracking_report_20251009_112727.pdf	2.00	\N	2025-10-09 11:26:48.189766+00	2025-10-09 11:26:48.193+00	2025-10-09 11:27:28.75+00
e1f6008c-6c81-4ba5-946a-698fea1da6bf	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	failed	1	/var/www/smart-process-flow/uploads/1760240657729-egm-download-template.csv	1760240657729-egm-download-template.csv	/var/www/smart-process-flow/results/job_e1f6008c-6c81-4ba5-946a-698fea1da6bf	[]	\N	2.00	Unable to start browser session. Please contact support if this persists.	2025-10-12 03:44:17.75174+00	2025-10-12 03:44:17.756+00	2025-10-12 03:45:19.918+00
b93e7300-344c-4816-b3d4-4f31ea7c7c7b	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	completed	1	/var/www/smart-process-flow/uploads/1760245505536-egm-download-template.csv	1760245505536-egm-download-template.csv	/var/www/smart-process-flow/results/job_b93e7300-344c-4816-b3d4-4f31ea7c7c7b	[]	\N	2.00	\N	2025-10-12 05:05:05.569203+00	2025-10-12 05:05:05.575+00	2025-10-12 05:07:17.382+00
16c06a7a-26ec-4c3c-9d94-d1a7bd374068	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	completed	1	/var/www/smart-process-flow/uploads/1760068892777-egm-download-template.csv	1760068892777-egm-download-template.csv	/var/www/smart-process-flow/results/job_16c06a7a-26ec-4c3c-9d94-d1a7bd374068	["egm_download_summary_20251010_040202.json", "egm_download_log_20251010_040202.txt"]	/api/download/job/16c06a7a-26ec-4c3c-9d94-d1a7bd374068/egm_download_summary_20251010_040202.json	5.00	\N	2025-10-10 04:01:32.803055+00	2025-10-10 04:01:32.807+00	2025-10-10 04:02:03.033+00
03ded696-2fdf-4da3-b15b-35fe42e7a3e6	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	failed	1	/var/www/smart-process-flow/uploads/1760068754141-egm-download-template.csv	1760068754141-egm-download-template.csv	/var/www/smart-process-flow/results/job_03ded696-2fdf-4da3-b15b-35fe42e7a3e6	[]	\N	5.00	Job timeout - exceeded 10 minutes	2025-10-10 03:59:14.148967+00	2025-10-10 03:59:14.152+00	2025-10-10 05:01:02.475+00
b3a04e97-1bac-4f0f-add4-81e6c747b2fe	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	processing	1	/var/www/smart-process-flow/uploads/1760261658445-egm-download-template.csv	1760261658445-egm-download-template.csv	/var/www/smart-process-flow/results/job_b3a04e97-1bac-4f0f-add4-81e6c747b2fe	[]	\N	2.00	\N	2025-10-12 09:34:18.456628+00	2025-10-12 09:34:18.459+00	\N
677a158a-91e4-4045-9ef0-1e94db3989f3	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	failed	1	/var/www/smart-process-flow/uploads/1760229057221-bill_entries.csv	1760229057221-bill_entries.csv	/var/www/smart-process-flow/results/job_677a158a-91e4-4045-9ef0-1e94db3989f3	[]	\N	2.00	[1;35mSyntaxError[0m: [35mNon-UTF-8 code starting with '\\x97' in file /var/www/smart-process-flow/automation_scripts/egm_download.py on line 20, but no encoding declared; see https://peps.python.org/pep-0263/ for details[0m\n	2025-10-12 00:30:57.22827+00	2025-10-12 00:30:57.232+00	2025-10-12 00:30:57.474+00
7bffa7c4-6322-4e2d-b91c-5d4e045c6d88	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	failed	1	/var/www/smart-process-flow/uploads/1760229177105-bill_entries.csv	1760229177105-bill_entries.csv	/var/www/smart-process-flow/results/job_7bffa7c4-6322-4e2d-b91c-5d4e045c6d88	[]	\N	2.00	  File [35m"/var/www/smart-process-flow/automation_scripts/egm_download.py"[0m, line [35m22[0m\n    print([1;31m"?? SpeechRecognition not installed � audio challenge skipped[0m.")\n          [1;31m^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^[0m\n[1;35mSyntaxError[0m: [35m(unicode error) 'utf-8' codec can't decode byte 0x97 in position 35: invalid start byte[0m\n	2025-10-12 00:32:57.125705+00	2025-10-12 00:32:57.129+00	2025-10-12 00:32:57.314+00
a2881a3e-4661-4965-8fd0-159f3fb41d98	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	failed	1	/var/www/smart-process-flow/uploads/1760229225782-bill_entries.csv	1760229225782-bill_entries.csv	/var/www/smart-process-flow/results/job_a2881a3e-4661-4965-8fd0-159f3fb41d98	[]	\N	2.00	  File [35m"/var/www/smart-process-flow/automation_scripts/egm_download.py"[0m, line [35m22[0m\n    print([1;31m"?? SpeechRecognition not installed � audio challenge skipped[0m.")\n          [1;31m^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^[0m\n[1;35mSyntaxError[0m: [35m(unicode error) 'utf-8' codec can't decode byte 0x97 in position 35: invalid start byte[0m\n	2025-10-12 00:33:45.790441+00	2025-10-12 00:33:45.794+00	2025-10-12 00:33:46.091+00
c09407de-6d2a-48e5-815e-4a425072c191	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	failed	1	/var/www/smart-process-flow/uploads/1760229480406-bill_entries.csv	1760229480406-bill_entries.csv	/var/www/smart-process-flow/results/job_c09407de-6d2a-48e5-815e-4a425072c191	[]	\N	2.00	Traceback (most recent call last):\n  File [35m"/var/www/smart-process-flow/automation_scripts/egm_download.py"[0m, line [35m12[0m, in [35m<module>[0m\n    from fpdf import FPDF\n[1;35mModuleNotFoundError[0m: [35mNo module named 'fpdf'[0m\n	2025-10-12 00:38:00.42881+00	2025-10-12 00:38:00.433+00	2025-10-12 00:38:00.968+00
ace3d026-9676-478e-90b1-b77576535e80	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	completed	1	/var/www/smart-process-flow/uploads/1760229712583-bill_entries.csv	1760229712583-bill_entries.csv	/var/www/smart-process-flow/results/job_ace3d026-9676-478e-90b1-b77576535e80	[]	\N	2.00	\N	2025-10-12 00:41:52.593758+00	2025-10-12 00:41:52.597+00	2025-10-12 00:41:53.323+00
9aa5ade0-8fac-469b-8dcd-53862cf6b446	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	completed	1	/var/www/smart-process-flow/uploads/1760239951334-egm-download-template.csv	1760239951334-egm-download-template.csv	/var/www/smart-process-flow/results/job_9aa5ade0-8fac-469b-8dcd-53862cf6b446	[]	\N	5.00	\N	2025-10-12 03:32:31.342001+00	2025-10-12 03:32:31.345+00	2025-10-12 03:32:31.954+00
47023bd1-cd47-467e-86e6-5654d411fb83	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	failed	1	/var/www/smart-process-flow/uploads/1760240270202-egm-download-template.csv	1760240270202-egm-download-template.csv	/var/www/smart-process-flow/results/job_47023bd1-cd47-467e-86e6-5654d411fb83	[]	\N	5.00	Traceback (most recent call last):\n  File [35m"/var/www/smart-process-flow/automation_scripts/egm_download.py"[0m, line [35m285[0m, in [35m<module>[0m\n    exit_code = main()\n  File [35m"/var/www/smart-process-flow/automation_scripts/egm_download.py"[0m, line [35m237[0m, in [35mmain[0m\n    driver = setup_driver()\n  File [35m"/var/www/smart-process-flow/automation_scripts/egm_download.py"[0m, line [35m85[0m, in [35msetup_driver[0m\n    driver = uc.Chrome(options=opts)\n  File [35m"/usr/local/lib/python3.13/dist-packages/undetected_chromedriver/__init__.py"[0m, line [35m466[0m, in [35m__init__[0m\n    [31msuper(Chrome, self).__init__[0m[1;31m([0m\n    [31m~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m[1;31m^[0m\n        [1;31mservice=service,[0m\n        [1;31m^^^^^^^^^^^^^^^^[0m\n        [1;31moptions=options,[0m\n        [1;31m^^^^^^^^^^^^^^^^[0m\n        [1;31mkeep_alive=keep_alive,[0m\n        [1;31m^^^^^^^^^^^^^^^^^^^^^^[0m\n    [1;31m)[0m\n    [1;31m^[0m\n  File [35m"/usr/lib/python3/dist-packages/selenium/webdriver/chrome/webdriver.py"[0m, line [35m45[0m, in [35m__init__[0m\n    [31msuper().__init__[0m[1;31m([0m\n    [31m~~~~~~~~~~~~~~~~[0m[1;31m^[0m\n        [1;31mbrowser_name=DesiredCapabilities.CHROME["browserName"],[0m\n        [1;31m^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^[0m\n    ...<3 lines>...\n        [1;31mkeep_alive=keep_alive,[0m\n        [1;31m^^^^^^^^^^^^^^^^^^^^^^[0m\n    [1;31m)[0m\n    [1;31m^[0m\n  File [35m"/usr/lib/python3/dist-packages/selenium/webdriver/chromium/webdriver.py"[0m, line [35m66[0m, in [35m__init__[0m\n    [31msuper().__init__[0m[1;31m(command_executor=executor, options=options)[0m\n    [31m~~~~~~~~~~~~~~~~[0m[1;31m^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^[0m\n  File [35m"/usr/lib/python3/dist-packages/selenium/webdriver/remote/webdriver.py"[0m, line [35m212[0m, in [35m__init__[0m\n    [31mself.start_session[0m[1;31m(capabilities)[0m\n    [31m~~~~~~~~~~~~~~~~~~[0m[1;31m^^^^^^^^^^^^^^[0m\n  File [35m"/usr/local/lib/python3.13/dist-packages/undetected_chromedriver/__init__.py"[0m, line [35m724[0m, in [35mstart_session[0m\n    [31msuper(selenium.webdriver.chrome.webdriver.WebDriver, self).start_session[0m[1;31m([0m\n    [31m~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m[1;31m^[0m\n        [1;31mcapabilities[0m\n        [1;31m^^^^^^^^^^^^[0m\n    [1;31m)[0m\n    [1;31m^[0m\n  File [35m"/usr/lib/python3/dist-packages/selenium/webdriver/remote/webdriver.py"[0m, line [35m299[0m, in [35mstart_session[0m\n    response = [31mself.execute[0m[1;31m(Command.NEW_SESSION, caps)[0m["value"]\n               [31m~~~~~~~~~~~~[0m[1;31m^^^^^^^^^^^^^^^^^^^^^^^^^^^[0m\n  File [35m"/usr/lib/python3/dist-packages/selenium/webdriver/remote/webdriver.py"[0m, line [35m354[0m, in [35mexecute[0m\n    [31mself.error_handler.check_response[0m[1;31m(response)[0m\n    [31m~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m[1;31m^^^^^^^^^^[0m\n  File [35m"/usr/lib/python3/dist-packages/selenium/webdriver/remote/errorhandler.py"[0m, line [35m229[0m, in [35mcheck_response[0m\n    raise exception_class(message, screen, stacktrace)\n[1;35mselenium.common.exceptions.SessionNotCreatedException[0m: [35mMessage: session not created: cannot connect to chrome at 127.0.0.1:35137\nfrom session not created: This version of ChromeDriver only supports Chrome version 141\nCurrent browser version is 140.0.7339.207\nStacktrace:\n#0 0x5775283944ca <unknown>\n#1 0x577527e13566 <unknown>\n#2 0x577527e5473b <unknown>\n#3 0x577527e535c2 <unknown>\n#4 0x577527e48e2f <unknown>\n#5 0x577527e99bd3 <unknown>\n#6 0x577527e99286 <unknown>\n#7 0x577527e8b403 <unknown>\n#8 0x577527e57b02 <unknown>\n#9 0x577527e587c1 <unknown>\n#10 0x577528358298 <unknown>\n#11 0x57752835c0ff <unknown>\n#12 0x57752833f729 <unknown>\n#13 0x57752835cca5 <unknown>\n#14 0x577528324f8f <unknown>\n#15 0x577528381308 <unknown>\n#16 0x5775283814e3 <unknown>\n#17 0x577528393463 <unknown>\n#18 0x73aee2ca27f1 <unknown>\n#19 0x73aee2d33b5c <unknown>\n[0m\n	2025-10-12 03:37:50.21189+00	2025-10-12 03:37:50.216+00	2025-10-12 03:37:52.491+00
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
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.contact_messages (id, name, email, company, subject, message, submitted_at, ip_address, status) FROM stdin;
aeba741c-286c-458e-b352-29051cbc19b2	Izaz Ahamed	izaz.sub@gmail.com	Smart Process Flow	general	test	2025-10-09 07:02:01.243025+00	::ffff:127.0.0.1	new
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
18ad4b52-a35a-4aef-80fc-ed1559984af9	2.00	100	200	["webcontainer-demo", "ctg-port-tracking", "damco-tracking-maersk", "egm-download", "exp-search"]	{"exp-issue": 2, "exp-search": 0.5, "egm-download": 1, "damco-booking": 3, "bepza-ep-issue": 2.5, "bepza-ip-issue": 2.5, "exp-correction": 1.5, "bepza-ip-submit": 2, "custom-tracking": 1.5, "hm-packing-list": 1, "bepza-ep-download": 1, "bepza-ip-download": 1, "ctg-port-tracking": 1, "damco-edoc-upload": 1, "hm-einvoice-create": 2, "bepza-ep-submission": 2, "damco-fcr-extractor": 1.5, "myshipment-tracking": 1, "pdf-excel-converter": 1, "damco-fcr-submission": 2, "hm-einvoice-download": 1, "damco-tracking-maersk": 1.1, "damco-booking-download": 1, "hm-einvoice-correction": 1.5, "exp-duplicate-reporting": 2, "cash-incentive-application": 3}	{"type": "info", "enabled": false, "message": "", "showToAll": true}	2025-10-03 22:39:48.903702+00	2025-10-12 10:51:20.880435+00
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.transactions (id, user_id, transaction_type, amount_bdt, credits_amount, payment_method, payment_status, transaction_id, gateway_reference, payment_date, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.users (id, email, name, company, mobile, password_hash, credits, is_admin, status, email_verified, member_since, trial_ends_at, total_spent, last_activity, created_at, updated_at, reset_password_token, reset_password_expires_at, verification_token, verification_token_expires, password_reset_token, password_reset_token_expires) FROM stdin;
52cd7f19-58f1-4667-b0e4-cd3e5c885b54	demo@demo.com	demoo	demo	01222	$2a$10$4ifg1jsi61ExhAzJirZCNO5wZYv.p2vhIKIHmHgpHQigg20atNXSO	45.60	f	active	t	2025-10-03	2025-11-02	0.00	2025-10-03	2025-10-03 22:57:24.224604+00	2025-10-12 10:35:51.418045+00	\N	\N	\N	\N	\N	\N
5ecd2736-a218-4850-8711-04522026846b	izaz.sub@gmail.com	Izaz Ahamed	PR3f9m602	02155552	$2a$10$e0y2/GazY0iYcm8b/HHSFeGIaPgcFQus9AqkN1dmk3FXkgmt0gHJ2	98.00	t	active	t	2025-10-03	2025-11-02	0.00	2025-10-03	2025-10-03 22:40:52.908844+00	2025-10-06 12:15:34.496418+00	f98679a22b27f955cbeaad1983f6bc12d2c539128102df9d6d1a582be34ca176	2025-10-06 13:15:34.495+00	\N	\N	c55408b7641e84d15f858b013d0bef8b9e3273dc83fbe0c9d4ae96569518f1b3	2025-10-09 11:47:09.789+00
\.


--
-- Data for Name: work_history; Type: TABLE DATA; Schema: public; Owner: spf_user
--

COPY public.work_history (id, user_id, service_id, service_name, file_name, credits_used, status, result_files, download_url, created_at, expires_at, files_generated_count, bulk_upload_id, row_number) FROM stdin;
1de5b0fe-0887-4ec4-8d14-b9337876717b	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1.00	completed	["damco_tracking_report_20251003_224142.pdf", "pdfs/001_CTG2358534_tracking.pdf", "pdfs/002_CTG2358538_tracking.pdf"]	/api/download/job/4ec37a2f-2aa2-4523-8f8e-146872454046/damco_tracking_report_20251003_224142.pdf	2025-10-03 22:41:43.695805+00	2025-10-10 22:41:43.695805+00	3	\N	\N
6a2820a4-ee17-4e25-8852-87378315f1e9	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1.00	completed	["damco_tracking_report_20251003_230016.pdf"]	/api/download/job/98c661e2-b81e-4b5d-8967-abe7edf90c9a/damco_tracking_report_20251003_230016.pdf	2025-10-03 23:00:17.527807+00	2025-10-10 23:00:17.527807+00	1	\N	\N
28d6004a-c7bb-4d20-be82-80c86239fa93	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1.00	completed	["damco_tracking_report_20251003_230653.pdf"]	/api/download/job/33c8b2d7-12d5-4193-b62f-10be86088959/damco_tracking_report_20251003_230653.pdf	2025-10-03 23:06:53.846741+00	2025-10-10 23:06:53.846741+00	1	\N	\N
e5bdae08-b808-46f0-b352-02e2c987460e	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers.csv	1.00	completed	["damco_tracking_report_20251003_231103.pdf"]	/api/download/job/0ff32ff5-a560-4b74-9ce1-a629d2736978/damco_tracking_report_20251003_231103.pdf	2025-10-03 23:11:04.534868+00	2025-10-10 23:11:04.534868+00	1	\N	\N
52db98cb-a9fd-4356-af47-da97b9272008	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1.00	completed	["damco_tracking_report_20251003_231912.pdf"]	/api/download/job/7d30d020-0598-4b5e-81bc-908337f0d1cd/damco_tracking_report_20251003_231912.pdf	2025-10-03 23:19:12.945377+00	2025-10-10 23:19:12.945377+00	1	\N	\N
327f2b86-0605-452f-b169-fc1aae933676	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1.00	completed	["damco_tracking_report_20251003_232715.pdf"]	/api/download/job/c5630365-69b1-41d7-b768-f8768fabd50c/damco_tracking_report_20251003_232715.pdf	2025-10-03 23:27:15.951674+00	2025-10-10 23:27:15.951674+00	1	\N	\N
114f9122-92ce-45a0-8307-d75e624890a8	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1.00	completed	["damco_tracking_report_20251003_232903.pdf"]	/api/download/job/27d8b372-dc7d-4fc7-8189-6e985e0d9144/damco_tracking_report_20251003_232903.pdf	2025-10-03 23:29:04.038893+00	2025-10-10 23:29:04.038893+00	1	\N	\N
f9fad488-64f3-4312-9804-09c8d520c1bf	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1.00	completed	["damco_tracking_report_20251003_233050.pdf"]	/api/download/job/ab188366-82e5-4c8f-bc06-9322bd3b1488/damco_tracking_report_20251003_233050.pdf	2025-10-03 23:30:51.260358+00	2025-10-10 23:30:51.260358+00	1	\N	\N
618f68e5-a307-421e-b408-6273029cbd12	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1.00	completed	["damco_tracking_report_20251003_233226.pdf"]	/api/download/job/5d509b97-59dd-4141-8ad3-b10f6e45f75d/damco_tracking_report_20251003_233226.pdf	2025-10-03 23:32:26.841626+00	2025-10-10 23:32:26.841626+00	1	\N	\N
8a900d4c-4b2e-47a9-b88f-8b36e088ede3	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1.00	completed	["damco_tracking_report_20251004_070420.pdf"]	/api/download/job/affe41f7-cba3-4cf4-b995-1645ca36425a/damco_tracking_report_20251004_070420.pdf	2025-10-04 07:04:20.788997+00	2025-10-11 07:04:20.788997+00	1	\N	\N
68f3e676-5138-475f-bf4e-5bd0318e7ab4	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1.00	completed	["damco_tracking_report_20251004_073451.pdf"]	/api/download/job/952360c4-093e-4d9d-8c5d-ee13bbab8848/damco_tracking_report_20251004_073451.pdf	2025-10-04 07:34:52.496068+00	2025-10-11 07:34:52.496068+00	1	\N	\N
e8803839-a113-49ee-ac5e-3486944051a2	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1.00	completed	["damco_tracking_report_20251004_073619.pdf"]	/api/download/job/1a92f434-843f-43b8-b965-0234542694aa/damco_tracking_report_20251004_073619.pdf	2025-10-04 07:36:20.951049+00	2025-10-11 07:36:20.951049+00	1	\N	\N
116c0df5-60ff-48b2-a905-fbe8b036ff40	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers copy.csv	1.00	completed	["damco_tracking_report_20251004_073750.pdf"]	/api/download/job/427c2155-c3ff-4f6f-b9a5-758577190bba/damco_tracking_report_20251004_073750.pdf	2025-10-04 07:37:51.017994+00	2025-10-11 07:37:51.017994+00	1	\N	\N
267ab333-50e6-4f3c-a94b-9bf642f0593a	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers.csv	1.00	completed	["damco_tracking_report_20251004_103539.pdf"]	/api/download/job/5cb147b7-b565-4967-92f9-9b2f35e97e6b/damco_tracking_report_20251004_103539.pdf	2025-10-04 10:35:39.919226+00	2025-10-11 10:35:39.919226+00	1	\N	\N
157ff4de-8531-495d-bd9e-1898937749bc	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1759523396856-fcr_numbers.csv	1.00	completed	["damco_tracking_report_20251005_034147.pdf"]	/api/download/job/ae249cb7-e76a-4ef8-af1a-993c2780c1c3/damco_tracking_report_20251005_034147.pdf	2025-10-05 03:41:48.486927+00	2025-10-12 03:41:48.486927+00	1	\N	\N
d73ff83a-cd3e-4bef-a67c-4b51072512b7	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1759523396856-fcr_numbers.csv	1.00	completed	["damco_tracking_report_20251005_034325.pdf"]	/api/download/job/50fb72a6-fe04-4c9a-a5ea-2ea06c546921/damco_tracking_report_20251005_034325.pdf	2025-10-05 03:43:26.212734+00	2025-10-12 03:43:26.212734+00	1	\N	\N
3a5301a3-2640-498a-a7f9-d5d7ffec80dc	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1759523396856-fcr_numbers.csv	1.00	completed	["damco_tracking_report_20251005_051257.pdf"]	/api/download/job/2b8c2c21-94a0-4488-ad66-2d31c3898833/damco_tracking_report_20251005_051257.pdf	2025-10-05 05:12:59.152419+00	2025-10-12 05:12:59.152419+00	1	\N	\N
e1976867-b73b-433c-8b7d-21b563ef2eaa	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1759523831235-fcr_numbers.csv	1.00	completed	["damco_tracking_report_20251005_051816.pdf"]	/api/download/job/6dcb5be6-9dd7-4b8b-b877-c0e642b70929/damco_tracking_report_20251005_051816.pdf	2025-10-05 05:18:17.434303+00	2025-10-12 05:18:17.434303+00	1	\N	\N
b80617e9-4e90-4599-ac4b-899df63c64d0	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1759523396856-fcr_numbers.csv	1.00	completed	["damco_tracking_report_20251005_052751.pdf"]	/api/download/job/2486ea69-8db1-47ea-8975-21ee1e635231/damco_tracking_report_20251005_052751.pdf	2025-10-05 05:27:52.135954+00	2025-10-12 05:27:52.135954+00	1	\N	\N
09245f4a-1a3d-4a87-bb3e-6d160bc10a9d	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1759523831235-fcr_numbers.csv	1.00	completed	["damco_tracking_report_20251005_062706.pdf"]	/api/download/job/23b4e6d6-677d-4508-85bc-fc2e4e1289af/damco_tracking_report_20251005_062706.pdf	2025-10-05 06:27:06.78346+00	2025-10-12 06:27:06.78346+00	1	\N	\N
5780a3b2-892b-45e5-b36e-401d379e47ba	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1759523967693-fcr_numbers.csv	2.00	completed	["damco_tracking_report_20251005_074607.pdf"]	/api/download/job/72426a6d-3333-4756-a6f1-712d141b5e45/damco_tracking_report_20251005_074607.pdf	2025-10-05 07:46:08.130167+00	2025-10-12 07:46:08.130167+00	1	\N	\N
ebe9a4dd-dd01-4a24-bbcd-34d8e869caf9	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1759523967693-fcr_numbers.csv	2.00	completed	["damco_tracking_report_20251005_074728.pdf"]	/api/download/job/9601f70d-437f-4aa6-84c1-4f3e4a83bce7/damco_tracking_report_20251005_074728.pdf	2025-10-05 07:47:29.433209+00	2025-10-12 07:47:29.433209+00	1	\N	\N
f1139bc9-14e7-4f63-98d6-c97eb809684c	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1759523396856-fcr_numbers.csv	2.00	completed	["damco_tracking_report_20251005_081724.pdf"]	/api/download/job/c6646878-7854-4031-8eb9-e6bc4d9ab732/damco_tracking_report_20251005_081724.pdf	2025-10-05 08:17:25.262849+00	2025-10-12 08:17:25.262849+00	1	\N	\N
dd41beb7-9daf-4283-b680-10a5b227137d	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1759523831235-fcr_numbers.csv	2.00	completed	["damco_tracking_report_20251005_085113.pdf"]	/api/download/job/46b64d47-7142-4a19-a367-4c3361e26090/damco_tracking_report_20251005_085113.pdf	2025-10-05 08:51:13.666628+00	2025-10-12 08:51:13.666628+00	1	\N	\N
0d364948-ddfa-4b16-8298-82ae047f3f92	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	1759523831235-fcr_numbers.csv	2.00	completed	["damco_tracking_report_20251005_085308.pdf"]	/api/download/job/c56a3306-9218-40e2-8e1d-78102cfbc79a/damco_tracking_report_20251005_085308.pdf	2025-10-05 08:53:08.589045+00	2025-10-12 08:53:08.589045+00	1	\N	\N
91b5a6b8-aa03-4277-8168-793fe2233577	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	1759523381163-fcr_numbers copy.csv	2.00	completed	["damco_tracking_report_20251005_085754.pdf"]	/api/download/job/a4fd8d86-ea65-4854-b02b-cbd53e968950/damco_tracking_report_20251005_085754.pdf	2025-10-05 08:57:55.095122+00	2025-10-12 08:57:55.095122+00	2	\N	\N
99728517-1b86-4e43-ab0a-995534ebf249	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	1759523396856-fcr_numbers.csv	2.00	completed	["damco_tracking_report_20251005_091342.pdf"]	/api/download/job/822bacec-3601-4726-abb0-0c6aac71510f/damco_tracking_report_20251005_091342.pdf	2025-10-05 09:13:42.725417+00	2025-10-12 09:13:42.725417+00	2	\N	\N
0488e047-51bf-40e8-ab4a-041282b9ca1d	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	1759523831235-fcr_numbers.csv	2.00	completed	["damco_tracking_report_20251005_092447.pdf"]	/api/download/job/9dd70200-cb49-4633-bad5-bc41311940e3/damco_tracking_report_20251005_092447.pdf	2025-10-05 09:24:48.095219+00	2025-10-12 09:24:48.095219+00	2	\N	\N
d4791470-e56a-40f1-bd83-d0f2c96bf078	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	1759523831235-fcr_numbers.csv	2.00	completed	["damco_tracking_report_20251005_092656.pdf"]	/api/download/job/38973276-7c56-457c-ad7b-b1dc75cb0da9/damco_tracking_report_20251005_092656.pdf	2025-10-05 09:26:57.689072+00	2025-10-12 09:26:57.689072+00	2	\N	\N
062895e7-1e9f-4bb6-a0ea-c41d6479d335	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	1759523967693-fcr_numbers.csv	2.20	completed	["damco_tracking_report_20251005_100827.pdf"]	/api/download/job/5ed54e23-f5c5-4af2-b282-03e0aa8d2ffe/damco_tracking_report_20251005_100827.pdf	2025-10-05 10:08:28.294253+00	2025-10-12 10:08:28.294253+00	2	\N	\N
3e22b767-07fe-426c-9986-edee8719c121	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	1759523831235-fcr_numbers.csv	4.40	completed	["damco_tracking_report_20251005_112009.pdf"]	/api/download/job/a29d19e5-0fba-4f4e-ae24-e6cf55288d07/damco_tracking_report_20251005_112009.pdf	2025-10-05 11:20:10.086822+00	2025-10-12 11:20:10.086822+00	4	\N	\N
ead64b8e-3522-4d36-bb0a-924b9895e02f	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	fcr_numbers.csv	2.00	completed	[]	\N	2025-10-09 08:02:05.875429+00	2025-10-16 08:02:05.875429+00	0	\N	\N
1de088c6-aba0-40da-8f15-83d2297fd9f8	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	fcr_numbers.csv	2.00	completed	[]	\N	2025-10-09 08:41:59.528485+00	2025-10-16 08:41:59.528485+00	0	\N	\N
d04281c9-3d6a-4c01-8a13-b1c2a63a5e86	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	fcr_numbers.csv	2.00	completed	[]	\N	2025-10-09 08:53:21.29374+00	2025-10-16 08:53:21.29374+00	2	\N	\N
e8fe5b11-60d4-4a95-8a68-7c1f2333c150	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	ctg-port-tracking-template.csv	2.00	completed	[]	\N	2025-10-09 09:19:10.852738+00	2025-10-16 09:19:10.852738+00	2	\N	\N
b8a4d647-a7ed-40b1-9ef5-06add8760e74	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	ctg-port-tracking-template.csv	2.00	completed	[]	\N	2025-10-09 09:22:21.79353+00	2025-10-16 09:22:21.79353+00	2	\N	\N
bf1b4838-ad48-401e-a3f9-5909e3e7d0a8	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	fcr_numbers.csv	2.20	completed	["damco_tracking_report_20251009_092359.pdf"]	/api/download/job/fb7699fe-7d17-4fa8-bd11-e83c45735d39/damco_tracking_report_20251009_092359.pdf	2025-10-09 09:23:59.956924+00	2025-10-16 09:23:59.956924+00	2	\N	\N
58b49960-07c5-42e6-8e0a-696503d6d775	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	1760008256599-ctg-port-tracking-template.csv	2.00	completed	["ctg_port_tracking_summary_20251009_111135.json", "ctg_port_automation_log_20251009_111135.txt", "ctg_port_tracking_report_20251009_111135.pdf", "pdfs/002_CMAU6925487_tracking.pdf", "pdfs/001_FFAU1212809_tracking.pdf"]	/api/download/job/5990ff3e-6700-4115-9ced-b0a5bf65f225/ctg_port_tracking_summary_20251009_111135.json	2025-10-09 11:11:35.472852+00	2025-10-16 11:11:35.472852+00	2	\N	\N
cb2b686d-cdf5-4c7a-be52-14dfef3497b3	5ecd2736-a218-4850-8711-04522026846b	damco-tracking-maersk	Damco (APM) Tracking	1760008344546-fcr_numbers.csv	2.20	completed	["damco_tracking_report_20251009_111304.pdf", "pdfs/002_CTG2399927_tracking.pdf", "pdfs/001_CTG2399919_tracking.pdf"]	/api/download/job/b38da03c-c367-4b3f-9afb-ddf0e638511a/damco_tracking_report_20251009_111304.pdf	2025-10-09 11:13:04.914966+00	2025-10-16 11:13:04.914966+00	2	\N	\N
88ec55d1-c766-4f27-81f4-b4c5f8e7fbc5	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	ctg-port-tracking	CTG Port Authority Tracking	1760009176076-ctg-port-tracking-template.csv	2.00	completed	["ctg_port_tracking_report_20251009_112658.pdf", "pdfs/002_CMAU6925487_tracking.pdf", "pdfs/001_FFAU1212809_tracking.pdf", "ctg_port_tracking_summary_20251009_112658.json", "ctg_port_automation_log_20251009_112658.txt"]	/api/download/job/5413ad9f-e92d-44d9-b94b-7e0a36390211/ctg_port_tracking_report_20251009_112658.pdf	2025-10-09 11:26:59.021463+00	2025-10-16 11:26:59.021463+00	2	\N	\N
3155d676-414f-44cb-a0c6-0ef12deed995	5ecd2736-a218-4850-8711-04522026846b	ctg-port-tracking	CTG Port Authority Tracking	1760009208186-ctg-port-tracking-template.csv	2.00	completed	["ctg_port_tracking_report_20251009_112727.pdf", "pdfs/002_CMAU6925487_tracking.pdf", "pdfs/001_FFAU1212809_tracking.pdf", "ctg_port_tracking_summary_20251009_112727.json", "ctg_port_automation_log_20251009_112727.txt"]	/api/download/job/63a080a7-0e03-4f3b-8b8e-e30127c39341/ctg_port_tracking_report_20251009_112727.pdf	2025-10-09 11:27:28.754357+00	2025-10-16 11:27:28.754357+00	2	\N	\N
2d9076fb-b352-4eb8-b70d-cf1e9cdcb116	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	1760068892777-egm-download-template.csv	5.00	completed	["egm_download_summary_20251010_040202.json", "egm_download_log_20251010_040202.txt"]	/api/download/job/16c06a7a-26ec-4c3c-9d94-d1a7bd374068/egm_download_summary_20251010_040202.json	2025-10-10 04:02:03.037096+00	2025-10-17 04:02:03.037096+00	0	\N	\N
d84f06ce-ff7b-4c54-b1ed-96983eca18d6	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	1760229712583-bill_entries.csv	2.00	completed	[]	\N	2025-10-12 00:41:53.327528+00	2025-10-19 00:41:53.327528+00	0	\N	\N
23a72fa8-0b97-4fb4-a5fa-7d8e37d79695	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	1760239951334-egm-download-template.csv	5.00	completed	[]	\N	2025-10-12 03:32:31.957268+00	2025-10-19 03:32:31.957268+00	0	\N	\N
9854f2da-cbc4-4cfd-9602-749eb15a69a4	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	1760241447419-egm-download-template.csv	2.00	completed	["egm_bill_tracking_report_8697444b-a014-4b65-86df-636c1c231675.pdf", "pdfs/301_C_1340868_2023.pdf", "pdfs/301_C_1340867_2023.pdf"]	/api/download/job/8697444b-a014-4b65-86df-636c1c231675/egm_bill_tracking_report_8697444b-a014-4b65-86df-636c1c231675.pdf	2025-10-12 03:58:46.532866+00	2025-10-19 03:58:46.532866+00	2	\N	\N
9a3eabdb-470e-4f2b-831f-50b6cd9f3039	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	1760244133781-egm-download-template.csv	2.00	completed	[]	\N	2025-10-12 04:44:25.459717+00	2025-10-19 04:44:25.459717+00	0	\N	\N
f567e71a-b0a0-49b4-951a-cd3ab7b7311d	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	1760244989148-egm-download-template.csv	2.00	completed	[]	\N	2025-10-12 04:58:19.57208+00	2025-10-19 04:58:19.57208+00	0	\N	\N
064efa46-5c04-4a59-8c98-840315d49653	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	1760245295537-egm-download-template.csv	2.00	completed	[]	\N	2025-10-12 05:04:10.858692+00	2025-10-19 05:04:10.858692+00	0	\N	\N
b8f9cc04-9f7d-448c-9dca-117d9dd0818a	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	1760245505536-egm-download-template.csv	2.00	completed	[]	\N	2025-10-12 05:07:17.395519+00	2025-10-19 05:07:17.395519+00	0	\N	\N
613ff9c0-fa36-4ca3-bad5-81a7aabfa903	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	1760258146944-egm-download-template.csv	2.00	completed	[]	\N	2025-10-12 08:37:56.272825+00	2025-10-19 08:37:56.272825+00	0	\N	\N
a24d8c5c-23e9-4f48-9e36-e1d73e52891b	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	1760260733212-egm-download-template.csv	2.00	completed	["egm_bill_tracking_ea2ef712-7b40-4c6d-9e84-7d45df00e8fd.pdf", "pdfs/301_C_1340868_2023.pdf", "pdfs/301_C_1340867_2023.pdf"]	/api/download/job/ea2ef712-7b40-4c6d-9e84-7d45df00e8fd/egm_bill_tracking_ea2ef712-7b40-4c6d-9e84-7d45df00e8fd.pdf	2025-10-12 09:19:50.394728+00	2025-10-19 09:19:50.394728+00	2	\N	\N
2e4b5169-dbb9-44f7-9c1a-43c03eeb8942	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	1760262251706-egm-download-template.csv	2.00	completed	[]	\N	2025-10-12 09:44:11.760481+00	2025-10-19 09:44:11.760481+00	0	\N	\N
18a40d08-66ab-406e-85af-9449f3b941fe	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	egm-download	EGM Download (Bill Tracking)	1760262537265-egm-download-template.csv	2.00	completed	[]	\N	2025-10-12 09:48:57.325032+00	2025-10-19 09:48:57.325032+00	0	\N	\N
4f096a3d-37c8-48b3-9ce6-59c4a883be31	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	damco-tracking-maersk	Damco (APM) Tracking	1760265071684-fcr_numbers.csv	2.20	completed	["damco_tracking_report_20251012_103232.pdf", "pdfs/002_CTG2358538_tracking.pdf", "pdfs/001_CTG2358534_tracking.pdf"]	/api/download/job/9aed8c34-73bf-40b6-8043-2dbb65eaaa2a/damco_tracking_report_20251012_103232.pdf	2025-10-12 10:32:33.067495+00	2025-10-19 10:32:33.067495+00	2	\N	\N
d76638a8-e538-4e8e-bd9a-5cdb6ba5722c	52cd7f19-58f1-4667-b0e4-cd3e5c885b54	ctg-port-tracking	CTG Port Authority Tracking	1760265351412-ctg-port-tracking-template.csv	2.00	completed	["ctg_port_tracking_report_20251012_103625.pdf", "pdfs/002_TCLU9876543_tracking.pdf", "pdfs/001_MAEU1234567_tracking.pdf"]	/api/download/job/225fd4df-0ced-4523-a1ea-de8c0d84cfd6/ctg_port_tracking_report_20251012_103625.pdf	2025-10-12 10:36:25.465849+00	2025-10-19 10:36:25.465849+00	2	\N	\N
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
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: spf_user
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


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
-- Name: idx_contact_messages_email; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_contact_messages_email ON public.contact_messages USING btree (email);


--
-- Name: idx_contact_messages_status; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_contact_messages_status ON public.contact_messages USING btree (status);


--
-- Name: idx_contact_messages_submitted_at; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_contact_messages_submitted_at ON public.contact_messages USING btree (submitted_at DESC);


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
-- Name: idx_users_password_reset_token; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_users_password_reset_token ON public.users USING btree (password_reset_token);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: idx_users_verification_token; Type: INDEX; Schema: public; Owner: spf_user
--

CREATE INDEX idx_users_verification_token ON public.users USING btree (verification_token);


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

\unrestrict OvqoIGtVDOUuLKkzfjHXUxLCAxV5PPemifzmjFyMNZjeY6ioybOCAiDZ31DcOoB

