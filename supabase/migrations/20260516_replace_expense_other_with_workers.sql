-- Replace legacy expense categories ('other', 'depreciation', 'garage') with 'workers'
-- and tighten the CHECK constraint to the current set used in the UI.

ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;

UPDATE expenses SET category = 'workers' WHERE category IN ('other', 'depreciation', 'garage');

ALTER TABLE expenses ADD CONSTRAINT expenses_category_check
  CHECK (category IN ('fuel', 'marketing', 'workers'));
