CREATE TABLE utilisateur (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email varchar(100) NOT NULL UNIQUE
);

INSERT INTO utilisateur(nom, email)
values
    ('mathieu','mathieu@mail.com'),
    ('alice','alice@mail.com'),
    ('thomas','thomas@mail;com')

ALTER TABLE utilisateur
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'employe',
ADD COLUMN manager_id INTEGER REFERENCES utilisateur(id),
ADD CONSTRAINT role_valide
    CHECK (role IN ('employe', 'manager', 'admin')),
ADD CONSTRAINT manager_different_utilisateur
    CHECK (manager_id <> id);

-- Mathieu devient administrateur.
UPDATE utilisateurs
SET role = 'admin'
WHERE email = 'mathieu@mail.com';

-- Alice devient manager.
UPDATE utilisateurs
SET role = 'manager'
WHERE email = 'alice@mail.com';

-- Thomas devient employé sous la responsabilité d’Alice.
UPDATE utilisateurs
SET
    role = 'employe',
    manager_id = (
        SELECT id
        FROM utilisateurs
        WHERE email = 'alice@mail.com'
    )
WHERE email = 'thomas@mail.com';