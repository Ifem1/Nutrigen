#!/bin/bash
# Nutrigen Project Setup Script
#
# Usage:
#   chmod +x scripts/setup/setup-project.sh
#   ./scripts/setup/setup-project.sh

set -e

echo "=========================================="
echo "  Nutrigen Project Setup"
echo "=========================================="

# 1. Frontend setup
echo ""
echo "[1/4] Installing frontend dependencies..."
cd frontend
npm install
cd ..

# 2. Environment files
echo ""
echo "[2/4] Setting up environment files..."
if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.example frontend/.env.local
  echo "  Created frontend/.env.local — fill in your Supabase credentials"
else
  echo "  frontend/.env.local already exists, skipping"
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "  Created .env — fill in your credentials"
else
  echo "  .env already exists, skipping"
fi

# 3. Supabase CLI check
echo ""
echo "[3/4] Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
  echo "  Supabase CLI found: $(supabase --version)"
else
  echo "  Supabase CLI not found. Install it:"
  echo "    npm install -g supabase"
  echo "    OR"
  echo "    brew install supabase/tap/supabase"
fi

# 4. Python check (for contract development)
echo ""
echo "[4/4] Checking Python..."
if command -v python3 &> /dev/null; then
  echo "  Python found: $(python3 --version)"
else
  echo "  Python 3 not found. Required for contract development."
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Create a Supabase project at https://supabase.com"
echo "  2. Copy your project URL and anon key to frontend/.env.local"
echo "  3. Run database migration:"
echo "     supabase link --project-ref <your-project-ref>"
echo "     supabase db push"
echo "  4. Start the dev server:"
echo "     cd frontend && npm run dev"
echo ""
