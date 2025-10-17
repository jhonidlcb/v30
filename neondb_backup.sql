--
-- PostgreSQL database dump
--

\restrict W6NfRJlp5w6Zgqpl2CgWcNoPKUXdw3kXiagfjs3QaCiYyRsvCfkBnOWdztQloIy

-- Dumped from database version 17.5 (6bc9ef8)
-- Dumped by pg_dump version 18.0 (Ubuntu 18.0-1.pgdg24.04+3)

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
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: neondb_owner
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: neondb_owner
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: neondb_owner
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: budget_negotiations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.budget_negotiations (
    id integer NOT NULL,
    project_id integer NOT NULL,
    proposed_by integer NOT NULL,
    original_price numeric(12,2) NOT NULL,
    proposed_price numeric(12,2) NOT NULL,
    message text,
    status character varying(50) DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    responded_at timestamp without time zone
);


ALTER TABLE public.budget_negotiations OWNER TO neondb_owner;

--
-- Name: budget_negotiations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.budget_negotiations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budget_negotiations_id_seq OWNER TO neondb_owner;

--
-- Name: budget_negotiations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.budget_negotiations_id_seq OWNED BY public.budget_negotiations.id;


--
-- Name: client_billing_info; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_billing_info (
    id integer NOT NULL,
    user_id integer NOT NULL,
    legal_name character varying(255) NOT NULL,
    document_type character varying(50) DEFAULT 'CI'::character varying NOT NULL,
    document_number character varying(50) NOT NULL,
    address text,
    city character varying(100),
    country character varying(100) DEFAULT 'Paraguay'::character varying,
    phone character varying(20),
    is_default boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    client_type character varying(50) DEFAULT 'persona_fisica'::character varying NOT NULL,
    department character varying(100),
    email character varying(255),
    observations text
);


ALTER TABLE public.client_billing_info OWNER TO neondb_owner;

--
-- Name: COLUMN client_billing_info.client_type; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.client_billing_info.client_type IS 'Tipo de cliente: persona_fisica, empresa, consumidor_final, extranjero';


--
-- Name: COLUMN client_billing_info.department; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.client_billing_info.department IS 'Departamento del Paraguay: Itapúa, Central, Alto Paraná, etc.';


--
-- Name: COLUMN client_billing_info.email; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.client_billing_info.email IS 'Email obligatorio para envío de facturas en PDF';


--
-- Name: COLUMN client_billing_info.observations; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.client_billing_info.observations IS 'Observaciones adicionales: Sucursal Central, Proyecto Web, etc.';


--
-- Name: client_billing_info_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.client_billing_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_billing_info_id_seq OWNER TO neondb_owner;

--
-- Name: client_billing_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.client_billing_info_id_seq OWNED BY public.client_billing_info.id;


--
-- Name: company_billing_info; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.company_billing_info (
    id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    ruc character varying(20) NOT NULL,
    address text NOT NULL,
    city character varying(100) NOT NULL,
    country character varying(100) DEFAULT 'Paraguay'::character varying,
    phone character varying(20),
    email character varying(255),
    website character varying(255),
    tax_regime character varying(100),
    economic_activity character varying(255),
    logo_url text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    timbrado_number character varying(20),
    vigencia_timbrado character varying(20),
    vencimiento_timbrado character varying(20),
    boleta_prefix character varying(20) DEFAULT '001-001'::character varying,
    boleta_sequence integer DEFAULT 1,
    titular_name character varying(255),
    department character varying(100) DEFAULT 'Itapúa'::character varying
);


ALTER TABLE public.company_billing_info OWNER TO neondb_owner;

--
-- Name: COLUMN company_billing_info.titular_name; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.company_billing_info.titular_name IS 'Nombre completo del titular de la empresa (persona física)';


--
-- Name: COLUMN company_billing_info.department; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.company_billing_info.department IS 'Departamento del Paraguay: Itapúa, Central, Alto Paraná, etc.';


--
-- Name: company_billing_info_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.company_billing_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_billing_info_id_seq OWNER TO neondb_owner;

--
-- Name: company_billing_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.company_billing_info_id_seq OWNED BY public.company_billing_info.id;


--
-- Name: exchange_rate_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.exchange_rate_config (
    id integer NOT NULL,
    usd_to_guarani numeric(10,2) NOT NULL,
    updated_by integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.exchange_rate_config OWNER TO neondb_owner;

--
-- Name: exchange_rate_config_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.exchange_rate_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exchange_rate_config_id_seq OWNER TO neondb_owner;

--
-- Name: exchange_rate_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.exchange_rate_config_id_seq OWNED BY public.exchange_rate_config.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_number character varying(100) NOT NULL,
    project_id integer NOT NULL,
    client_id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    due_date timestamp without time zone NOT NULL,
    paid_date timestamp without time zone,
    description text,
    tax_amount numeric(12,2) DEFAULT 0.00,
    discount_amount numeric(12,2) DEFAULT 0.00,
    total_amount numeric(12,2) NOT NULL,
    payment_method_id integer,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    currency character varying(3) DEFAULT 'PYG'::character varying NOT NULL,
    payment_stage_id integer,
    exchange_rate_used numeric(10,2),
    sifen_cdc character varying(44),
    sifen_protocolo character varying(50),
    sifen_estado character varying(20),
    sifen_xml text,
    sifen_fecha_envio timestamp without time zone,
    sifen_mensaje_error text,
    sifen_qr character varying(1000)
);


ALTER TABLE public.invoices OWNER TO neondb_owner;

--
-- Name: COLUMN invoices.exchange_rate_used; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.invoices.exchange_rate_used IS 'Tipo de cambio USD a PYG usado al momento de generar la factura. Este valor queda fijo y no cambia aunque el tipo de cambio se actualice después.';


--
-- Name: COLUMN invoices.sifen_cdc; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.invoices.sifen_cdc IS 'Código de Control SIFEN de 44 dígitos';


--
-- Name: COLUMN invoices.sifen_protocolo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.invoices.sifen_protocolo IS 'Protocolo de autorización devuelto por SIFEN';


--
-- Name: COLUMN invoices.sifen_estado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.invoices.sifen_estado IS 'Estado de la factura en SIFEN: aceptado, rechazado, pendiente';


--
-- Name: COLUMN invoices.sifen_xml; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.invoices.sifen_xml IS 'XML completo enviado a SIFEN';


--
-- Name: COLUMN invoices.sifen_fecha_envio; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.invoices.sifen_fecha_envio IS 'Fecha y hora de envío a SIFEN';


--
-- Name: COLUMN invoices.sifen_mensaje_error; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.invoices.sifen_mensaje_error IS 'Mensaje de error si la factura fue rechazada por SIFEN';


