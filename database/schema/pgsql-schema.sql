--
-- PostgreSQL database dump
--

\restrict vCOBZ02ulNdun2lXr9uk3FWkpjUUDIL0ZcasGFQkF04Bc7rDM0RcVSmRciktcv3

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    log_id bigint NOT NULL,
    user_id bigint,
    action_type character varying(30) NOT NULL,
    description text NOT NULL,
    reference_id integer,
    ip_address character varying(45),
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_log_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_log_log_id_seq OWNED BY public.audit_log.log_id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration bigint NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    message_id bigint NOT NULL,
    user_id bigint NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    contact_number character varying(20),
    inquiry_type character varying(50) NOT NULL,
    subject character varying(200) NOT NULL,
    message text NOT NULL,
    attachment_path character varying(500),
    submitted_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: contact_messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_messages_message_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contact_messages_message_id_seq OWNED BY public.contact_messages.message_id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection character varying(255) NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: medicines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicines (
    medicine_id bigint NOT NULL,
    generic_name character varying(100) NOT NULL,
    brand_name character varying(100) NOT NULL,
    category character varying(50) NOT NULL,
    dosage character varying(50) NOT NULL,
    price numeric(10,2) NOT NULL,
    current_stock integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type character varying(50) DEFAULT 'Tablet'::character varying NOT NULL,
    cost_price numeric(10,2) DEFAULT '0'::numeric NOT NULL
);


--
-- Name: medicines_medicine_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.medicines_medicine_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: medicines_medicine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.medicines_medicine_id_seq OWNED BY public.medicines.medicine_id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


--
-- Name: stock_in; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_in (
    stock_in_id bigint NOT NULL,
    medicine_id bigint NOT NULL,
    quantity integer NOT NULL,
    batch_no character varying(50) NOT NULL,
    expiry_date date NOT NULL,
    supplier character varying(100),
    received_by bigint,
    delivery_date date,
    invoice_no character varying(50),
    recorded_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cost_price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    selling_price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    remaining_quantity integer DEFAULT 0 NOT NULL,
    supplier_id bigint,
    CONSTRAINT stock_in_cost_price_check CHECK ((cost_price >= (0)::numeric)),
    CONSTRAINT stock_in_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT stock_in_selling_price_check CHECK ((selling_price >= (0)::numeric))
);


--
-- Name: stock_in_stock_in_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_in_stock_in_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_in_stock_in_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_in_stock_in_id_seq OWNED BY public.stock_in.stock_in_id;


--
-- Name: stock_out; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_out (
    stock_out_id bigint NOT NULL,
    medicine_id bigint NOT NULL,
    quantity integer NOT NULL,
    dosage character varying(50),
    patient_name character varying(100) NOT NULL,
    prescription_no character varying(50) NOT NULL,
    dispensed_by bigint NOT NULL,
    dispensed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    stock_in_id bigint,
    total_amount numeric(10,2) GENERATED ALWAYS AS (((quantity)::numeric * price)) STORED,
    CONSTRAINT stock_out_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT stock_out_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT stock_out_total_check CHECK ((total_amount >= (0)::numeric))
);


--
-- Name: stock_out_stock_out_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_out_stock_out_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_out_stock_out_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_out_stock_out_id_seq OWNED BY public.stock_out.stock_out_id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    supplier_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    contact_person character varying(100),
    phone character varying(30),
    email character varying(100),
    address character varying(255),
    status character varying(10) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: suppliers_supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_supplier_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_supplier_id_seq OWNED BY public.suppliers.supplier_id;


