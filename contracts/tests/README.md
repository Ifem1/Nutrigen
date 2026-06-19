# Nutrigen Contract Tests

## Running tests

### Against GenLayer Studio simulator (recommended for integration tests)
```bash
# Start GenLayer Studio locally first, then:
genlayer test contracts/tests/test_nutrigen_contract.py -v

# Or run a specific test class:
genlayer test contracts/tests/test_nutrigen_contract.py::TestEvaluateFeedProposal -v
```

### Without GenLayer Studio (local stub mode — CI-safe)
```bash
pip install pytest
pytest contracts/tests/ -v
```

When `genlayer.testing` is not installed, `conftest.py` falls back to a local
Python stub that mirrors the contract's state logic. All structural tests and
validation tests pass in this mode. The non-deterministic LLM evaluation tests
(TestEvaluateFeedProposal) return a fixed mock result.

## Test structure

| Class | What it tests |
|---|---|
| `TestContractDeployment` | Initial state after deploy |
| `TestSubmitOptimizationRequest` | Request storage and counter increment |
| `TestEvaluateFeedProposal` | Consensus evaluation flow and result shape |
| `TestRecordConsensusOutcome` | Finalization and status updates |
| `TestCattleEvaluation` | Beef cattle-specific scenario |
| `TestSwineEvaluation` | Swine-specific scenario |
| `TestOrgStatsAggregation` | Multi-request aggregate stats |
