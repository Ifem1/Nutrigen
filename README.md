# Nutrigen — AI-Powered Livestock Feed Optimization on GenLayer

Nutrigen is a decentralized livestock feed optimization platform built on [GenLayer](https://genlayer.com). It uses GenLayer's Intelligent Contract system to run AI-driven feed ration evaluations directly on-chain, producing tamper-proof verdicts that farmers and feed advisors can trust and act on.

---

## What It Does

Livestock farmers submit a proposed feed ration — including ingredients, nutrient analysis, cost constraints, and production goals — and Nutrigen's on-chain AI evaluates whether that ration is nutritionally adequate, safe, cost-efficient, and aligned with the animal's production stage. The verdict is recorded permanently on-chain.

**Core flow:**

1. **Register Farm** — farmer creates a farm profile on-chain
2. **Register Livestock Batch** — species, breed, production stage, head count, health status
3. **Register Feed Ingredients** — nutrient profiles, safety summaries, cost and availability data
4. **Publish Feed Standard** — nutritional targets, ingredient limits, toxin rules, escalation rules
5. **Register Feed Advisor** — credentialed nutritionist linked to the farm
6. **Submit Optimization Request** — candidate ration + context submitted to the Intelligent Contract
7. **AI Consensus** — GenLayer validators evaluate the ration and reach consensus on a verdict
8. **Act on Verdict** — APPROVED plans can be activated; NEEDS_REVIEW triggers human escalation

---

## How It Works with GenLayer

GenLayer is a blockchain that natively executes AI operations as part of smart contract logic. Nutrigen uses this capability to run feed optimization reviews without any trusted third party.

### Intelligent Contract

The core logic lives in `contracts/src/Nutrigen.py` — a Python Intelligent Contract deployed on GenLayer StudioNet (Chain ID: 61999).

When a farmer calls `submit_and_optimize_feed`, the contract:

1. Loads the farm, batch, advisor, feed standards, and ingredient data from on-chain state
2. Builds a context packet from all that data
3. Calls `gl.eq_principle.prompt_non_comparative()` — GenLayer's non-comparative consensus primitive

### Non-Comparative Consensus

```python
consensus_json = gl.eq_principle.prompt_non_comparative(
    lambda: context,         # input data (deterministic, same on all nodes)
    task="...",              # what the leader's AI should do
    criteria="...",          # what validators check against the leader's output
)
```

**How validators work:**
- The **leader validator** receives the context, runs the AI task, and produces a feed verdict (APPROVED / REJECTED / NEEDS_REVIEW / NEEDS_REVISION)
- **Other validators** receive the same context and the leader's output, then use the criteria to judge whether the verdict is reasonable — they do NOT generate their own verdict
- This eliminates the "UNDETERMINED" consensus failure that occurs when multiple validators independently generate different AI outputs

This approach is correct for open-ended AI tasks where multiple valid answers exist but validators can still assess quality against defined criteria.

### Verdict Outcomes

| Verdict | Meaning |
|---|---|
| `APPROVED` | Ration is nutritionally adequate, safe, and feasible |
| `NEEDS_REVISION` | Fixable issues — nutrient gaps, cost overrun, minor safety concerns |
| `NEEDS_REVIEW` | Uncertain — requires human expert review |
| `REJECTED` | Ration is unsafe or clearly inadequate for the stated livestock |

### Human Review & Activation

- `NEEDS_REVIEW` verdicts are escalated to a registered human reviewer who submits a final decision on-chain via `human_feed_review_decision`
- `APPROVED` or `HUMAN_APPROVED` plans are activated via `mark_feed_plan_activated`, creating a permanent on-chain activation record
- Every action is recorded in an immutable audit log

---

## Tech Stack

| Layer | Technology |
|---|---|
| Intelligent Contract | Python on GenLayer StudioNet (Chain ID: 61999) |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Auth & Database | Supabase (Email/Password auth, PostgreSQL mirror) |
| Blockchain SDK | genlayer-js |
| Deployment | Vercel |
| Wallet | Auto-generated EOA wallet stored in localStorage |

---

## Contract

- **Network:** GenLayer StudioNet
- **Chain ID:** 61999
- **Address:** `0x6e751Ed604aBF56b66281152F5623FE5ccbb7D12`
- **Explorer:** [explorer-studio.genlayer.com](https://explorer-studio.genlayer.com)

---

## Project Structure

```
Nutrigen/
├── contracts/
│   └── src/
│       └── Nutrigen.py          # GenLayer Intelligent Contract
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (app)/           # Protected app pages
    │   │   │   ├── farms/       # Farm registration
    │   │   │   ├── batches/     # Livestock batch management
    │   │   │   ├── ingredients/ # Feed ingredient registry
    │   │   │   ├── feed-standards/  # Feed standard versions
    │   │   │   ├── advisors/    # Feed advisor registry
    │   │   │   ├── optimizer/   # Submit optimization request
    │   │   │   ├── results/     # View AI verdict
    │   │   │   ├── escalations/ # Human review queue
    │   │   │   ├── history/     # Request history
    │   │   │   └── audit/       # Audit trail
    │   │   ├── (auth)/          # Auth pages (login, signup)
    │   │   └── api/             # Server-side API routes
    │   └── lib/
    │       ├── genlayer/        # GenLayer client, contract wrapper
    │       ├── nutrigen/        # Feed packet builder, hash utils
    │       └── supabase/        # Supabase client
    └── ...
```

---

## Local Development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [GenLayer Studio](https://studio.genlayer.com) account

### Setup

```bash
git clone https://github.com/Ifem1/Nutrigen.git
cd Nutrigen/frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER_URL=https://explorer-studio.genlayer.com
NEXT_PUBLIC_GENLAYER_NETWORK=studionet
NEXT_PUBLIC_NUTRIGEN_CONTRACT_ADDRESS=0x6e751Ed604aBF56b66281152F5623FE5ccbb7D12
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploying the Contract

1. Go to [studio.genlayer.com](https://studio.genlayer.com)
2. Upload `contracts/src/Nutrigen.py`
3. Deploy to StudioNet
4. Copy the contract address and update `NEXT_PUBLIC_NUTRIGEN_CONTRACT_ADDRESS`

---

## Submission Description

**Nutrigen** brings AI-powered livestock feed optimization on-chain using GenLayer's Intelligent Contract system.

The platform lets farmers register their farms, livestock batches, feed ingredients, and nutritional standards on GenLayer StudioNet. When a farmer submits a candidate feed ration, the Intelligent Contract uses `gl.eq_principle.prompt_non_comparative` — GenLayer's non-comparative consensus primitive — to evaluate the ration against registered standards and ingredient data.

The leader validator runs an AI evaluation to produce a structured verdict (APPROVED, NEEDS_REVISION, NEEDS_REVIEW, or REJECTED) with nutritional scores, risk assessments, and feeding recommendations. Other validators verify the leader's verdict against defined criteria without independently generating their own — eliminating the consensus failures that arise from open-ended AI outputs. The final verdict is stored permanently on-chain, creating an immutable audit trail of every feed decision.

The result is a trustless, verifiable feed advisory system where no single party controls the outcome — the AI consensus is the judge, and the blockchain is the record.

**Stack:** GenLayer Intelligent Contract (Python) · Next.js · Supabase · genlayer-js · Vercel
