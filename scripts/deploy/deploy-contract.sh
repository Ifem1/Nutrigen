#!/usr/bin/env bash
# ============================================================
# Nutrigen Contract Deployment Script
# Target: GenLayer StudioNet
# Usage: bash scripts/deploy/deploy-contract.sh
# ============================================================

set -e

CONTRACT_PATH="contracts/src/nutrigen_contract.py"
NETWORK="studionet"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   NUTRIGEN — GenLayer Contract Deployment    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

if [ ! -f "$CONTRACT_PATH" ]; then
  echo "❌  Contract file not found: $CONTRACT_PATH"
  exit 1
fi

echo "📄  Contract : $CONTRACT_PATH"
echo "🌐  Network  : $NETWORK"
echo ""
echo "══════════════════════════════════════════════"
echo "  OPTION A — GenLayer Studio UI (Recommended)"
echo "══════════════════════════════════════════════"
echo ""
echo "  1. Open https://studio.genlayer.com"
echo "  2. Connect your wallet and select StudioNet"
echo "  3. Click 'New Contract' → paste the contents of:"
echo "     $CONTRACT_PATH"
echo "  4. Click 'Deploy' and approve the GEN token transaction"
echo "  5. Copy the deployed contract address"
echo ""
echo "══════════════════════════════════════════════"
echo "  OPTION B — GenLayer CLI"
echo "══════════════════════════════════════════════"
echo ""
echo "  genlayer deploy $CONTRACT_PATH --network $NETWORK"
echo ""
echo "══════════════════════════════════════════════"
echo "  AFTER DEPLOYMENT"
echo "══════════════════════════════════════════════"
echo ""
echo "  1. Copy the contract address from Studio or CLI output"
echo ""
echo "  2. Add to frontend/.env.local:"
echo "     NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=<your-address>"
echo "     NEXT_PUBLIC_GENLAYER_NETWORK=studionet"
echo ""
echo "  3. Add to root .env:"
echo "     GENLAYER_CONTRACT_ADDRESS=<your-address>"
echo ""
echo "  4. Run verification:"
echo "     bash scripts/deploy/verify-contract.sh <your-address>"
echo ""
