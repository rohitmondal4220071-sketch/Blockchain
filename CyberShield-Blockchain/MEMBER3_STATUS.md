# CyberShield AI — Member 3: Blockchain & Web3
## Status: 🟡 PENDING FINAL INTEGRATION VERIFICATION

> **Completion rule:** Member 3 is marked **COMPLETED** only after all five checks below pass and their results are demonstrated with actual project files — not assumptions.

---

## Final Verification Checklist

| # | Check | What Must Be Demonstrated | Status |
|---|-------|--------------------------|--------|
| 1 | **Schema compatibility** | Blockchain hash is generated from Member 1's actual final `UnifiedThreatReport` schema | ⬜ Pending |
| 2 | **Authorization** | Only the owner or an authorized registrar can register reports. Unauthorized registration must fail with a revert | ⬜ Pending |
| 3 | **End-to-end integrity** | Register → retrieve metadata → verify — using a real backend-generated report | ⬜ Pending |
| 4 | **Transaction receipt** | A failed transaction is never reported as successfully registered | ⬜ Pending |
| 5 | **Tampering & duplicates** | Duplicate reports are rejected (HTTP 409 / contract revert). Modified reports fail verification (`verified: false`) | ⬜ Pending |

---

## What Is Needed Next

**From Member 1 (Backend):**

1. The final `UnifiedThreatReport` model/schema — all fields with their data types.
2. The backend function that generates a `UnifiedThreatReport` — source code.

> Member 1 message template:
> *"Hi, I'm Member 3 (Blockchain). To finish blockchain integration, I need: (1) the final `UnifiedThreatReport` schema/model with all fields and types, and (2) the backend function that generates it. Python `dataclass` / `pydantic BaseModel` / TypeScript `interface` — whichever you use. Without these I cannot verify that my hashing matches your actual output."*

**Once received, upload here.** No code will change before the actual schema is in hand.

---

## Current Implementation Baseline

> These files exist and are **not to be changed** until Member 1's schema is confirmed.

| File | Purpose | State |
|------|---------|-------|
| `contracts/ThreatReportRegistry.sol` | Solidity smart contract | ✅ Compiled, 16/16 tests pass |
| `scripts/deploy.js` | Deployment script | ✅ Deployed locally |
| `test/ThreatReportRegistry.test.js` | Contract tests | ✅ 16/16 passing |
| `test/hash_consistency.mjs` | Python ↔ TypeScript cross-language test | ✅ Bit-exact match confirmed |
| `python/report_hash.py` | Hashing — assumed schema | 🟡 Assumed schema, needs Member 1 confirmation |
| `python/blockchain_service.py` | Web3.py register/verify | 🟡 Needs receipt validation fix |
| `lib/blockchain/threatReport.ts` | TS schema + normalizer | 🟡 Assumed schema, needs Member 1 confirmation |
| `app/api/blockchain/route.ts` | Next.js API route v2 | 🟡 Assumed schema, pending schema lock |

---

## Work Plan — After Member 1's Schema Arrives

```
Step 1 — Schema compatibility
  Compare Member 1's fields with current lib/blockchain/threatReport.ts
  Update normalize functions in Python + TypeScript to match exactly
  Re-run hash_consistency.mjs to confirm match

Step 2 — Authorization (Solidity)
  Add authorized registrar mapping to ThreatReportRegistry.sol
  Add setRegistrar() owner-only function
  Write test: unauthorized account → must revert
  Redeploy contract

Step 3 — Transaction receipt validation (Python)
  Update blockchain_service.py to check receipt.status == 1
  Write test: simulate revert → must not return "registered"

Step 4 — End-to-end test
  Use Member 1's actual backend-generated report
  Register → retrieve via getReport() → verify hash matches
  Document tx_hash + block_number + report_id

Step 5 — Tampering & duplicate tests
  Duplicate: same report → HTTP 409 / contract revert ✅ (already passes)
  Modified: change one field → verified: false ✅ (already passes)
  Document both results with actual hashes
```

---

## Deployed Contract (Local — Do Not Change)

```
Address  : 0x5FbDB2315678afecb367f032d93F642f64180aa3
Network  : Hardhat local (chainId: 31337)
Namespace: CYBERSHIELD_REPORT_V1
```

---

## Cross-Language Hash — Current Baseline (Assumed Schema)

> These values are for the assumed `SAMPLE_REPORT` only.
> They will change once the real schema is locked.

```
Report Hash : 0xd5469a33795e145ad89bc2e577d20545f0e5b6e72b49b7419c78ef4f630970f7
Report ID   : 0x56ab21e4ee1c49b609e04024f8c9062afb6e1fb126101bac1a64858ade9c6ca9
Python ↔ TypeScript : ✅ MATCH (on assumed schema)
```

---

## Completion Criteria — Final Report Will Include

- [ ] Member 1's schema used verbatim — field-by-field comparison documented
- [ ] Unauthorized registration test: account not in `authorizedRegistrars` → `require()` revert
- [ ] End-to-end: real report → `tx_hash`, `block_number`, `report_id` all recorded
- [ ] Receipt validation: `receipt.status === 1` enforced in Python service
- [ ] Duplicate: HTTP 409 with actual report hash
- [ ] Tampered: `verified: false` with actual report + one modified field

**🟡 Status remains PENDING until all six boxes above are checked.**
