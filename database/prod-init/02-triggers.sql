BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE audit_log (
    id_audit BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_cible TEXT NOT NULL,
    action TEXT NOT NULL,
    ancienne_valeur JSONB,
    nouvelle_valeur JSONB,
    utilisateur_session TEXT NOT NULL,
    empreinte TEXT NOT NULL UNIQUE,
    cree_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_hash TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_hash := encode(digest(
            TG_TABLE_NAME || TG_OP || to_jsonb(NEW)::text,
            'sha256'
        ), 'hex');
        INSERT INTO audit_log (
            table_cible, action, nouvelle_valeur,
            utilisateur_session, empreinte
        )
        VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(NEW), CURRENT_USER, v_hash)
        ON CONFLICT DO NOTHING;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF to_jsonb(OLD) = to_jsonb(NEW) THEN
            RETURN NEW;
        END IF;
        v_hash := encode(digest(
            TG_TABLE_NAME || TG_OP || to_jsonb(OLD)::text || to_jsonb(NEW)::text,
            'sha256'
        ), 'hex');
        INSERT INTO audit_log (
            table_cible, action, ancienne_valeur, nouvelle_valeur,
            utilisateur_session, empreinte
        )
        VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(OLD), to_jsonb(NEW), CURRENT_USER, v_hash)
        ON CONFLICT DO NOTHING;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_hash := encode(digest(
            TG_TABLE_NAME || TG_OP || to_jsonb(OLD)::text,
            'sha256'
        ), 'hex');
        INSERT INTO audit_log (
            table_cible, action, ancienne_valeur,
            utilisateur_session, empreinte
        )
        VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(OLD), CURRENT_USER, v_hash)
        ON CONFLICT DO NOTHING;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'utilisateur', 'departement', 'equipe', 'affectation_equipe',
        'contrat', 'session_travail', 'correction_pointage'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON %I', table_name, table_name);
        EXECUTE format(
            'CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I
             FOR EACH ROW EXECUTE FUNCTION audit_trigger_function()',
            table_name,
            table_name
        );
    END LOOP;
END;
$$;

COMMIT;