--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18
-- Dumped by pg_dump version 14.18

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
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: blog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog (
    id integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    author text NOT NULL,
    genre_id integer,
    summary text,
    content text NOT NULL,
    cover_key text,
    pdf_key text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.blog OWNER TO postgres;

--
-- Name: blog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.blog_id_seq OWNER TO postgres;

--
-- Name: blog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blog_id_seq OWNED BY public.blog.id;


--
-- Name: blog_tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_tag (
    "blogId" integer NOT NULL,
    "tagId" integer NOT NULL
);


ALTER TABLE public.blog_tag OWNER TO postgres;

--
-- Name: book; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.book (
    id integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    author text NOT NULL,
    genre_id integer,
    summary text NOT NULL,
    content text NOT NULL,
    cover_key text,
    pdf_key text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.book OWNER TO postgres;

--
-- Name: book_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.book_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.book_id_seq OWNER TO postgres;

--
-- Name: book_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.book_id_seq OWNED BY public.book.id;


--
-- Name: book_tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.book_tag (
    "bookId" integer NOT NULL,
    "tagId" integer NOT NULL
);


ALTER TABLE public.book_tag OWNER TO postgres;

--
-- Name: genre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.genre (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.genre OWNER TO postgres;

--
-- Name: genre_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.genre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.genre_id_seq OWNER TO postgres;

--
-- Name: genre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.genre_id_seq OWNED BY public.genre.id;


--
-- Name: product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product (
    id integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    author text NOT NULL,
    genre_id integer,
    summary text NOT NULL,
    content text NOT NULL,
    cover_key text,
    pdf_key text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product OWNER TO postgres;

--
-- Name: product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_id_seq OWNER TO postgres;

--
-- Name: product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_id_seq OWNED BY public.product.id;


--
-- Name: product_tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_tag (
    "productId" integer NOT NULL,
    "tagId" integer NOT NULL
);


ALTER TABLE public.product_tag OWNER TO postgres;

--
-- Name: profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profile (
    id integer NOT NULL,
    avatar_key text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.profile OWNER TO postgres;

--
-- Name: profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.profile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.profile_id_seq OWNER TO postgres;

--
-- Name: profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.profile_id_seq OWNED BY public.profile.id;


--
-- Name: subscriber; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriber (
    id integer NOT NULL,
    email text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.subscriber OWNER TO postgres;

--
-- Name: subscriber_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscriber_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.subscriber_id_seq OWNER TO postgres;

--
-- Name: subscriber_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscriber_id_seq OWNED BY public.subscriber.id;


--
-- Name: tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tag (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.tag OWNER TO postgres;

--
-- Name: tag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tag_id_seq OWNER TO postgres;

--
-- Name: tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tag_id_seq OWNED BY public.tag.id;


--
-- Name: blog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog ALTER COLUMN id SET DEFAULT nextval('public.blog_id_seq'::regclass);


--
-- Name: book id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book ALTER COLUMN id SET DEFAULT nextval('public.book_id_seq'::regclass);


--
-- Name: genre id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genre ALTER COLUMN id SET DEFAULT nextval('public.genre_id_seq'::regclass);


--
-- Name: product id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product ALTER COLUMN id SET DEFAULT nextval('public.product_id_seq'::regclass);


--
-- Name: profile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile ALTER COLUMN id SET DEFAULT nextval('public.profile_id_seq'::regclass);


--
-- Name: subscriber id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriber ALTER COLUMN id SET DEFAULT nextval('public.subscriber_id_seq'::regclass);


--
-- Name: tag id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag ALTER COLUMN id SET DEFAULT nextval('public.tag_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
50d86400-6f30-40ee-ad5d-905cdf3d0c91	3fae4bbdf9d70867e114027c33858c27de59dc8d8bad28cee023edce28d35154	2025-08-03 01:35:49.888823+00	20250516024201_init	\N	\N	2025-08-03 01:35:49.710741+00	1
12280045-3794-4d41-8f87-aba950fc814a	5fd52cb5dc46cd20410bb367663d6ac583457594bdcb5e048e240937b71e58ad	2025-08-03 01:35:54.815385+00	20250803013554_init	\N	\N	2025-08-03 01:35:54.458501+00	1
\.


--
-- Data for Name: blog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blog (id, title, slug, author, genre_id, summary, content, cover_key, pdf_key, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: blog_tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blog_tag ("blogId", "tagId") FROM stdin;
\.


--
-- Data for Name: book; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.book (id, title, slug, author, genre_id, summary, content, cover_key, pdf_key, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: book_tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.book_tag ("bookId", "tagId") FROM stdin;
\.


--
-- Data for Name: genre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.genre (id, name) FROM stdin;
\.


--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product (id, title, slug, author, genre_id, summary, content, cover_key, pdf_key, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: product_tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_tag ("productId", "tagId") FROM stdin;
\.


--
-- Data for Name: profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profile (id, avatar_key, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subscriber; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriber (id, email, created_at) FROM stdin;
\.


--
-- Data for Name: tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tag (id, name) FROM stdin;
\.


--
-- Name: blog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.blog_id_seq', 1, false);


--
-- Name: book_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.book_id_seq', 1, false);


--
-- Name: genre_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.genre_id_seq', 1, false);


--
-- Name: product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_id_seq', 1, false);


--
-- Name: profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.profile_id_seq', 1, false);


--
-- Name: subscriber_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscriber_id_seq', 1, false);


--
-- Name: tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tag_id_seq', 1, false);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: blog blog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog
    ADD CONSTRAINT blog_pkey PRIMARY KEY (id);


--
-- Name: blog_tag blog_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_tag
    ADD CONSTRAINT blog_tag_pkey PRIMARY KEY ("blogId", "tagId");


--
-- Name: book book_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book
    ADD CONSTRAINT book_pkey PRIMARY KEY (id);


--
-- Name: book_tag book_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_tag
    ADD CONSTRAINT book_tag_pkey PRIMARY KEY ("bookId", "tagId");


--
-- Name: genre genre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genre
    ADD CONSTRAINT genre_pkey PRIMARY KEY (id);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- Name: product_tag product_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_tag
    ADD CONSTRAINT product_tag_pkey PRIMARY KEY ("productId", "tagId");


--
-- Name: profile profile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT profile_pkey PRIMARY KEY (id);


--
-- Name: subscriber subscriber_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriber
    ADD CONSTRAINT subscriber_pkey PRIMARY KEY (id);


--
-- Name: tag tag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (id);


--
-- Name: blog_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX blog_slug_key ON public.blog USING btree (slug);


--
-- Name: book_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX book_slug_key ON public.book USING btree (slug);


--
-- Name: genre_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX genre_name_key ON public.genre USING btree (name);


--
-- Name: product_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX product_slug_key ON public.product USING btree (slug);


--
-- Name: subscriber_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX subscriber_email_key ON public.subscriber USING btree (email);


--
-- Name: tag_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tag_name_key ON public.tag USING btree (name);


--
-- Name: blog blog_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog
    ADD CONSTRAINT blog_genre_id_fkey FOREIGN KEY (genre_id) REFERENCES public.genre(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: blog_tag blog_tag_blogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_tag
    ADD CONSTRAINT "blog_tag_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES public.blog(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: blog_tag blog_tag_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_tag
    ADD CONSTRAINT "blog_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public.tag(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: book book_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book
    ADD CONSTRAINT book_genre_id_fkey FOREIGN KEY (genre_id) REFERENCES public.genre(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: book_tag book_tag_bookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_tag
    ADD CONSTRAINT "book_tag_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES public.book(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: book_tag book_tag_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_tag
    ADD CONSTRAINT "book_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public.tag(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product product_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_genre_id_fkey FOREIGN KEY (genre_id) REFERENCES public.genre(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_tag product_tag_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_tag
    ADD CONSTRAINT "product_tag_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product_tag product_tag_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_tag
    ADD CONSTRAINT "product_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public.tag(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

