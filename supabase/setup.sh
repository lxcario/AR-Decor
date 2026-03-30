#!/usr/bin/env sh
set -eu

echo "Step 1: Apply supabase/schema.sql in the Supabase SQL Editor or with psql against your project database."
echo "Step 2: Apply supabase/seed.sql in the same way."
echo "Step 3: Create the public ar-models bucket by running this SQL:"
cat <<'SQL'
INSERT INTO storage.buckets (id, name, public)
VALUES ('ar-models', 'ar-models', true)
ON CONFLICT (id) DO NOTHING;
SQL