--
-- Name: system_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_notifications (
    notification_id bigint NOT NULL,
    user_id bigint NOT NULL,
    type character varying(30) NOT NULL,
    title character varying(150) NOT NULL,
    message text NOT NULL,
    link character varying(255),
    dedupe_key character varying(100) NOT NULL,
    read_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: system_notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_notifications_notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_notifications_notification_id_seq OWNED BY public.system_notifications.notification_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id bigint NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(255) DEFAULT 'assistant'::character varying NOT NULL,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    profile_image character varying(255),
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: audit_log log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.audit_log_log_id_seq'::regclass);


--
-- Name: contact_messages message_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN message_id SET DEFAULT nextval('public.contact_messages_message_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: medicines medicine_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines ALTER COLUMN medicine_id SET DEFAULT nextval('public.medicines_medicine_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: stock_in stock_in_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_in ALTER COLUMN stock_in_id SET DEFAULT nextval('public.stock_in_stock_in_id_seq'::regclass);


--
-- Name: stock_out stock_out_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_out ALTER COLUMN stock_out_id SET DEFAULT nextval('public.stock_out_stock_out_id_seq'::regclass);


--
-- Name: suppliers supplier_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN supplier_id SET DEFAULT nextval('public.suppliers_supplier_id_seq'::regclass);


--
-- Name: system_notifications notification_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.system_notifications_notification_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (log_id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (message_id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: medicines medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_pkey PRIMARY KEY (medicine_id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: stock_in stock_in_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_in
    ADD CONSTRAINT stock_in_pkey PRIMARY KEY (stock_in_id);


--
-- Name: stock_out stock_out_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_out
    ADD CONSTRAINT stock_out_pkey PRIMARY KEY (stock_out_id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (supplier_id);


--
-- Name: system_notifications system_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_notifications
    ADD CONSTRAINT system_notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: system_notifications system_notifications_user_id_dedupe_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_notifications
    ADD CONSTRAINT system_notifications_user_id_dedupe_key_unique UNIQUE (user_id, dedupe_key);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: failed_jobs_connection_queue_failed_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX failed_jobs_connection_queue_failed_at_index ON public.failed_jobs USING btree (connection, queue, failed_at);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: suppliers_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suppliers_name_index ON public.suppliers USING btree (name);


--
-- Name: suppliers_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suppliers_status_index ON public.suppliers USING btree (status);


--
-- Name: system_notifications_user_id_read_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX system_notifications_user_id_read_at_index ON public.system_notifications USING btree (user_id, read_at);


--
-- Name: audit_log audit_log_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: contact_messages contact_messages_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: stock_in stock_in_medicine_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_in
    ADD CONSTRAINT stock_in_medicine_id_foreign FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id) ON DELETE CASCADE;


--
-- Name: stock_in stock_in_received_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_in
    ADD CONSTRAINT stock_in_received_by_foreign FOREIGN KEY (received_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: stock_in stock_in_supplier_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_in
    ADD CONSTRAINT stock_in_supplier_id_foreign FOREIGN KEY (supplier_id) REFERENCES public.suppliers(supplier_id) ON DELETE SET NULL;


--
-- Name: stock_out stock_out_dispensed_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_out
    ADD CONSTRAINT stock_out_dispensed_by_foreign FOREIGN KEY (dispensed_by) REFERENCES public.users(user_id);


--
-- Name: stock_out stock_out_medicine_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_out
    ADD CONSTRAINT stock_out_medicine_id_foreign FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id) ON DELETE CASCADE;


--
-- Name: stock_out stock_out_stock_in_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_out
    ADD CONSTRAINT stock_out_stock_in_id_foreign FOREIGN KEY (stock_in_id) REFERENCES public.stock_in(stock_in_id);


--
-- Name: system_notifications system_notifications_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_notifications
    ADD CONSTRAINT system_notifications_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict vCOBZ02ulNdun2lXr9uk3FWkpjUUDIL0ZcasGFQkF04Bc7rDM0RcVSmRciktcv3

--
-- PostgreSQL database dump
--

\restrict vY4f2DfxorfBou2KJdgegJzu4VVebuBQL60myRpZF2x7lJibvHnKlY7PtO7Ghwx

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000001_create_cache_table	1
2	0001_01_01_000002_create_jobs_table	1
3	2026_01_01_000001_create_users_table	1
4	2026_01_01_000002_create_medicines_table	1
5	2026_01_01_000003_create_stock_in_table	1
6	2026_01_01_000004_create_stock_out_table	1
7	2026_01_01_000005_create_contact_messages_table	1
8	2026_01_01_000006_create_audit_log_table	1
9	2026_08_28_192548_create_sessions_table	1
10	2026_08_29_050830_add_missing_columns_to_users_table	1
11	2026_09_01_000001_create_system_notifications_table	1
12	2026_10_15_074745_create_suppliers_table	1
13	2026_10_15_074748_add_supplier_id_to_stock_in_table	1
14	2026_10_18_000001_create_password_reset_tokens_table	1
15	2026_10_18_162823_add_cost_price_to_medicines_table	1
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 15, true);


--
-- PostgreSQL database dump complete
--

\unrestrict vY4f2DfxorfBou2KJdgegJzu4VVebuBQL60myRpZF2x7lJibvHnKlY7PtO7Ghwx

