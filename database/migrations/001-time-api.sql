BEGIN;
ALTER TABLE public.contract ADD COLUMN IF NOT EXISTS weekly_hours NUMERIC(6,2) NOT NULL DEFAULT 35 CHECK (weekly_hours > 0);
ALTER TABLE public.contract ADD COLUMN IF NOT EXISTS expected_start TIME NOT NULL DEFAULT '09:00';
ALTER TABLE public.contract ADD COLUMN IF NOT EXISTS late_tolerance_minutes INTEGER NOT NULL DEFAULT 5 CHECK (late_tolerance_minutes >= 0);
ALTER TABLE public.contract ADD COLUMN IF NOT EXISTS overtime_threshold_hours NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (overtime_threshold_hours >= 0);
CREATE TABLE IF NOT EXISTS public.leave_absence (
    id_leave INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_user INTEGER NOT NULL REFERENCES public.users(id_user),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CHECK (end_date >= start_date)
);
-- Historical work_mode values remain readable through the normalization adapter.
UPDATE public.work_session SET work_mode='onsite' WHERE work_mode IS NULL;
COMMIT;
