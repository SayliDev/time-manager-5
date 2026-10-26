BEGIN;

CREATE TABLE public.users (
    id_user INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    passeword_last_changed TIMESTAMPTZ,
    role VARCHAR(50),
    phone VARCHAR(50),
    creat_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    desactive_at TIMESTAMPTZ
);

CREATE TABLE public.work_session (
    id_work_session INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    creat_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_user INTEGER NOT NULL REFERENCES public.users(id_user),

    CHECK (end_at IS NULL OR end_at >= start_at)
);

CREATE TABLE public.leave_request (
    id_leave_request INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_user INTEGER NOT NULL REFERENCES public.users(id_user),
    start_at TIMESTAMPTZ NOT NULL,
    return_at TIMESTAMPTZ NOT NULL,
    leave_type VARCHAR(20) NOT NULL DEFAULT 'conge',
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    processed_by INTEGER REFERENCES public.users(id_user),
    processed_at TIMESTAMPTZ,
    decision_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (return_at > start_at),
    CHECK (leave_type IN ('conge', 'maladie', 'rtt')),
    CHECK (status IN ('pending', 'approved', 'rejected')),
    CHECK (
        (status = 'pending' AND processed_by IS NULL AND processed_at IS NULL)
        OR status IN ('approved', 'rejected')
    )
);

CREATE INDEX leave_request_user_dates_idx
    ON public.leave_request (id_user, start_at, return_at);

CREATE TABLE public.microft_log(
    token_microsoft TEXT PRIMARY KEY,
    mail_microsoft VARCHAR(50) NOT NULL,
    id_user INTEGER NOT NULL REFERENCES public.users(id_user)
);

CREATE TABLE public.departement (
    id_departement INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TYPE public.team_name_enum AS ENUM (
    'Ressources humaines',
    'Finance',
    'IT & Produit',
    'Opérations'
);

CREATE TABLE public.team (
    id_team INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name public.team_name_enum NOT NULL,
    description TEXT
);

CREATE TABLE public.team_department (
    id_team INTEGER NOT NULL REFERENCES public.team(id_team),
    id_departement INTEGER NOT NULL REFERENCES public.departement(id_departement),
    start_at DATE NOT NULL DEFAULT CURRENT_DATE,
    end_at DATE,
    PRIMARY KEY (id_team, id_departement, start_at),
    CHECK (end_at IS NULL OR end_at >= start_at)
);

CREATE TABLE public.team_allocation (
    id_team_allocation INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    start_at DATE NOT NULL,
    end_at DATE,
    id_user INTEGER NOT NULL REFERENCES public.users(id_user),
    id_team INTEGER NOT NULL REFERENCES public.team(id_team),

    CHECK (end_at IS NULL OR end_at >= start_at)
);

CREATE TABLE public.contract (
    id_contract INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    contract_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    id_user INTEGER NOT NULL REFERENCES public.users(id_user),

    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE public.timekeeping_correction (
    id_timekeeping_correction INTEGER
        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    start_asked TIMESTAMPTZ,
    end_asked TIMESTAMPTZ,
    motif TEXT,
    status VARCHAR(50),
    process_by INTEGER REFERENCES public.users(id_user),
    id_work_session INTEGER
        REFERENCES public.work_session(id_work_session),

    CHECK (
        end_asked IS NULL
        OR start_asked IS NULL
        OR end_asked >= start_asked
    )
);

COMMIT;
