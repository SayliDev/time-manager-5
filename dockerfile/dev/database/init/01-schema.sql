-- Schema compatible PostgreSQL 18. Conserve le nom historique 'depatement'.
BEGIN;

CREATE TABLE users (
    id_user INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    role VARCHAR(50),
    phone VARCHAR(50),
    creat_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    desactive_at TIMESTAMPTZ
);

CREATE TABLE work_session (
    id_work_session INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    creat_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_user INTEGER NOT NULL REFERENCES users(id_user),
    CHECK (end_at IS NULL OR end_at >= start_at)
);

CREATE TABLE departement (
    id_departement INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE team (
    id_team INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    id_user INTEGER NOT NULL REFERENCES users(id_user),
    id_departement INTEGER NOT NULL REFERENCES departement(id_departement)
);

CREATE TABLE team_allocation (
    id_team_allocation INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    start_at DATE NOT NULL,
    end_at DATE,
    id_user INTEGER NOT NULL REFERENCES users(id_user),
    id_team INTEGER NOT NULL REFERENCES team(id_team),
    CHECK (end_at IS NULL OR end_at >= start_at)
);

CREATE TABLE contract (
    id_contract INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    contract_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    id_user INTEGER NOT NULL REFERENCES users(id_user),
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE timekeeping_correction (
    id_timekeeping_correction INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    start_asked TIMESTAMPTZ,
    end_asked TIMESTAMPTZ,
    motif TEXT,
    status VARCHAR(50),
    process_by INTEGER REFERENCES users(id_user),
    id_work_session INTEGER REFERENCES work_session(id_work_session),
    CHECK (end_asked IS NULL OR start_asked IS NULL OR end_asked >= start_asked)
);

COMMIT;
