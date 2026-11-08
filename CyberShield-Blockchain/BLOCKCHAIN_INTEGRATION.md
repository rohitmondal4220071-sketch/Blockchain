# CyberShield AI — Blockchain Integration v2

> **Member 3 Scope: Blockchain & Web3 Development**
> Status: Integration v2 complete — CyberShield `UnifiedThreatReport` schema implemented and cross-language hash consistency confirmed.

---

## ✅ Cross-Language Hash Consistency — Confirmed

The same `SAMPLE_REPORT` was hashed independently in **Python** and **TypeScript**.
Both must produce bit-exact identical output for the blockchain integration to be trustworthy.

```
Report Hash : 0xd5469a33795e145ad89bc2e577d20545f0e5b6e72b49b7419c78ef4f630970f7
Report ID   : 0x56ab21e4ee1c49b609e04024f8c9062afb6e1fb126101bac1a64858ade9c6ca9

Python     ↔ TypeScript hash : ✅ MATCH
Python     ↔ TypeScript ID   : ✅ MATCH
```

---

## 📊 Current Status Table

| Component | Before v2 | After v2 |
|-----------|-----------|----------|
| Solidity contract compilation | ✅ | ✅ Unchanged |
| 16 contract tests | ✅ Passing | ✅ Still passing |
| Persistent Hardhat node & deployment | ✅ | ✅ Unchanged |
| Ethers.js integration | ✅ | ✅ Unchanged |
| Register endpoint | ✅ | ✅ |
| Verify endpoint | ✅ | ✅ |
| Duplicate rejection (HTTP 409) | ✅ | ✅ |
| Lookup endpoint | ✅ | ✅ |
| **Report schema** | ❌ MediScan AI types | ✅ **CyberShield `UnifiedThreatReport`** |
| **Python–TypeScript hash consistency** | ❌ Not verified | ✅ **Bit-exact match confirmed** |
| **Input validation** | ❌ None | ✅ **10 required fields checked** |
| TypeScript type-check (`tsconfig`) | ⚠️ Errors | ✅ **Zero errors** |
| Production wallet security | ⚠️ | ⚠️ env-based — testnet needs separate key |
| Authorized registration (Solidity) | ⬜ Pending | ⬜ Pending |
| End-to-end test with real report | ⬜ Pending | ⬜ Pending |

---

## 📁 File Manifest

```
e:\1st Project\Medi\Medi\
│
├── lib\blockchain\
│   └── threatReport.ts              ← UnifiedThreatReport interface + normalizer
│
├── app\api\blockchain\
│   └── route.ts                     ← Next.js API route v2 (CyberShield schema)
│
└── CyberShield-Blockchain\
    ├── contracts\
    │   └── ThreatReportRegistry.sol ← Solidity smart contract
    ├── scripts\
    │   └── deploy.js                ← Deployment script
    ├── test\
    │   ├── ThreatReportRegistry.test.js  ← 16 Hardhat/Mocha tests
    │   └── hash_consistency.mjs     ← Python ↔ TypeScript cross-language test
    ├── python\
    │   ├── report_hash.py           ← v2 hashing with UnifiedThreatReport
    │   ├── blockchain_service.py    ← Web3.py register/verify service
    │   └── requirements.txt
    ├── hardhat.config.js
    ├── package.json
    └── deployment.json              ← Auto-generated: contract address
```

---

## 🧩 UnifiedThreatReport Schema (v1.0)