--
-- Name: COLUMN invoices.sifen_qr; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.invoices.sifen_qr IS 'URL del código QR para verificación en e-Kuatia SET';


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) DEFAULT 'info'::character varying NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: partners; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.partners (
    id integer NOT NULL,
    user_id integer NOT NULL,
    referral_code character varying(50) NOT NULL,
    commission_rate numeric(5,2) DEFAULT 25.00 NOT NULL,
    total_earnings numeric(12,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.partners OWNER TO neondb_owner;

--
-- Name: partners_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.partners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.partners_id_seq OWNER TO neondb_owner;

--
-- Name: partners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.partners_id_seq OWNED BY public.partners.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.password_reset_tokens OWNER TO neondb_owner;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_id_seq OWNER TO neondb_owner;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payment_methods (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(50) NOT NULL,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    details jsonb NOT NULL
);


ALTER TABLE public.payment_methods OWNER TO neondb_owner;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payment_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_methods_id_seq OWNER TO neondb_owner;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- Name: payment_stages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payment_stages (
    id integer NOT NULL,
    project_id integer NOT NULL,
    stage_name text NOT NULL,
    stage_percentage integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    required_progress integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::character varying NOT NULL,
    payment_link text,
    paid_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    payment_method character varying(50),
    payment_data jsonb,
    proof_file_url text,
    exchange_rate_used numeric(10,2)
);


ALTER TABLE public.payment_stages OWNER TO neondb_owner;

--
-- Name: COLUMN payment_stages.exchange_rate_used; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.payment_stages.exchange_rate_used IS 'Tipo de cambio USD a PYG usado al momento del pago. Este valor queda fijo y no cambia aunque el tipo de cambio se actualice después.';


--
-- Name: payment_stages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payment_stages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_stages_id_seq OWNER TO neondb_owner;

--
-- Name: payment_stages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payment_stages_id_seq OWNED BY public.payment_stages.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    project_id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    payment_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    stage character varying(50) DEFAULT 'full'::character varying,
    stage_percentage numeric(5,2) DEFAULT 100.00,
    payment_method character varying(100),
    transaction_id character varying(255)
);


ALTER TABLE public.payments OWNER TO neondb_owner;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO neondb_owner;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: portfolio; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.portfolio (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    category character varying(100) NOT NULL,
    technologies text NOT NULL,
    image_url text NOT NULL,
    demo_url text,
    completed_at timestamp without time zone NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.portfolio OWNER TO neondb_owner;

--
-- Name: portfolio_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.portfolio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.portfolio_id_seq OWNER TO neondb_owner;

--
-- Name: portfolio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.portfolio_id_seq OWNED BY public.portfolio.id;


--
-- Name: project_files; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_files (
    id integer NOT NULL,
    project_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_url text NOT NULL,
    file_type character varying(100),
    uploaded_by integer NOT NULL,
    file_size integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.project_files OWNER TO neondb_owner;

--
-- Name: project_files_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_files_id_seq OWNER TO neondb_owner;

--
-- Name: project_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_files_id_seq OWNED BY public.project_files.id;


--
-- Name: project_messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_messages (
    id integer NOT NULL,
    project_id integer NOT NULL,
    user_id integer NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.project_messages OWNER TO neondb_owner;

--
-- Name: project_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_messages_id_seq OWNER TO neondb_owner;

--
-- Name: project_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_messages_id_seq OWNED BY public.project_messages.id;


--
-- Name: project_timeline; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_timeline (
    id integer NOT NULL,
    project_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'pending'::character varying,
    estimated_date timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.project_timeline OWNER TO neondb_owner;

--
-- Name: project_timeline_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_timeline_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_timeline_id_seq OWNER TO neondb_owner;

--
-- Name: project_timeline_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_timeline_id_seq OWNED BY public.project_timeline.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    price numeric(12,2) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    client_id integer NOT NULL,
    partner_id integer,
    delivery_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    start_date timestamp without time zone
);


ALTER TABLE public.projects OWNER TO neondb_owner;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO neondb_owner;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.referrals (
    id integer NOT NULL,
    partner_id integer NOT NULL,
    client_id integer NOT NULL,
    project_id integer,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    commission_amount numeric(12,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.referrals OWNER TO neondb_owner;

--
-- Name: referrals_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.referrals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referrals_id_seq OWNER TO neondb_owner;

--
-- Name: referrals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.referrals_id_seq OWNED BY public.referrals.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: ticket_responses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ticket_responses (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    user_id integer NOT NULL,
    message text NOT NULL,
    is_from_support boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ticket_responses OWNER TO neondb_owner;

--
-- Name: ticket_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ticket_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_responses_id_seq OWNER TO neondb_owner;

--
-- Name: ticket_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ticket_responses_id_seq OWNED BY public.ticket_responses.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    status character varying(50) DEFAULT 'open'::character varying NOT NULL,
    priority character varying(50) DEFAULT 'medium'::character varying NOT NULL,
    user_id integer NOT NULL,
    project_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tickets OWNER TO neondb_owner;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_id_seq OWNER TO neondb_owner;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    payment_method_id integer NOT NULL,
    user_id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    transaction_id character varying(255),
    payment_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);


ALTER TABLE public.transactions OWNER TO neondb_owner;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO neondb_owner;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'client'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: work_modalities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.work_modalities (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    subtitle character varying(255),
    badge_text character varying(100),
    badge_variant character varying(50) DEFAULT 'secondary'::character varying,
    description text NOT NULL,
    price_text character varying(255) NOT NULL,
    price_subtitle character varying(255),
    features jsonb NOT NULL,
    button_text character varying(255) DEFAULT 'Solicitar Cotización'::character varying NOT NULL,
    button_variant character varying(50) DEFAULT 'default'::character varying,
    is_popular boolean DEFAULT false,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.work_modalities OWNER TO neondb_owner;

--
-- Name: work_modalities_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.work_modalities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_modalities_id_seq OWNER TO neondb_owner;

--
-- Name: work_modalities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.work_modalities_id_seq OWNED BY public.work_modalities.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: budget_negotiations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.budget_negotiations ALTER COLUMN id SET DEFAULT nextval('public.budget_negotiations_id_seq'::regclass);


--
-- Name: client_billing_info id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_billing_info ALTER COLUMN id SET DEFAULT nextval('public.client_billing_info_id_seq'::regclass);


--
-- Name: company_billing_info id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_billing_info ALTER COLUMN id SET DEFAULT nextval('public.company_billing_info_id_seq'::regclass);


--
-- Name: exchange_rate_config id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.exchange_rate_config ALTER COLUMN id SET DEFAULT nextval('public.exchange_rate_config_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: partners id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partners ALTER COLUMN id SET DEFAULT nextval('public.partners_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- Name: payment_stages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_stages ALTER COLUMN id SET DEFAULT nextval('public.payment_stages_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: portfolio id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.portfolio ALTER COLUMN id SET DEFAULT nextval('public.portfolio_id_seq'::regclass);


--
-- Name: project_files id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_files ALTER COLUMN id SET DEFAULT nextval('public.project_files_id_seq'::regclass);


--
-- Name: project_messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_messages ALTER COLUMN id SET DEFAULT nextval('public.project_messages_id_seq'::regclass);


--
-- Name: project_timeline id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_timeline ALTER COLUMN id SET DEFAULT nextval('public.project_timeline_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: referrals id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referrals ALTER COLUMN id SET DEFAULT nextval('public.referrals_id_seq'::regclass);


--
-- Name: ticket_responses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ticket_responses ALTER COLUMN id SET DEFAULT nextval('public.ticket_responses_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: work_modalities id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.work_modalities ALTER COLUMN id SET DEFAULT nextval('public.work_modalities_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: neondb_owner
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
\.


--
-- Data for Name: budget_negotiations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.budget_negotiations (id, project_id, proposed_by, original_price, proposed_price, message, status, created_at, responded_at) FROM stdin;
\.


--
-- Data for Name: client_billing_info; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_billing_info (id, user_id, legal_name, document_type, document_number, address, city, country, phone, is_default, created_at, updated_at, client_type, department, email, observations) FROM stdin;
1	2	Jacinto Ortiz	CI	000002626	Barrio Residencial – Carlos A. López – Itapúa – Paraguay  	Ciudad del Este	Paraguay	+595985990044	t	2025-09-30 03:19:11.00619	2025-10-16 22:42:54.645	consumidor_final	Itapúa	alfagroupstoreok@gmail.com	
\.


--
-- Data for Name: company_billing_info; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.company_billing_info (id, company_name, ruc, address, city, country, phone, email, website, tax_regime, economic_activity, logo_url, is_active, created_at, updated_at, timbrado_number, vigencia_timbrado, vencimiento_timbrado, boleta_prefix, boleta_sequence, titular_name, department) FROM stdin;
3	SoftwarePar S.R.L.	80001234-5	Barrio Residencial	Carlos Antonio López	Paraguay	+595 985 990 046	softwarepar.lat@gmail.com	https://softwarepar.lat	Pequeño Contribuyente - RESIMPLE	Desarrollo de software y servicios informáticos		f	2025-09-30 02:58:46.531403	2025-10-16 22:57:14.11	15378596	01/10/2025	30/09/2027	001-001	1	Jhoni Fabián Benítez De La Cruz	Itapúa
2	SoftwarePar	4220058-0	Barrio Residencial	Carlos Antonio López	Paraguay	+595 985 990 046	softwarepar.lat@gmail.com	https://softwarepar.lat	Pequeño Contribuyente - RESIMPLE	Desarrollo de software y servicios informáticos		f	2025-09-30 02:58:37.188036	2025-10-16 22:57:14.11	7777777	01/10/2025	30/09/2027	001-001	1	Jhoni Fabián Benítez De La Cruz	Itapúa
1	SoftwarePar	4220058-0	Barrio Residencial – Carlos A. López – Itapúa – Paraguay 	Carlos Antonio López	Paraguay	+595 985 990 046	softwarepar.lat@gmail.com	https://softwarepar.lat	Pequeño Contribuyente - RESIMPLE	Desarrollo de software y servicios informáticos		t	2025-09-30 02:51:18.953684	2025-10-16 22:57:14.561	151515151	01/10/2025	30/09/2027	001-001	3	Jhoni Fabián Benítez De La Cruz	Itapúa
\.


--
-- Data for Name: exchange_rate_config; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.exchange_rate_config (id, usd_to_guarani, updated_by, is_active, created_at, updated_at) FROM stdin;
1	7300.00	1	f	2025-09-30 15:52:54.875118	2025-10-16 23:28:08.192
2	7200.00	1	f	2025-09-30 15:53:34.668394	2025-10-16 23:28:08.192
3	7300.00	1	f	2025-10-01 00:51:06.648818	2025-10-16 23:28:08.192
4	7.06	1	f	2025-10-11 22:40:02.85167	2025-10-16 23:28:08.192
5	7.06	1	f	2025-10-11 22:41:08.5435	2025-10-16 23:28:08.192
6	7.06	1	f	2025-10-11 22:41:25.8804	2025-10-16 23:28:08.192
7	7.06	1	f	2025-10-11 22:41:38.616533	2025-10-16 23:28:08.192
8	7060.00	1	f	2025-10-11 22:41:46.744348	2025-10-16 23:28:08.192
9	7300.00	1	f	2025-10-11 22:52:06.802565	2025-10-16 23:28:08.192
10	7060.00	1	f	2025-10-11 22:56:29.278781	2025-10-16 23:28:08.192
11	7300.00	1	f	2025-10-11 23:20:17.365582	2025-10-16 23:28:08.192
12	7100.00	1	t	2025-10-16 23:28:08.713638	2025-10-16 23:28:08.713638
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoices (id, invoice_number, project_id, client_id, amount, status, due_date, paid_date, description, tax_amount, discount_amount, total_amount, payment_method_id, notes, created_at, updated_at, currency, payment_stage_id, exchange_rate_used, sifen_cdc, sifen_protocolo, sifen_estado, sifen_xml, sifen_fecha_envio, sifen_mensaje_error, sifen_qr) FROM stdin;
51	001-001-0000001	28	2	250.00	paid	2025-10-16 22:34:01.618	2025-10-16 22:34:01.618	\N	0.00	0.00	250.00	\N	\N	2025-10-16 22:34:01.690724	2025-10-16 22:34:03.62	USD	85	7300.00	01042200580001001000000112025101610654043009	FS-14-OK	aceptado	<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<rDE xmlns="http://ekuatia.set.gov.py/sifen/xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://ekuatia.set.gov.py/sifen/xsd siRecepDE_v150.xsd">\n  <dVerFor>150</dVerFor>\n  <DE Id="01042200580001001000000112025101610654043009">\n    <dDVId>9</dDVId>\n    <dFecFirma>2025-10-16T19:34:03</dFecFirma>\n    <dSisFact>1</dSisFact>\n    <gOpeDE>\n      <iTipEmi>1</iTipEmi>\n      <dDesTipEmi>Normal</dDesTipEmi>\n      <dCodSeg>065404300</dCodSeg>\n      <dInfoEmi>Tipo de cambio: 1 USD = 7.300 PYG. Monto original: USD 250.00</dInfoEmi>\n    </gOpeDE>\n    <gTimb>\n      <iTiDE>1</iTiDE>\n      <dDesTiDE>Factura electrónica</dDesTiDE>\n      <dNumTim>04220058</dNumTim>\n      <dEst>001</dEst>\n      <dPunExp>001</dPunExp>\n      <dNumDoc>0000001</dNumDoc>\n      <dFeIniT>2025-10-13</dFeIniT>\n    </gTimb>\n    <gDatGralOpe>\n      <dFeEmiDE>2025-10-16T22:34:02</dFeEmiDE>\n      <gOpeCom>\n        <iTipTra>2</iTipTra>\n        <dDesTipTra>Prestación de servicios</dDesTipTra>\n        <iTImp>1</iTImp>\n        <dDesTImp>IVA</dDesTImp>\n        <cMoneOpe>PYG</cMoneOpe>\n        <dDesMoneOpe>Guarani</dDesMoneOpe>\n      </gOpeCom>\n      <gEmis>\n        <dRucEm>4220058</dRucEm>\n        <dDVEmi>0</dDVEmi>\n        <iTipCont>1</iTipCont>\n        <cTipReg>6</cTipReg>\n        <dNomEmi>DE generado en ambiente de prueba - sin valor comercial ni fiscal</dNomEmi>\n        <dNomFanEmi>SoftwarePar</dNomFanEmi>\n        <dDirEmi>Barrio Residencial – a tres cuadras de la Municipalidad</dDirEmi>\n        <dNumCas>0</dNumCas>\n        <cDepEmi>8</cDepEmi>\n        <dDesDepEmi>ITAPUA</dDesDepEmi>\n        <cDisEmi>107</cDisEmi>\n        <dDesDisEmi>CARLOS A. LOPEZ</dDesDisEmi>\n        <cCiuEmi>1456</cCiuEmi>\n        <dDesCiuEmi>CARLOS A. LOPEZ</dDesCiuEmi>\n        <dTelEmi>+595985990046</dTelEmi>\n        <dEmailE>softwarepar.lat@gmail.com</dEmailE>\n        <dDenSuc>Matriz</dDenSuc>\n        <gActEco>\n          <cActEco>62090</cActEco>\n          <dDesActEco> OTRAS ACTIVIDADES DE TECNOLOGÍA DE LA INFORMACIÓN Y SERVICIOS INFORMÁTICOS</dDesActEco>\n        </gActEco>\n        <gRespDE>\n          <iTipIDRespDE>1</iTipIDRespDE>\n          <dDTipIDRespDE>Cédula paraguaya</dDTipIDRespDE>\n          <dNumIDRespDE>12345678</dNumIDRespDE>\n          <dNomRespDE>SoftwarePar Admin</dNomRespDE>\n          <dCarRespDE>Administrador</dCarRespDE>\n        </gRespDE>\n      </gEmis>\n      <gDatRec>\n        <iNatRec>2</iNatRec>\n        <iTiOpe>2</iTiOpe>\n        <cPaisRec>PRY</cPaisRec>\n        <dDesPaisRe>Paraguay</dDesPaisRe>\n        <iTipIDRec>1</iTipIDRec>\n        <dDTipIDRec>Cédula paraguaya</dDTipIDRec>\n        <dNumIDRec>000002626</dNumIDRec>\n        <dNomRec>Jacinto Ortiz</dNomRec>\n        <dDirRec>Barrio Residencial</dDirRec>\n        <dNumCasRec>0</dNumCasRec>\n        <cDepRec>1</cDepRec>\n        <dDesDepRec>CAPITAL</dDesDepRec>\n        <cDisRec>1</cDisRec>\n        <dDesDisRec>ASUNCION (DISTRITO)</dDesDisRec>\n        <cCiuRec>1</cCiuRec>\n        <dDesCiuRec>ASUNCION (DISTRITO)</dDesCiuRec>\n        <dTelRec>+595985990044</dTelRec>\n        <dCelRec>+595985990044</dCelRec>\n        <dEmailRec>alfagroupstoreok@gmail.com</dEmailRec>\n        <dCodCliente>002</dCodCliente>\n      </gDatRec>\n    </gDatGralOpe>\n    <gDtipDE>\n      <gCamFE>\n        <iIndPres>2</iIndPres>\n        <dDesIndPres>Operación electrónica</dDesIndPres>\n      </gCamFE>\n      <gCamCond>\n        <iCondOpe>1</iCondOpe>\n        <dDCondOpe>Contado</dDCondOpe>\n        <gPaConEIni>\n          <iTiPago>9</iTiPago>\n          <dDesTiPag>Vale</dDesTiPag>\n          <dMonTiPag>1825000.0000</dMonTiPag>\n          <cMoneTiPag>PYG</cMoneTiPag>\n          <dDMoneTiPag>Guarani</dDMoneTiPag>\n        </gPaConEIni>\n      </gCamCond>\n      <gCamItem>\n        <dCodInt/>\n        <dDesProSer>Anticipo - Inicio del Proyecto (Pago 1 de 4) - FrigoMgrande</dDesProSer>\n        <cUniMed>77</cUniMed>\n        <dDesUniMed>UNI</dDesUniMed>\n        <dCantProSer>1</dCantProSer>\n        <gValorItem>\n          <dPUniProSer>1825000</dPUniProSer>\n          <dTotBruOpeItem>1825000</dTotBruOpeItem>\n          <gValorRestaItem>\n            <dDescItem>0</dDescItem>\n            <dDescGloItem>0</dDescGloItem>\n            <dAntPreUniIt>0</dAntPreUniIt>\n            <dAntGloPreUniIt>0</dAntGloPreUniIt>\n            <dTotOpeItem>1825000</dTotOpeItem>\n          </gValorRestaItem>\n        </gValorItem>\n        <gCamIVA>\n          <iAfecIVA>3</iAfecIVA>\n          <dDesAfecIVA>Exento</dDesAfecIVA>\n          <dPropIVA>0</dPropIVA>\n          <dTasaIVA>0</dTasaIVA>\n          <dBasGravIVA>0</dBasGravIVA>\n          <dLiqIVAItem>0</dLiqIVAItem>\n          <dBasExe>0</dBasExe>\n        </gCamIVA>\n      </gCamItem>\n    </gDtipDE>\n    <gTotSub>\n      <dSubExe>1825000</dSubExe>\n      <dSubExo>0</dSubExo>\n      <dTotOpe>1825000</dTotOpe>\n      <dTotDesc>0</dTotDesc>\n      <dTotDescGlotem>0</dTotDescGlotem>\n      <dTotAntItem>0</dTotAntItem>\n      <dTotAnt>0</dTotAnt>\n      <dPorcDescTotal>0</dPorcDescTotal>\n      <dDescTotal>0</dDescTotal>\n      <dAnticipo>0</dAnticipo>\n      <dRedon>0</dRedon>\n      <dTotGralOpe>1825000</dTotGralOpe>\n    </gTotSub>\n  </DE>\n  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">\n    <SignedInfo>\n      <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>\n      <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>\n      <Reference URI="#01042200580001001000000112025101610654043009">\n        <Transforms>\n          <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>\n          <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>\n        </Transforms>\n        <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>\n        <DigestValue>g7lamuqhZszn/4LUuiL/2BCGkcS5iHnxRjMbb8f7lVU=</DigestValue>\n      </Reference>\n    </SignedInfo>\n    <SignatureValue>W2BNVnR7MXhskmCU+rnMGAZlyLUxc9bhBJ1SmHGAj+86ZyYHRubIFZNS5vsz5CLn/rSTolVA8Rks&#xD;\nstsfeQE0RTkGNDEXIYJyx/oZdybG4uzvqLhZ1UWFvoSmH5Y/eIVEHhppjLt73+baijzY9JcKcOjg&#xD;\nK2o8/L0RJCZ69h8LbShjdbFI9M1SA2InosQzNK8yBSo7scUJRTPzDnBWeLHmw4cH1A/HwMTZg4HE&#xD;\njPSUNfvIuZmu+52yz01uw8+qkGGROcPNCPK7s0Ec7JpT3BQg2HkGNUNEDaA62bYLrOcKLKyIcTdi&#xD;\nGhkzodhYNj929pAm06syCBrQx82dun8YA0aZpw==</SignatureValue>\n    <KeyInfo>\n      <X509Data>\n        <X509Certificate>MIIDbDCCAlSgAwIBAgIEYYrC+zANBgkqhkiG9w0BAQsFADB4MQswCQYDVQQGEwJQWTEUMBIGA1UE&#xD;\nCAwLQUxUTyBQQVJBTkExGDAWBgNVBAcMD0NJVURBRCBERUwgRVNURTEQMA4GA1UECgwHVElQUyBT&#xD;\nQTETMBEGA1UECwwKREVTQVJST0xMTzESMBAGA1UEAwwJRkFDVFVSQVBJMB4XDTIxMTEwOTE4NTAz&#xD;\nNVoXDTIyMTEwOTE4NTAzNVoweDELMAkGA1UEBhMCUFkxFDASBgNVBAgMC0FMVE8gUEFSQU5BMRgw&#xD;\nFgYDVQQHDA9DSVVEQUQgREVMIEVTVEUxEDAOBgNVBAoMB1RJUFMgU0ExEzARBgNVBAsMCkRFU0FS&#xD;\nUk9MTE8xEjAQBgNVBAMMCUZBQ1RVUkFQSTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB&#xD;\nAMWUwZD/I4iNtm2XVy0BGYBQJ0GGRRTzmdwSJGgCXMYPnLhPpQMMy6gdFsIpPW8fHCa1jhsVuRCp&#xD;\njLbGGuqpBCLIVOHJxWb2mppJIa8fsTJBdgOz84vvqBWWMGmfb3HYx/s59GmsQIMnJ1vMW3x6LOjV&#xD;\n1m5HiXcJqgOh6fGlfex7EJ8QhB7CHJj5cbrQVj5e3rh7J2uXEeY8QBAG8+zaMKgGNxMmuirzhRWg&#xD;\nn+z9QN6pDh0RYjBO/uikgTccLpQdxlnYkK3i/eaKNdhrWEjBM/zrpH9FH7JqJNZgsk4kpZAS5g9M&#xD;\nHbfjLGE4BmskFYwFmhljJEeRiiFjVElVFsvlCT8CAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAZMTd&#xD;\nURV42xA4kOApodsNP5psahbiO0T5674fXbZUYt/k4qLszScQvTTrtZkAmbs1UIHu06W4QNffrBOj&#xD;\nSwbMuNX096BEiQ1SKTdWBBM41qkb0r7TL3aYchfXjJvTsp4l2pnXF0hJ+hiDwBp0sa/qEi+TP7mp&#xD;\nB8BbDtr2IbwyQVqyEgdmNfF/Fz81lwQV/N94H/31Mx2OW7b9ULiHHi6IAxf2HIjVLZYHat3Y4Wm5&#xD;\nbLbsKDubW0DsWuWXh3L1myGIFJqGEvoP4cwz+o/su5cPaLewBIzsKFQoZVJygQN1zv0W2Ve73nln&#xD;\naIbxrFb8w/kXeZeYWeMYotIAZk9VhtheoQ==</X509Certificate>\n      </X509Data>\n    </KeyInfo>\n  </Signature>\n  <gCamFuFD>\n    <dCarQR>https://ekuatia.set.gov.py/consultas-test/qr?nVersion=150&amp;Id=01042200580001001000000112025101610654043009&amp;dFeEmiDE=323032352d31302d31365432323a33343a3032&amp;dNumIDRec=000002626&amp;dTotGralOpe=1825000&amp;dTotIVA=0&amp;cItems=1&amp;DigestValue=67376c616d7571685a737a6e2f344c5575694c2f324243476b63533569486e78526a4d62623866376c56553d&amp;IdCSC=1&amp;cHashQR=24897f14fd43254af2e369ef50f44cb3167b19aa66628d5279400fff01a22578</dCarQR>\n  </gCamFuFD>\n</rDE>	2025-10-16 22:34:03.62	Procesado correctamente	https://ekuatia.set.gov.py/consultas-test/qr?nVersion=150&Id=01042200580001001000000112025101610654043009&dFeEmiDE=323032352d31302d31365432323a33343a3032&dNumIDRec=000002626&dTotGralOpe=1825000&dTotIVA=0&cItems=1&DigestValue=67376c616d7571685a737a6e2f344c5575694c2f324243476b63533569486e78526a4d62623866376c56553d&IdCSC=1&cHashQR=24897f14fd43254af2e369ef50f44cb3167b19aa66628d5279400fff01a22578
52	001-001-0000002	28	2	250.00	paid	2025-10-16 23:30:49.396	2025-10-16 23:30:49.396	\N	0.00	0.00	250.00	\N	\N	2025-10-16 23:30:49.471722	2025-10-16 23:30:50.792	USD	86	7100.00	01042200580001001000000212025101610657450160	FS-15-OK	aceptado	<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<rDE xmlns="http://ekuatia.set.gov.py/sifen/xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://ekuatia.set.gov.py/sifen/xsd siRecepDE_v150.xsd">\n  <dVerFor>150</dVerFor>\n  <DE Id="01042200580001001000000212025101610657450160">\n    <dDVId>0</dDVId>\n    <dFecFirma>2025-10-16T20:30:50</dFecFirma>\n    <dSisFact>1</dSisFact>\n    <gOpeDE>\n      <iTipEmi>1</iTipEmi>\n      <dDesTipEmi>Normal</dDesTipEmi>\n      <dCodSeg>065745016</dCodSeg>\n      <dInfoEmi>Tipo de cambio: 1 USD = 7.100 PYG. Monto original: USD 250.00</dInfoEmi>\n    </gOpeDE>\n    <gTimb>\n      <iTiDE>1</iTiDE>\n      <dDesTiDE>Factura electrónica</dDesTiDE>\n      <dNumTim>04220058</dNumTim>\n      <dEst>001</dEst>\n      <dPunExp>001</dPunExp>\n      <dNumDoc>0000002</dNumDoc>\n      <dFeIniT>2025-10-13</dFeIniT>\n    </gTimb>\n    <gDatGralOpe>\n      <dFeEmiDE>2025-10-16T23:30:49</dFeEmiDE>\n      <gOpeCom>\n        <iTipTra>2</iTipTra>\n        <dDesTipTra>Prestación de servicios</dDesTipTra>\n        <iTImp>1</iTImp>\n        <dDesTImp>IVA</dDesTImp>\n        <cMoneOpe>PYG</cMoneOpe>\n        <dDesMoneOpe>Guarani</dDesMoneOpe>\n      </gOpeCom>\n      <gEmis>\n        <dRucEm>4220058</dRucEm>\n        <dDVEmi>0</dDVEmi>\n        <iTipCont>1</iTipCont>\n        <cTipReg>6</cTipReg>\n        <dNomEmi>DE generado en ambiente de prueba - sin valor comercial ni fiscal</dNomEmi>\n        <dNomFanEmi>SoftwarePar</dNomFanEmi>\n        <dDirEmi>Barrio Residencial – a tres cuadras de la Municipalidad</dDirEmi>\n        <dNumCas>0</dNumCas>\n        <cDepEmi>8</cDepEmi>\n        <dDesDepEmi>ITAPUA</dDesDepEmi>\n        <cDisEmi>107</cDisEmi>\n        <dDesDisEmi>CARLOS A. LOPEZ</dDesDisEmi>\n        <cCiuEmi>1456</cCiuEmi>\n        <dDesCiuEmi>CARLOS A. LOPEZ</dDesCiuEmi>\n        <dTelEmi>+595985990046</dTelEmi>\n        <dEmailE>softwarepar.lat@gmail.com</dEmailE>\n        <dDenSuc>Matriz</dDenSuc>\n        <gActEco>\n          <cActEco>62090</cActEco>\n          <dDesActEco> OTRAS ACTIVIDADES DE TECNOLOGÍA DE LA INFORMACIÓN Y SERVICIOS INFORMÁTICOS</dDesActEco>\n        </gActEco>\n        <gRespDE>\n          <iTipIDRespDE>1</iTipIDRespDE>\n          <dDTipIDRespDE>Cédula paraguaya</dDTipIDRespDE>\n          <dNumIDRespDE>12345678</dNumIDRespDE>\n          <dNomRespDE>SoftwarePar Admin</dNomRespDE>\n          <dCarRespDE>Administrador</dCarRespDE>\n        </gRespDE>\n      </gEmis>\n      <gDatRec>\n        <iNatRec>2</iNatRec>\n        <iTiOpe>2</iTiOpe>\n        <cPaisRec>PRY</cPaisRec>\n        <dDesPaisRe>Paraguay</dDesPaisRe>\n        <iTipIDRec>1</iTipIDRec>\n        <dDTipIDRec>Cédula paraguaya</dDTipIDRec>\n        <dNumIDRec>000002626</dNumIDRec>\n        <dNomRec>Jacinto Ortiz</dNomRec>\n        <dDirRec>Barrio Residencial – Carlos A. López – Itapúa – Paraguay</dDirRec>\n        <dNumCasRec>0</dNumCasRec>\n        <cDepRec>1</cDepRec>\n        <dDesDepRec>CAPITAL</dDesDepRec>\n        <cDisRec>1</cDisRec>\n        <dDesDisRec>ASUNCION (DISTRITO)</dDesDisRec>\n        <cCiuRec>1</cCiuRec>\n        <dDesCiuRec>ASUNCION (DISTRITO)</dDesCiuRec>\n        <dTelRec>+595985990044</dTelRec>\n        <dCelRec>+595985990044</dCelRec>\n        <dEmailRec>alfagroupstoreok@gmail.com</dEmailRec>\n        <dCodCliente>002</dCodCliente>\n      </gDatRec>\n    </gDatGralOpe>\n    <gDtipDE>\n      <gCamFE>\n        <iIndPres>2</iIndPres>\n        <dDesIndPres>Operación electrónica</dDesIndPres>\n      </gCamFE>\n      <gCamCond>\n        <iCondOpe>1</iCondOpe>\n        <dDCondOpe>Contado</dDCondOpe>\n        <gPaConEIni>\n          <iTiPago>9</iTiPago>\n          <dDesTiPag>Vale</dDesTiPag>\n          <dMonTiPag>1775000.0000</dMonTiPag>\n          <cMoneTiPag>PYG</cMoneTiPag>\n          <dDMoneTiPag>Guarani</dDMoneTiPag>\n        </gPaConEIni>\n      </gCamCond>\n      <gCamItem>\n        <dCodInt/>\n        <dDesProSer>Avance 50% - Desarrollo (Pago 2 de 4) - FrigoMgrande</dDesProSer>\n        <cUniMed>77</cUniMed>\n        <dDesUniMed>UNI</dDesUniMed>\n        <dCantProSer>1</dCantProSer>\n        <gValorItem>\n          <dPUniProSer>1775000</dPUniProSer>\n          <dTotBruOpeItem>1775000</dTotBruOpeItem>\n          <gValorRestaItem>\n            <dDescItem>0</dDescItem>\n            <dDescGloItem>0</dDescGloItem>\n            <dAntPreUniIt>0</dAntPreUniIt>\n            <dAntGloPreUniIt>0</dAntGloPreUniIt>\n            <dTotOpeItem>1775000</dTotOpeItem>\n          </gValorRestaItem>\n        </gValorItem>\n        <gCamIVA>\n          <iAfecIVA>3</iAfecIVA>\n          <dDesAfecIVA>Exento</dDesAfecIVA>\n          <dPropIVA>0</dPropIVA>\n          <dTasaIVA>0</dTasaIVA>\n          <dBasGravIVA>0</dBasGravIVA>\n          <dLiqIVAItem>0</dLiqIVAItem>\n          <dBasExe>0</dBasExe>\n        </gCamIVA>\n      </gCamItem>\n    </gDtipDE>\n    <gTotSub>\n      <dSubExe>1775000</dSubExe>\n      <dSubExo>0</dSubExo>\n      <dTotOpe>1775000</dTotOpe>\n      <dTotDesc>0</dTotDesc>\n      <dTotDescGlotem>0</dTotDescGlotem>\n      <dTotAntItem>0</dTotAntItem>\n      <dTotAnt>0</dTotAnt>\n      <dPorcDescTotal>0</dPorcDescTotal>\n      <dDescTotal>0</dDescTotal>\n      <dAnticipo>0</dAnticipo>\n      <dRedon>0</dRedon>\n      <dTotGralOpe>1775000</dTotGralOpe>\n    </gTotSub>\n  </DE>\n  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">\n    <SignedInfo>\n      <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>\n      <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>\n      <Reference URI="#01042200580001001000000212025101610657450160">\n        <Transforms>\n          <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>\n          <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>\n        </Transforms>\n        <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>\n        <DigestValue>UDztjjRKfZUjmE/1MqrgxQgf5JR9s8AJ0U/GwQ29Agk=</DigestValue>\n      </Reference>\n    </SignedInfo>\n    <SignatureValue>FNAWcYv6Cj0qQ7ooI5j59gqiVwcJxVvm4VLra6gFCeH/WPhKxXyAIPM+6Amvb1p7SrlJjTjewfSw&#xD;\nVyeQ9x/FeMynC/5PBldhVS/kQi/06rISLc0ZORGqJecKgMlEB89yl+eDlJUSMEiLL9vjcH2b3CzY&#xD;\no3VL1FWOFSG3awnSMmz8lCRIsOijGV475kKWhgMEnbDkMBw8vN/ag7teW92bzrKyNnE1qXkN4n3l&#xD;\nqNATySmOqU9AY0c47fxRZRq2SwKny+VGl3HMhVhJzhfXjSS0JVINuIdM5+zcb9vbXLnI9leQs+c4&#xD;\nbvjajAEqtch4Pr0hwPmMhRXtZEmJAovfIjSvzQ==</SignatureValue>\n    <KeyInfo>\n      <X509Data>\n        <X509Certificate>MIIDbDCCAlSgAwIBAgIEYYrC+zANBgkqhkiG9w0BAQsFADB4MQswCQYDVQQGEwJQWTEUMBIGA1UE&#xD;\nCAwLQUxUTyBQQVJBTkExGDAWBgNVBAcMD0NJVURBRCBERUwgRVNURTEQMA4GA1UECgwHVElQUyBT&#xD;\nQTETMBEGA1UECwwKREVTQVJST0xMTzESMBAGA1UEAwwJRkFDVFVSQVBJMB4XDTIxMTEwOTE4NTAz&#xD;\nNVoXDTIyMTEwOTE4NTAzNVoweDELMAkGA1UEBhMCUFkxFDASBgNVBAgMC0FMVE8gUEFSQU5BMRgw&#xD;\nFgYDVQQHDA9DSVVEQUQgREVMIEVTVEUxEDAOBgNVBAoMB1RJUFMgU0ExEzARBgNVBAsMCkRFU0FS&#xD;\nUk9MTE8xEjAQBgNVBAMMCUZBQ1RVUkFQSTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB&#xD;\nAMWUwZD/I4iNtm2XVy0BGYBQJ0GGRRTzmdwSJGgCXMYPnLhPpQMMy6gdFsIpPW8fHCa1jhsVuRCp&#xD;\njLbGGuqpBCLIVOHJxWb2mppJIa8fsTJBdgOz84vvqBWWMGmfb3HYx/s59GmsQIMnJ1vMW3x6LOjV&#xD;\n1m5HiXcJqgOh6fGlfex7EJ8QhB7CHJj5cbrQVj5e3rh7J2uXEeY8QBAG8+zaMKgGNxMmuirzhRWg&#xD;\nn+z9QN6pDh0RYjBO/uikgTccLpQdxlnYkK3i/eaKNdhrWEjBM/zrpH9FH7JqJNZgsk4kpZAS5g9M&#xD;\nHbfjLGE4BmskFYwFmhljJEeRiiFjVElVFsvlCT8CAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAZMTd&#xD;\nURV42xA4kOApodsNP5psahbiO0T5674fXbZUYt/k4qLszScQvTTrtZkAmbs1UIHu06W4QNffrBOj&#xD;\nSwbMuNX096BEiQ1SKTdWBBM41qkb0r7TL3aYchfXjJvTsp4l2pnXF0hJ+hiDwBp0sa/qEi+TP7mp&#xD;\nB8BbDtr2IbwyQVqyEgdmNfF/Fz81lwQV/N94H/31Mx2OW7b9ULiHHi6IAxf2HIjVLZYHat3Y4Wm5&#xD;\nbLbsKDubW0DsWuWXh3L1myGIFJqGEvoP4cwz+o/su5cPaLewBIzsKFQoZVJygQN1zv0W2Ve73nln&#xD;\naIbxrFb8w/kXeZeYWeMYotIAZk9VhtheoQ==</X509Certificate>\n      </X509Data>\n    </KeyInfo>\n  </Signature>\n  <gCamFuFD>\n    <dCarQR>https://ekuatia.set.gov.py/consultas-test/qr?nVersion=150&amp;Id=01042200580001001000000212025101610657450160&amp;dFeEmiDE=323032352d31302d31365432333a33303a3439&amp;dNumIDRec=000002626&amp;dTotGralOpe=1775000&amp;dTotIVA=0&amp;cItems=1&amp;DigestValue=55447a746a6a524b665a556a6d452f314d71726778516766354a52397338414a30552f477751323941676b3d&amp;IdCSC=1&amp;cHashQR=c6cf334bdf4ce126fa940a6278423c132726069682d85769bbc7188b1bd82568</dCarQR>\n  </gCamFuFD>\n</rDE>	2025-10-16 23:30:50.792	Procesado correctamente	https://ekuatia.set.gov.py/consultas-test/qr?nVersion=150&Id=01042200580001001000000212025101610657450160&dFeEmiDE=323032352d31302d31365432333a33303a3439&dNumIDRec=000002626&dTotGralOpe=1775000&dTotIVA=0&cItems=1&DigestValue=55447a746a6a524b665a556a6d452f314d71726778516766354a52397338414a30552f477751323941676b3d&IdCSC=1&cHashQR=c6cf334bdf4ce126fa940a6278423c132726069682d85769bbc7188b1bd82568
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, title, message, type, is_read, created_at) FROM stdin;
1	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-09-29 15:22:27.801728
2	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-09-29 15:22:29.29057
3	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-09-29 16:04:59.1094
4	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-09-29 16:05:01.06248
5	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-09-29 16:14:07.278636
6	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-09-29 16:14:08.456755
7	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "Proyecto de Prueba - Notificaciones"	info	f	2025-09-29 16:22:56.985883
8	2	✅ Proyecto Creado Exitosamente	Tu proyecto "Proyecto de Prueba - Notificaciones" ha sido creado y está siendo revisado	success	f	2025-09-29 16:22:58.619185
9	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "Proyecto de Prueba - Notificaciones"	info	f	2025-09-29 16:24:24.385947
10	2	✅ Proyecto Creado Exitosamente	Tu proyecto "Proyecto de Prueba - Notificaciones" ha sido creado y está siendo revisado	success	f	2025-09-29 16:24:26.024409
11	2	💵 Contraoferta Recibida	Proyecto "FrigoMgrande": Precio propuesto $250	warning	f	2025-09-29 16:28:03.27255
12	1	💬 Nuevo Mensaje	Cliente te ha enviado un mensaje en "FrigoMgrande"	info	f	2025-09-29 16:29:04.202682
13	2	💬 Nuevo Mensaje	Administrador SoftwarePar te ha enviado un mensaje en "FrigoMgrande"	info	f	2025-09-29 16:29:19.050779
14	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango. Comprobante adjunto: photo-1621607512214-68297480165e.jpg. Requiere verificación.	warning	f	2025-09-29 16:33:02.920794
15	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-09-29 16:34:28.86734
16	1	🚀 Nuevo Proyecto Creado	Cliente de Prueba ha creado el proyecto "Proyecto de Prueba Email - 2025-09-29T17:04:14.890Z"	info	f	2025-09-29 17:04:15.495878
17	3	✅ Proyecto Creado Exitosamente	Tu proyecto "Proyecto de Prueba Email - 2025-09-29T17:04:14.890Z" ha sido creado y está siendo revisado	success	f	2025-09-29 17:04:19.761361
18	3	📋 Proyecto Actualizado	Tu proyecto "Proyecto de Prueba Email - 2025-09-29T17:04:14.890Z" ha sido actualizado: Estado cambiado a: En Progreso - Progreso actualizado a 25%	info	f	2025-09-29 17:04:21.666928
19	1	📋 Proyecto Actualizado por Admin	Proyecto "Proyecto de Prueba Email - 2025-09-29T17:04:14.890Z" actualizado: Estado cambiado a: En Progreso - Progreso actualizado a 25%	info	f	2025-09-29 17:04:22.801791
20	1	🎫 Nuevo Ticket de Soporte	Cliente de Prueba ha creado el ticket: "Ticket de Prueba - Consulta sobre el proyecto"	warning	f	2025-09-29 17:04:28.837308
21	1	💬 Nuevo Mensaje	Cliente de Prueba te ha enviado un mensaje en "Proyecto de Prueba Email - 2025-09-29T17:04:14.890Z"	info	f	2025-09-29 17:04:30.854736
22	3	📋 Proyecto Actualizado	Tu proyecto "Proyecto de Prueba Email - 2025-09-29T17:04:14.890Z" ha sido actualizado: Estado cambiado a: Completado - Progreso actualizado a 100%	info	f	2025-09-29 17:04:30.973519
23	1	📋 Proyecto Actualizado por Admin	Proyecto "Proyecto de Prueba Email - 2025-09-29T17:04:14.890Z" actualizado: Estado cambiado a: Completado - Progreso actualizado a 100%	info	f	2025-09-29 17:04:32.768153
24	1	🚀 Nuevo Proyecto Creado	Cliente de Prueba ha creado el proyecto "Proyecto de Prueba Email - 2025-09-29T20:59:55.385Z"	info	f	2025-09-29 20:59:56.078026
25	3	✅ Proyecto Creado Exitosamente	Tu proyecto "Proyecto de Prueba Email - 2025-09-29T20:59:55.385Z" ha sido creado y está siendo revisado	success	f	2025-09-29 20:59:59.360426
26	3	📋 Proyecto Actualizado	Tu proyecto "Proyecto de Prueba Email - 2025-09-29T20:59:55.385Z" ha sido actualizado: Estado cambiado a: En Progreso - Progreso actualizado a 25%	info	f	2025-09-29 21:00:01.328731
27	1	📋 Proyecto Actualizado por Admin	Proyecto "Proyecto de Prueba Email - 2025-09-29T20:59:55.385Z" actualizado: Estado cambiado a: En Progreso - Progreso actualizado a 25%	info	f	2025-09-29 21:00:02.64845
28	1	🎫 Nuevo Ticket de Soporte	Cliente de Prueba ha creado el ticket: "Ticket de Prueba - Consulta sobre el proyecto"	warning	f	2025-09-29 21:00:06.457302
29	1	💬 Nuevo Mensaje	Cliente de Prueba te ha enviado un mensaje en "Proyecto de Prueba Email - 2025-09-29T20:59:55.385Z"	info	f	2025-09-29 21:00:07.901123
30	3	📋 Proyecto Actualizado	Tu proyecto "Proyecto de Prueba Email - 2025-09-29T20:59:55.385Z" ha sido actualizado: Estado cambiado a: Completado - Progreso actualizado a 100%	info	f	2025-09-29 21:00:08.598154
31	1	📋 Proyecto Actualizado por Admin	Proyecto "Proyecto de Prueba Email - 2025-09-29T20:59:55.385Z" actualizado: Estado cambiado a: Completado - Progreso actualizado a 100%	info	f	2025-09-29 21:00:09.697936
32	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "test"	info	f	2025-09-29 21:23:40.922568
33	2	✅ Proyecto Creado Exitosamente	Tu proyecto "test" ha sido creado y está siendo revisado	success	f	2025-09-29 21:23:45.226111
34	2	💵 Contraoferta Recibida	Proyecto "test": Precio propuesto $275	warning	f	2025-09-29 21:25:29.630751
35	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-09-29 21:34:03.102939
36	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-09-29 21:34:07.469534
37	2	💵 Contraoferta Recibida	Proyecto "FrigoMgrande": Precio propuesto $350	warning	f	2025-09-29 21:35:52.647467
38	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-09-29 21:43:09.483022
39	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-09-29 21:43:11.43281
40	2	💵 Contraoferta Recibida	Proyecto "FrigoMgrande": Precio propuesto $425	warning	f	2025-09-29 21:44:44.354683
41	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango. Comprobante adjunto: photo-1621607512214-68297480165e.jpg. Requiere verificación.	warning	f	2025-09-29 21:48:39.830617
42	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-09-29 21:51:05.529997
43	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-09-29 22:15:36.111101
44	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-09-29 22:15:38.218791
45	2	💵 Contraoferta Recibida	Proyecto "FrigoMgrande": Precio propuesto $300	warning	f	2025-09-29 22:16:16.453416
46	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-09-29 22:19:55.443582
47	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-09-29 22:19:58.822728
48	2	💵 Contraoferta Recibida	Proyecto "FrigoMgrande": Precio propuesto $175	warning	f	2025-09-29 22:20:41.491543
49	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango. Comprobante adjunto: solar.png. Requiere verificación.	warning	f	2025-09-29 22:23:25.064449
50	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-09-29 22:24:37.558769
51	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-09-30 00:48:24.046749
52	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-09-30 00:48:27.403274
53	2	💵 Contraoferta Recibida	Proyecto "FrigoMgrande": Precio propuesto $350	warning	f	2025-09-30 00:49:41.279789
54	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-09-30 01:17:59.337382
55	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-09-30 01:30:01.574974
56	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-09-30 15:27:12.173577
57	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-09-30 15:27:14.82863
58	2	💵 Contraoferta Recibida	Proyecto "FrigoMgrande": Precio propuesto $300	warning	f	2025-09-30 15:28:35.512127
59	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango (TU FINANCIERA). Comprobante adjunto: web.png. Requiere verificación.	warning	f	2025-09-30 16:06:23.188881
60	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-09-30 16:07:58.839348
61	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Avance 50% - Desarrollo" mediante Mango (TU FINANCIERA). Comprobante adjunto: SoftwarePar_Boleta_RESIMPLE_INV-STAGE-11-21.pdf. Requiere verificación.	warning	f	2025-10-01 00:13:01.768413
62	2	✅ Pago Aprobado	Tu pago para la etapa "Avance 50% - Desarrollo" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-01 00:15:33.059709
63	2	💬 Nuevo Mensaje	Administrador SoftwarePar te ha enviado un mensaje en "FrigoMgrande"	info	f	2025-10-01 00:29:04.839846
64	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-10-11 22:15:24.853925
65	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-10-11 22:15:29.904124
66	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango (TU FINANCIERA). Comprobante adjunto: mango.png. Requiere verificación.	warning	f	2025-10-11 22:17:58.148412
67	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-11 22:19:23.045109
68	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-10-11 23:05:38.496069
69	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-10-11 23:05:43.270383
70	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango (TU FINANCIERA). Comprobante adjunto: vaquita.png. Requiere verificación.	warning	f	2025-10-11 23:08:03.911822
71	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-11 23:09:13.746072
72	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-10-11 23:15:06.06969
73	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-10-11 23:15:10.911339
74	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-11 23:15:55.242363
75	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-11 23:16:33.097658
76	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "Barbershop"	info	f	2025-10-13 13:18:33.17086
77	2	✅ Proyecto Creado Exitosamente	Tu proyecto "Barbershop" ha sido creado y está siendo revisado	success	f	2025-10-13 13:18:35.681804
78	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Ueno Bank. Comprobante adjunto: test.pdf. Requiere verificación.	warning	f	2025-10-13 13:21:03.728985
79	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 13:21:50.284589
80	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Avance 50% - Desarrollo" mediante Mango (TU FINANCIERA). Comprobante adjunto: SoftwarePar_Boleta_RESIMPLE_INV-STAGE-13-29.pdf. Requiere verificación.	warning	f	2025-10-13 13:32:25.751135
81	2	✅ Pago Aprobado	Tu pago para la etapa "Avance 50% - Desarrollo" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 13:34:11.315857
82	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Pre-entrega - 90% Completado" mediante Mango (TU FINANCIERA). Comprobante adjunto: SoftwarePar_Boleta_RESIMPLE_INV-STAGE-13-29 (5).pdf. Requiere verificación.	warning	f	2025-10-13 13:38:26.616232
83	2	✅ Pago Aprobado	Tu pago para la etapa "Pre-entrega - 90% Completado" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 13:39:42.471936
84	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Entrega Final" mediante Mango (TU FINANCIERA). Comprobante adjunto: SoftwarePar_Boleta_STAGE-37.pdf. Requiere verificación.	warning	f	2025-10-13 13:45:44.036969
85	2	✅ Pago Aprobado	Tu pago para la etapa "Entrega Final" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 13:46:47.27615
86	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "Barbershop"	info	f	2025-10-13 13:51:58.592275
87	2	✅ Proyecto Creado Exitosamente	Tu proyecto "Barbershop" ha sido creado y está siendo revisado	success	f	2025-10-13 13:52:02.393137
88	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango (TU FINANCIERA). Comprobante adjunto: SoftwarePar_Boleta_RESIMPLE_INV-STAGE-12-26.pdf. Requiere verificación.	warning	f	2025-10-13 13:53:17.853019
89	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 13:53:48.471558
169	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-10-16 22:12:21.652321
90	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Avance 50% - Desarrollo" mediante Mango (TU FINANCIERA). Comprobante adjunto: test.pdf. Requiere verificación.	warning	f	2025-10-13 14:04:37.526987
91	2	✅ Pago Aprobado	Tu pago para la etapa "Avance 50% - Desarrollo" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 14:04:58.61289
92	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Pre-entrega - 90% Completado" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-13 14:11:40.573681
93	2	✅ Pago Aprobado	Tu pago para la etapa "Pre-entrega - 90% Completado" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 14:12:03.657864
94	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Entrega Final" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-13 14:21:56.228171
95	2	✅ Pago Aprobado	Tu pago para la etapa "Entrega Final" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 14:22:15.22891
96	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-10-13 18:44:13.136684
97	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-10-13 18:44:15.335464
98	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-13 18:45:22.640981
99	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 18:45:36.825278
100	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Avance 50% - Desarrollo" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-13 18:53:45.920305
101	2	✅ Pago Aprobado	Tu pago para la etapa "Avance 50% - Desarrollo" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 18:54:09.997894
102	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Pre-entrega - 90% Completado" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-13 21:01:20.212056
103	2	✅ Pago Aprobado	Tu pago para la etapa "Pre-entrega - 90% Completado" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 21:01:40.806027
104	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Entrega Final" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-13 21:10:01.525454
105	2	✅ Pago Aprobado	Tu pago para la etapa "Entrega Final" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 21:10:39.626911
106	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgranded"	info	f	2025-10-13 21:14:23.407293
107	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgranded" ha sido creado y está siendo revisado	success	f	2025-10-13 21:14:26.069294
108	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-13 21:15:23.790188
109	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 21:23:54.035635
110	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Avance 50% - Desarrollo" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-13 22:37:38.239067
111	2	✅ Pago Aprobado	Tu pago para la etapa "Avance 50% - Desarrollo" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 22:38:17.166068
112	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Pre-entrega - 90% Completado" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-13 22:41:50.8051
113	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Pre-entrega - 90% Completado" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-13 22:41:56.191719
114	2	✅ Pago Aprobado	Tu pago para la etapa "Pre-entrega - 90% Completado" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 22:42:20.807783
115	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Entrega Final" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-13 22:49:06.627952
116	2	✅ Pago Aprobado	Tu pago para la etapa "Entrega Final" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-13 22:49:34.518232
117	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-10-14 09:07:00.593906
118	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-10-14 09:07:04.343869
119	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 09:07:47.377102
120	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 09:08:13.046894
121	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Avance 50% - Desarrollo" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 09:11:42.117195
122	2	✅ Pago Aprobado	Tu pago para la etapa "Avance 50% - Desarrollo" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 09:12:03.469593
123	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Pre-entrega - 90% Completado" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 09:19:25.206562
124	2	✅ Pago Aprobado	Tu pago para la etapa "Pre-entrega - 90% Completado" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 09:19:54.599331
125	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Entrega Final" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 09:26:12.806799
126	2	✅ Pago Aprobado	Tu pago para la etapa "Entrega Final" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 09:26:34.848457
127	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-10-14 09:33:55.082564
128	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-10-14 09:33:57.948028
170	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-10-16 22:12:24.593247
129	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 09:34:39.165296
130	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 09:34:57.818171
131	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Avance 50% - Desarrollo" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 09:40:36.797084
132	2	✅ Pago Aprobado	Tu pago para la etapa "Avance 50% - Desarrollo" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 09:40:56.518825
133	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Pre-entrega - 90% Completado" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 10:48:36.181802
134	2	✅ Pago Aprobado	Tu pago para la etapa "Pre-entrega - 90% Completado" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 10:49:03.528791
135	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Entrega Final" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 10:53:03.195423
136	2	✅ Pago Aprobado	Tu pago para la etapa "Entrega Final" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 10:53:26.113745
137	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "Barbershop"	info	f	2025-10-14 11:06:14.867751
138	2	✅ Proyecto Creado Exitosamente	Tu proyecto "Barbershop" ha sido creado y está siendo revisado	success	f	2025-10-14 11:06:17.302926
139	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 11:06:52.686205
140	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 11:07:24.509935
141	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "Barbershop"	info	f	2025-10-14 11:19:07.088084
142	2	✅ Proyecto Creado Exitosamente	Tu proyecto "Barbershop" ha sido creado y está siendo revisado	success	f	2025-10-14 11:19:09.54806
143	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 11:20:10.606717
144	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 11:20:28.441181
145	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Avance 50% - Desarrollo" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 11:43:53.708622
146	2	✅ Pago Aprobado	Tu pago para la etapa "Avance 50% - Desarrollo" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 11:44:21.97128
147	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Pre-entrega - 90% Completado" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 11:55:50.091502
148	2	✅ Pago Aprobado	Tu pago para la etapa "Pre-entrega - 90% Completado" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 11:56:14.119634
149	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Entrega Final" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 12:09:01.301016
150	2	✅ Pago Aprobado	Tu pago para la etapa "Entrega Final" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 12:09:18.209609
151	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "Barbershop"	info	f	2025-10-14 12:21:10.844266
152	2	✅ Proyecto Creado Exitosamente	Tu proyecto "Barbershop" ha sido creado y está siendo revisado	success	f	2025-10-14 12:21:13.238308
153	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 12:22:30.130968
154	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 12:22:43.440597
155	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Avance 50% - Desarrollo" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 12:57:38.263555
156	2	✅ Pago Aprobado	Tu pago para la etapa "Avance 50% - Desarrollo" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 12:58:00.880166
157	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Pre-entrega - 90% Completado" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-14 13:05:18.542601
158	2	✅ Pago Aprobado	Tu pago para la etapa "Pre-entrega - 90% Completado" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-14 13:05:51.25104
159	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Entrega Final" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-15 12:00:53.369798
160	2	✅ Pago Aprobado	Tu pago para la etapa "Entrega Final" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-15 12:01:42.894931
161	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "Barbershop"	info	f	2025-10-15 12:10:19.113086
162	2	✅ Proyecto Creado Exitosamente	Tu proyecto "Barbershop" ha sido creado y está siendo revisado	success	f	2025-10-15 12:10:21.279803
163	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-15 12:13:55.158073
164	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-15 12:14:27.372555
165	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Avance 50% - Desarrollo" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-15 14:18:58.394766
166	2	✅ Pago Aprobado	Tu pago para la etapa "Avance 50% - Desarrollo" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-15 14:19:31.974644
167	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Pre-entrega - 90% Completado" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-15 14:23:13.807737
168	2	✅ Pago Aprobado	Tu pago para la etapa "Pre-entrega - 90% Completado" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-15 14:48:19.218459
171	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-10-16 22:27:33.797048
172	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-10-16 22:27:37.180992
173	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Mango (TU FINANCIERA). Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-16 22:28:52.637902
174	1	🚀 Nuevo Proyecto Creado	Cliente ha creado el proyecto "FrigoMgrande"	info	f	2025-10-16 22:31:54.19637
175	2	✅ Proyecto Creado Exitosamente	Tu proyecto "FrigoMgrande" ha sido creado y está siendo revisado	success	f	2025-10-16 22:31:56.718905
176	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Anticipo - Inicio del Proyecto" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-16 22:33:26.400542
177	2	✅ Pago Aprobado	Tu pago para la etapa "Anticipo - Inicio del Proyecto" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-16 22:34:01.098872
178	1	💬 Nuevo Mensaje	Cliente te ha enviado un mensaje en "FrigoMgrande"	info	f	2025-10-16 22:46:10.876792
179	2	💬 Nuevo Mensaje	Administrador SoftwarePar te ha enviado un mensaje en "FrigoMgrande"	info	f	2025-10-16 22:46:21.595433
180	2	💬 Nuevo Mensaje	Administrador SoftwarePar te ha enviado un mensaje en "FrigoMgrande"	info	f	2025-10-16 22:46:47.330548
181	1	📋 Comprobante de Pago Recibido	El cliente Cliente envió comprobante de pago para "Avance 50% - Desarrollo" mediante Ueno Bank. Sin comprobante adjunto. Requiere verificación.	warning	f	2025-10-16 23:29:51.174725
182	2	✅ Pago Aprobado	Tu pago para la etapa "Avance 50% - Desarrollo" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!	success	f	2025-10-16 23:30:48.886559
\.


--
-- Data for Name: partners; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.partners (id, user_id, referral_code, commission_rate, total_earnings, created_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used, created_at) FROM stdin;
1	2	6ec92e042b5ebb6f264c3654752b01656001307db21dc030929befc3cf42acc6	2025-10-17 01:47:57.784	t	2025-10-17 00:47:57.85948
\.


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payment_methods (id, user_id, type, is_default, is_active, created_at, details) FROM stdin;
\.


--
-- Data for Name: payment_stages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payment_stages (id, project_id, stage_name, stage_percentage, amount, required_progress, status, payment_link, paid_date, created_at, updated_at, payment_method, payment_data, proof_file_url, exchange_rate_used) FROM stdin;
85	28	Anticipo - Inicio del Proyecto	25	250.00	0	paid	\N	2025-10-16 22:34:00.877	2025-10-16 22:32:46.348986	2025-10-16 22:34:00.878	Ueno Bank	{"method": "Ueno Bank", "fileInfo": null, "confirmedAt": "2025-10-16T22:33:26.032Z", "confirmedBy": 2}	\N	7300.00
86	28	Avance 50% - Desarrollo	25	250.00	25	paid	\N	2025-10-16 23:30:48.663	2025-10-16 22:32:46.494651	2025-10-16 23:30:48.663	Ueno Bank	{"method": "Ueno Bank", "fileInfo": null, "confirmedAt": "2025-10-16T23:29:50.803Z", "confirmedBy": 2}	\N	7100.00
87	28	Pre-entrega - 90% Completado	25	250.00	50	pending	\N	\N	2025-10-16 22:32:46.644128	2025-10-16 22:32:46.644128	\N	\N	\N	\N
88	28	Entrega Final	25	250.00	75	pending	\N	\N	2025-10-16 22:32:46.790965	2025-10-16 22:32:46.790965	\N	\N	\N	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payments (id, project_id, amount, status, payment_data, created_at, stage, stage_percentage, payment_method, transaction_id) FROM stdin;
\.


--
-- Data for Name: portfolio; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.portfolio (id, title, description, category, technologies, image_url, demo_url, completed_at, featured, is_active, created_at, updated_at) FROM stdin;
7	BaberShop	Aplicación web completa para gestión de barbería con sistema de reservas online, panel administrativo y soporte multiidioma (Español/Portugués). Incluye catálogo de servicios con precios en múltiples monedas (USD, BRL, PYG), galería de trabajos, gestión de personal y configuración de horarios. Sistema responsive con diseño moderno y funcionalidades avanzadas de administración.	Web App	[]	https://i.ibb.co/8DwC9CCg/web.png	https://barbershop.softwarepar.lat	2025-09-23 00:00:00	f	t	2025-09-24 23:27:36.539547	2025-10-06 14:53:42.559
2	Dashboard Analytics	Dashboard interactivo para analisis de datos con graficos en tiempo real y reportes personalizables.	Dashboard	[]	https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800	https://demo-dashboard.softwarepar.lat	2024-02-10 00:00:00	t	t	2025-08-27 14:44:09.899342	2025-10-06 14:53:53.928
3	App Movil Delivery1	Aplicacion movil para delivery de comida con seguimiento en tiempo real y multiples metodos de pago.	Mobile App	[]	https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800		2024-03-05 00:00:00	f	t	2025-08-27 14:44:09.899342	2025-10-06 14:54:01.97
4	Sistema CRM	Sistema de gestion de relaciones con clientes con automatizacion de marketing y seguimiento de ventas.	Web App	[]	https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800	https://demo-crm.softwarepar.lat	2024-01-28 00:00:00	f	t	2025-08-27 14:44:09.899342	2025-10-06 14:54:09.764
1	E-commerce Moderno	Plataforma de comercio electronico con carrito de compras, pagos integrados y panel de administracion completo.	E-commerce	[]	https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800	https://demo-ecommerce.softwarepar.lat	2024-01-15 00:00:00	t	t	2025-08-27 14:44:09.899342	2025-10-06 14:54:21.675
\.


--
-- Data for Name: project_files; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_files (id, project_id, file_name, file_url, file_type, uploaded_by, file_size, created_at) FROM stdin;
\.


--
-- Data for Name: project_messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_messages (id, project_id, user_id, message, created_at) FROM stdin;
6	28	2	test\n	2025-10-16 22:46:10.439702
7	28	1	test\n	2025-10-16 22:46:21.301311
8	28	1	https://softwarepar.lat	2025-10-16 22:46:47.036398
\.


--
-- Data for Name: project_timeline; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_timeline (id, project_id, title, description, status, estimated_date, completed_at, created_at) FROM stdin;
129	28	Desarrollo - Fase 1	Desarrollo de funcionalidades principales (50% del proyecto)	pending	\N	\N	2025-10-16 22:32:49.102769
130	28	Desarrollo - Fase 2	Completar desarrollo y optimizaciones (90% del proyecto)	pending	\N	\N	2025-10-16 22:32:49.249793
131	28	Testing y QA	Pruebas exhaustivas y control de calidad	pending	\N	\N	2025-10-16 22:32:49.39559
132	28	Entrega Final	Entrega del proyecto completado y documentación	pending	\N	\N	2025-10-16 22:32:49.541925
127	28	Análisis y Planificación	Análisis de requerimientos y planificación del proyecto	completed	\N	2025-10-16 23:29:31.543	2025-10-16 22:32:48.807236
128	28	Diseño y Arquitectura	Diseño de la interfaz y arquitectura del sistema	completed	\N	2025-10-16 23:29:34.937	2025-10-16 22:32:48.956774
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.projects (id, name, description, price, status, progress, client_id, partner_id, delivery_date, created_at, updated_at, start_date) FROM stdin;
28	FrigoMgrande	pruba solicitud de proyecto	1000.00	in_progress	33	2	\N	2025-10-23 00:00:00	2025-10-16 22:31:53.605478	2025-10-16 23:29:34.076	2025-10-16 00:00:00
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.referrals (id, partner_id, client_id, project_id, status, commission_amount, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- Data for Name: ticket_responses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ticket_responses (id, ticket_id, user_id, message, is_from_support, created_at) FROM stdin;
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tickets (id, title, description, status, priority, user_id, project_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transactions (id, invoice_id, payment_method_id, user_id, amount, currency, status, transaction_id, payment_data, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password, full_name, role, is_active, created_at, updated_at) FROM stdin;
3	cliente.prueba@test.com	$2b$10$6nMuk.lGIr1.p4G2wV.giO2yNpOx55rL9wWBeAxKgHbVGBVLbToZ2	Cliente de Prueba	client	t	2025-09-29 17:04:14.806663	2025-09-29 17:04:14.806663
1	softwarepar.lat@gmail.com	$2b$10$FuHFhTc0ctLQqAfTWnUk9e5fbbha/vx2AhragKYn6MRT5R4SM4336	Administrador SoftwarePar	admin	t	2025-08-26 22:32:54.933839	2025-10-16 23:55:25.087
2	alfagroupstoreok@gmail.com	$2b$10$Zp8Tbta.Hx8odYD7eKmYtOdwgUCdCmbUw5/qGGp9Jo3SXdnxgRAx2	Cliente	client	t	2025-09-29 15:15:32.71422	2025-10-17 00:50:09.819
\.


--
-- Data for Name: work_modalities; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.work_modalities (id, title, subtitle, badge_text, badge_variant, description, price_text, price_subtitle, features, button_text, button_variant, is_popular, is_active, display_order, created_at, updated_at) FROM stdin;
4	Compra Completa	Tradicional	Tradicional	secondary	Recibe el código fuente completo y propiedad total del proyecto	$2,500 - $15,000	Precio según complejidad	"[\\"Código fuente completo incluido\\",\\"Propiedad intelectual total\\",\\"Documentación técnica completa\\",\\"3 meses de soporte incluido\\",\\"Capacitación del equipo\\",\\"Deployment en tu servidor\\"]"	Solicitar Cotización	default	f	f	1	2025-09-23 12:20:20.459498	2025-10-06 15:02:52.189
3	Modelo SaaS	Más Popular	Más Popular	secondary	Accede al software como servicio con pagos mensuales flexibles	$50 - $200	por mes	["Sin inversión inicial alta", "Actualizaciones automáticas", "Soporte técnico incluido", "Escalabilidad garantizada", "Copias de seguridad automáticas", "Acceso 24/7 desde cualquier lugar"]	Comenzar Ahora	default	t	f	2	2025-09-23 12:07:05.836181	2025-09-23 12:15:18.484
1	Compra Completa	Tradicional	Tradicional	default	Recibe el código fuente completo y propiedad total del proyecto	$2,500 - $15,000	Precio según complejidad	"[\\"Código fuente completo incluido\\",\\"Propiedad intelectual total\\",\\"Documentación técnica completa\\",\\"3 meses de soporte incluido\\",\\"Capacitación del equipo\\",\\"Deployment en tu servidor\\"]"	Solicitar Cotización	default	f	f	1	2025-09-23 12:01:27.883544	2025-09-23 12:19:00.669
5	Partnership	Innovador	Más Popular	default	Paga menos, conviértete en partner y genera ingresos revendendolo	40% - 60%	+ comisiones por ventas	["Precio reducido inicial", "Código de referido único", "20-40% comisión por venta", "Dashboard de ganancias", "Sistema de licencias", "Soporte y marketing incluido"]	Convertirse en Partner	default	t	f	2	2025-09-23 12:20:20.459498	2025-09-23 12:21:44.001
6	Lanzamiento Web	Tu sitio profesional listo en pocos días	Ideal para Emprendedores	default	Ideal para negocios y emprendedores que desean una página web moderna, rápida y optimizada. Incluye dominio, hosting, y soporte técnico por 30 días.	Gs 1.500.000	Entrega en 7 a 15 días	"[\\"Diseño web profesional (hasta 5 secciones)\\",\\"Dominio .com o .com.py incluido\\",\\"Hosting y certificado SSL\\",\\"Diseño responsive (PC, tablet, móvil)\\",\\"Formulario de contacto y WhatsApp directo\\",\\"Optimización SEO básica\\",\\"Soporte técnico 30 días\\"]"	Cotizar mi web profesional	default	f	t	1	2025-10-06 15:00:30.907659	2025-10-06 15:00:30.907659
2	Partnership	Innovador	Más Popular	default	Paga menos, conviértete en partner y genera ingresos revendendolo	40% - 70%	+ comisiones por ventas	"[\\"Precio reducido inicial\\",\\"Código de referido único\\",\\"20-40% comisión por venta\\",\\"Dashboard de ganancias\\",\\"Sistema de licencias\\",\\"Soporte y marketing incluido\\"]"	Convertirse en Partner	default	t	f	2	2025-09-23 12:01:27.883544	2025-10-06 15:02:46.881
7	Desarrollo Avanzado	Soluciones web y apps a medida para tu empresa	Más Popular	secondary	Perfecto para empresas que necesitan sistemas personalizados, paneles administrativos y aplicaciones con integraciones avanzadas.	Gs. 3.500.000	Precio según complejidad	"[\\"Sistema web o app personalizada\\",\\"Panel administrativo completo\\",\\"Integración con pagos y facturación\\",\\"Usuarios y roles personalizados\\",\\"Reportes y dashboard\\",\\"Diseño exclusivo adaptado a tu marca\\",\\"Garantía técnica 6 meses\\",\\"Implementación en servidor\\"]"	Solicitar Cotización	default	t	t	2	2025-10-06 15:02:26.43384	2025-10-06 15:03:17.764
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: neondb_owner
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, false);


--
-- Name: budget_negotiations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.budget_negotiations_id_seq', 8, true);


--
-- Name: client_billing_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.client_billing_info_id_seq', 1, true);


--
-- Name: company_billing_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.company_billing_info_id_seq', 3, true);


--
-- Name: exchange_rate_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.exchange_rate_config_id_seq', 12, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.invoices_id_seq', 52, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 182, true);


--
-- Name: partners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.partners_id_seq', 1, false);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, true);


--
-- Name: payment_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.payment_methods_id_seq', 1, false);


--
-- Name: payment_stages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.payment_stages_id_seq', 88, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: portfolio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.portfolio_id_seq', 7, true);


--
-- Name: project_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.project_files_id_seq', 1, false);


--
-- Name: project_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.project_messages_id_seq', 8, true);


--
-- Name: project_timeline_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.project_timeline_id_seq', 132, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.projects_id_seq', 28, true);


--
-- Name: referrals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.referrals_id_seq', 1, false);


--
-- Name: ticket_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.ticket_responses_id_seq', 1, false);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tickets_id_seq', 2, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.transactions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: work_modalities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.work_modalities_id_seq', 7, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: budget_negotiations budget_negotiations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.budget_negotiations
    ADD CONSTRAINT budget_negotiations_pkey PRIMARY KEY (id);


--
-- Name: client_billing_info client_billing_info_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_billing_info
    ADD CONSTRAINT client_billing_info_pkey PRIMARY KEY (id);


--
-- Name: company_billing_info company_billing_info_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_billing_info
    ADD CONSTRAINT company_billing_info_pkey PRIMARY KEY (id);


--
-- Name: exchange_rate_config exchange_rate_config_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.exchange_rate_config
    ADD CONSTRAINT exchange_rate_config_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: partners partners_referral_code_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_referral_code_unique UNIQUE (referral_code);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_unique UNIQUE (token);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: payment_stages payment_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_stages
    ADD CONSTRAINT payment_stages_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: portfolio portfolio_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.portfolio
    ADD CONSTRAINT portfolio_pkey PRIMARY KEY (id);


--
-- Name: project_files project_files_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_files
    ADD CONSTRAINT project_files_pkey PRIMARY KEY (id);


--
-- Name: project_messages project_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_messages
    ADD CONSTRAINT project_messages_pkey PRIMARY KEY (id);


--
-- Name: project_timeline project_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_timeline
    ADD CONSTRAINT project_timeline_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: ticket_responses ticket_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ticket_responses
    ADD CONSTRAINT ticket_responses_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: work_modalities work_modalities_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.work_modalities
    ADD CONSTRAINT work_modalities_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: budget_negotiations budget_negotiations_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.budget_negotiations
    ADD CONSTRAINT budget_negotiations_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: budget_negotiations budget_negotiations_proposed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.budget_negotiations
    ADD CONSTRAINT budget_negotiations_proposed_by_users_id_fk FOREIGN KEY (proposed_by) REFERENCES public.users(id);


--
-- Name: client_billing_info client_billing_info_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_billing_info
    ADD CONSTRAINT client_billing_info_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: exchange_rate_config exchange_rate_config_updated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.exchange_rate_config
    ADD CONSTRAINT exchange_rate_config_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: invoices invoices_client_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_users_id_fk FOREIGN KEY (client_id) REFERENCES public.users(id);


--
-- Name: invoices invoices_payment_method_id_payment_methods_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_payment_method_id_payment_methods_id_fk FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- Name: invoices invoices_payment_stage_id_payment_stages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_payment_stage_id_payment_stages_id_fk FOREIGN KEY (payment_stage_id) REFERENCES public.payment_stages(id);


--
-- Name: invoices invoices_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: partners partners_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payment_methods payment_methods_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payment_stages payment_stages_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_stages
    ADD CONSTRAINT payment_stages_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: payments payments_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_files project_files_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_files
    ADD CONSTRAINT project_files_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_files project_files_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_files
    ADD CONSTRAINT project_files_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: project_messages project_messages_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_messages
    ADD CONSTRAINT project_messages_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_messages project_messages_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_messages
    ADD CONSTRAINT project_messages_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: project_timeline project_timeline_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_timeline
    ADD CONSTRAINT project_timeline_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: projects projects_client_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_users_id_fk FOREIGN KEY (client_id) REFERENCES public.users(id);


--
-- Name: projects projects_partner_id_partners_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_partner_id_partners_id_fk FOREIGN KEY (partner_id) REFERENCES public.partners(id);


--
-- Name: referrals referrals_client_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_client_id_users_id_fk FOREIGN KEY (client_id) REFERENCES public.users(id);


--
-- Name: referrals referrals_partner_id_partners_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_partner_id_partners_id_fk FOREIGN KEY (partner_id) REFERENCES public.partners(id);


--
-- Name: referrals referrals_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: ticket_responses ticket_responses_ticket_id_tickets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ticket_responses
    ADD CONSTRAINT ticket_responses_ticket_id_tickets_id_fk FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);


--
-- Name: ticket_responses ticket_responses_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ticket_responses
    ADD CONSTRAINT ticket_responses_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tickets tickets_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: tickets tickets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: transactions transactions_payment_method_id_payment_methods_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_payment_method_id_payment_methods_id_fk FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- Name: transactions transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict W6NfRJlp5w6Zgqpl2CgWcNoPKUXdw3kXiagfjs3QaCiYyRsvCfkBnOWdztQloIy

