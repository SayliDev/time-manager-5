BEGIN;

ALTER TABLE public.users
    ADD COLUMN contract_hours INTEGER NOT NULL DEFAULT 35
    CONSTRAINT users_contract_hours_check CHECK (contract_hours IN (35, 20, 30, 25));

-- Match the contract allocation in the demo seed; other accounts keep 35 hours.
WITH demo_contracts AS (
    SELECT email, (ARRAY[35, 20, 30, 25])[1 + (ordinality::integer - 1) % 4] AS hours
    FROM unnest(ARRAY[
        'alexandre.martin.demo@example.com',
        'alice.bernard.demo@example.com',
        'karim.dubois.demo@example.com',
        'emma.petit.demo@example.com',
        'lucas.robert.demo@example.com',
        'chloe.richard.demo@example.com',
        'hugo.durand.demo@example.com',
        'lea.moreau.demo@example.com',
        'nathan.simon.demo@example.com',
        'sarah.laurent.demo@example.com'
    ]) WITH ORDINALITY AS demo(email, ordinality)
)
UPDATE public.users AS u
SET contract_hours = demo.hours
FROM demo_contracts AS demo
WHERE u.email = demo.email;

COMMIT;