Defined in [`lib/blockchain/threatReport.ts`](file:///e:/1st%20Project/Medi/Medi/lib/blockchain/threatReport.ts).
Implemented identically in [`python/report_hash.py`](file:///e:/1st%20Project/Medi/Medi/CyberShield-Blockchain/python/report_hash.py).

```typescript
interface UnifiedThreatReport {
  // ── Identity ──────────────────────────────────────
  report_id:        string;   // "CSR-20261107-00042"
  schema_version:   "1.0";

  // ── Timestamps (ISO 8601 UTC) ──────────────────────
  detected_at:      string;   // "2026-11-07T10:00:00.000Z"
  generated_at:     string;

  // ── Classification ────────────────────────────────
  severity:         "critical" | "high" | "medium" | "low" | "info";
  category:         "malware" | "phishing" | "ransomware" | "ddos"
                  | "data_exfiltration" | "insider_threat" | "brute_force"
                  | "sql_injection" | "xss" | "zero_day"
                  | "social_engineering" | "supply_chain"
                  | "credential_theft" | "network_intrusion" | "other";
  status:           "detected" | "investigating" | "contained"
                  | "remediated" | "false_positive";
  confidence_score: number;   // 0–100

  // ── Textual ───────────────────────────────────────
  summary:          string;
  description:      string;

  // ── Evidence (sorted before hashing) ─────────────
  indicators:       { ioc_type: string; value: string }[];
  affected_assets:  { asset_type: string; identifier: string }[];
  remediation_steps: { priority: number; action: string }[];

  // ── Attribution ───────────────────────────────────
  mitre_techniques: string[];   // e.g. ["T1566", "T1078"]
  threat_actor:     string;     // "" if unknown
}
```

> [!IMPORTANT]
> `indicators`, `affected_assets`, `remediation_steps`, and `mitre_techniques` are **always sorted** before hashing. This ensures the same report content always produces the same hash regardless of field insertion order.

> [!CAUTION]
> **Never include** in a report before hashing: raw IP addresses, user passwords, API keys, authentication tokens, or any PII. The schema deliberately omits these fields.

---

## 🔄 Hashing Pipeline

The same pipeline runs in Python, TypeScript, and is mirrored by the Solidity contract.

```
UnifiedThreatReport (raw)
        │
        ▼
  normalizeThreatReport()         ← strip unknown fields, sort arrays
        │
        ▼
  canonicalize()                  ← sorted keys, no whitespace, recursive
        │                            identical in Python (json.dumps sort_keys=True)
        ▼
  keccak256(UTF-8 bytes)          ← Report Hash  H
        │
        ▼
  keccak256(NAMESPACE_bytes ‖ H)  ← Report ID
```

**Namespace** (must match across all three layers):
```
CYBERSHIELD_REPORT_V1
```

---

## 🌐 API Endpoints

Base: `POST /api/blockchain` or `GET /api/blockchain`

### GET — Status

```http
GET /api/blockchain?action=status
```

```json
{
  "connected": true,
  "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "report_count": 3,
  "network": "hardhat",
  "schema_version": "1.0"
}
```

### GET — Lookup

```http
GET /api/blockchain?action=lookup&report_id=0x56ab21e4...
```

```json
{
  "report_id":     "0x56ab21e4...",
  "report_hash":   "0xd5469a33...",
  "registered_by": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "registered_at": 1731006313
}
```

### POST — Register

```http
POST /api/blockchain
Content-Type: application/json

{
  "action": "register",
  "report": { ...UnifiedThreatReport... }
}
```

**Success (200):**
```json
{
  "status":       "registered",
  "report_hash":  "0xd5469a33795e145ad89bc2e577d20545f0e5b6e72b49b7419c78ef4f630970f7",
  "report_id":    "0x56ab21e4ee1c49b609e04024f8c9062afb6e1fb126101bac1a64858ade9c6ca9",
  "tx_hash":      "0xa37351f7...",
  "block_number": 2
}
```

**Duplicate (409):**
```json
{
  "error":       "Report already registered",
  "report_hash": "0xd5469a33...",
  "report_id":   "0x56ab21e4..."
}
```

### POST — Verify

```http
POST /api/blockchain
Content-Type: application/json

{
  "action": "verify",
  "report": { ...same UnifiedThreatReport... }
}
```

```json
{
  "report_hash": "0xd5469a33...",
  "report_id":   "0x56ab21e4...",
  "verified":    true
}
```

---

## ⚙️ Environment Variables (`.env.local`)

```env
# Blockchain (CyberShield AI — Member 3)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BLOCKCHAIN_NETWORK=hardhat
```

> [!CAUTION]
> The private key above is **Hardhat account #0** — public knowledge, safe for local development only. For Sepolia testnet, generate a new wallet and fund it from a faucet.

---

## 🧪 Test Results

### Hardhat contract tests — 16 / 16 ✅

```
ThreatReportRegistry
  registerReport
    ✔ Should register a new report and emit event
    ✔ Should increment reportCount after registration
    ✔ Should reject a zero hash
    ✔ Should reject duplicate report hashes
    ✔ Should allow different reports from different accounts
    ✔ Should store the correct registrant address
  verifyReport
    ✔ Should verify the original report as true
    ✔ Should reject a modified report hash
    ✔ Should return false for an unregistered report
    ✔ Should return false for mismatched ID and hash
  generateReportId
    ✔ Should produce deterministic IDs
    ✔ Should produce different IDs for different hashes
  getReport
    ✔ Should return correct metadata for a registered report
    ✔ Should revert for a non-existent report
  Edge cases
    ✔ Should handle multiple sequential registrations
    ✔ Should set hashExists correctly

16 passing (1s)
```

### Cross-language hash consistency — ✅

```
TypeScript Report Hash : 0xd5469a33795e145ad89bc2e577d20545f0e5b6e72b49b7419c78ef4f630970f7
Python     Report Hash : 0xd5469a33795e145ad89bc2e577d20545f0e5b6e72b49b7419c78ef4f630970f7
Hash match             : ✅ MATCH

TypeScript Report ID   : 0x56ab21e4ee1c49b609e04024f8c9062afb6e1fb126101bac1a64858ade9c6ca9
Python     Report ID   : 0x56ab21e4ee1c49b609e04024f8c9062afb6e1fb126101bac1a64858ade9c6ca9
ID match               : ✅ MATCH
```

### Live endpoint tests (Next.js + Hardhat node) — ✅

```
GET  /api/blockchain?action=status    → 200 connected: true
POST register (UnifiedThreatReport)   → 200 status: "registered"
POST verify   (same report)           → 200 verified: true
POST register (duplicate)             → 409 "Report already registered"
```

---

## 🗺️ Remaining Roadmap

```
✅ Phase 1 — Smart Contract Development
✅ Phase 2 — Hardhat Testing (16/16)
✅ Phase 3 — Local Deployment
✅ Phase 4a — Python hashing (UnifiedThreatReport)
✅ Phase 4b — TypeScript API route v2 (UnifiedThreatReport)
✅ Phase 4c — Cross-language hash consistency proof

⬜ Phase 4d — Python Web3 service: transaction receipt validation
⬜ Phase 4e — Solidity: authorized registration (owner-only wallet)
⬜ Phase 4f — End-to-end test: Register → Lookup → Verify (real report)

⬜ Phase 5  — Testnet Deployment (Sepolia / Polygon Amoy)
              1. Generate new wallet (never reuse Hardhat #0)
              2. Fund from faucet
              3. Set SEPOLIA_RPC_URL + DEPLOYER_PRIVATE_KEY in .env.local
              4. Uncomment sepolia block in hardhat.config.js
              5. npx hardhat run scripts/deploy.js --network sepolia
              6. npx hardhat verify --network sepolia <ADDRESS>
```

---

## 🛠️ Commands Reference

```bash
# From CyberShield-Blockchain/

# Compile contract
npx hardhat compile

# Run all 16 tests
npx hardhat test

# Cross-language hash consistency test
node test/hash_consistency.mjs

# Start persistent local node (Terminal 1)
npx hardhat node

# Deploy to persistent node (Terminal 2)
npx hardhat run scripts/deploy.js --network localhost

# Python hash demo
cd python && python report_hash.py
```

---

## 🔐 Security Properties

| Property | Mechanism |
|----------|-----------|
| No sensitive data on-chain | Only `bytes32` hash stored — never report contents |
| Duplicate prevention | `hashExists` mapping + `require(!hashExists[hash])` |
| Tamper detection | `verifyReport()` triple-check: record exists + hash matches + ID derivation matches |
| Determinism | Canonical JSON (sorted keys, no whitespace) + fixed namespace prefix |
| Cross-layer consistency | Python ↔ TypeScript ↔ Solidity produce identical hashes — **verified** |
| Input validation | 10 required fields + schema version + confidence score range checked before any chain call |
