BEGIN;

CREATE TABLE utilisateur (
    id_utilisateur INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    prenom VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    role VARCHAR(50),
    telephone VARCHAR(50),
    cree_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    desactive_at TIMESTAMPTZ
);

CREATE TABLE session_travail (
    id_session_travail INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    debut_at TIMESTAMPTZ NOT NULL,
    fin_at TIMESTAMPTZ,
    annulee_at TIMESTAMPTZ,
    cree_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_utilisateur INTEGER NOT NULL,

    FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur),

    CHECK (fin_at IS NULL OR fin_at >= debut_at)
);

CREATE TABLE departement (
    id_depatement INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom VARCHAR(50)
);

CREATE TABLE equipe (
    id_equipe INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    description TEXT,
    id_utilisateur INTEGER NOT NULL,
    id_depatement INTEGER NOT NULL,

    FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur),

    FOREIGN KEY (id_depatement)
        REFERENCES depatement(id_depatement)
);

CREATE TABLE affectation_equipe (
    id_affectation_equipe INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    debut_at DATE NOT NULL,
    fin_at DATE,
    id_utilisateur INTEGER NOT NULL,
    id_equipe INTEGER NOT NULL,

    FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur),

    FOREIGN KEY (id_equipe)
        REFERENCES equipe(id_equipe),

    CHECK (fin_at IS NULL OR fin_at >= debut_at)
);

CREATE TABLE contrat (
    id_contrat INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type_contrat VARCHAR(50),
    date_debut DATE NOT NULL,
    date_fin DATE,
    id_utilisateur INTEGER NOT NULL,

    FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur),

    CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

CREATE TABLE correction_pointage (
    id_correction_pointage INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    debut_propose TIMESTAMPTZ,
    fin_propose TIMESTAMPTZ,
    motif TEXT,
    statut VARCHAR(50),
    traite_par INTEGER,
    id_session_travail INTEGER,

    FOREIGN KEY (traite_par)
        REFERENCES utilisateur(id_utilisateur),

    FOREIGN KEY (id_session_travail)
        REFERENCES session_travail(id_session_travail),

    CHECK (
        fin_propose IS NULL
        OR debut_propose IS NULL
        OR fin_propose >= debut_propose
    )
);

COMMIT;