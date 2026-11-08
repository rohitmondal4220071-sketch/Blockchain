/**
 * Cross-language hash consistency test
 * Run: node --experimental-vm-modules test/hash_consistency.mjs
 * 
 * Python expected:
 *   Report Hash : 0xd5469a33795e145ad89bc2e577d20545f0e5b6e72b49b7419c78ef4f630970f7
 *   Report ID   : 0x56ab21e4ee1c49b609e04024f8c9062afb6e1fb126101bac1a64858ade9c6ca9
 */

import { ethers } from "ethers";

const NAMESPACE = "CYBERSHIELD_REPORT_V1";

// ── canonicalize (identical to route.ts) ──────────────────────────
function canonicalize(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string")  return JSON.stringify(value);
  if (Array.isArray(value))       return "[" + value.map(canonicalize).join(",") + "]";
  if (typeof value === "object") {
    const keys  = Object.keys(value).sort();
    const pairs = keys.map(k => `${JSON.stringify(k)}:${canonicalize(value[k])}`);
    return "{" + pairs.join(",") + "}";
  }
  return JSON.stringify(value);
}

// ── normalize (identical to threatReport.ts) ─────────────────────
function normalizeThreatReport(raw) {
  const indicators = (raw.indicators ?? [])
    .map(ioc => ({ ioc_type: String(ioc.ioc_type ?? ""), value: String(ioc.value ?? "") }))
    .sort((a, b) => a.ioc_type.localeCompare(b.ioc_type) || a.value.localeCompare(b.value));

  const affected_assets = (raw.affected_assets ?? [])
    .map(a => ({ asset_type: String(a.asset_type ?? ""), identifier: String(a.identifier ?? "") }))
    .sort((a, b) => a.asset_type.localeCompare(b.asset_type) || a.identifier.localeCompare(b.identifier));

  const remediation_steps = (raw.remediation_steps ?? [])
    .map(s => ({ action: String(s.action ?? ""), priority: Number(s.priority ?? 0) }))
    .sort((a, b) => a.priority - b.priority);

  const mitre_techniques = [...(raw.mitre_techniques ?? [])].sort();

  return {
    report_id:        String(raw.report_id        ?? ""),
    schema_version:   "1.0",
    detected_at:      String(raw.detected_at      ?? ""),
    generated_at:     String(raw.generated_at     ?? ""),
    severity:         String(raw.severity         ?? ""),
    category:         String(raw.category         ?? ""),
    status:           String(raw.status           ?? ""),
    confidence_score: Number(raw.confidence_score ?? 0),
    summary:          String(raw.summary          ?? ""),
    description:      String(raw.description      ?? ""),
    indicators,
    affected_assets,
    remediation_steps,
    mitre_techniques,
    threat_actor:     String(raw.threat_actor     ?? ""),
  };
}

// ── Identical sample report as Python SAMPLE_REPORT ───────────────
const SAMPLE_REPORT = {
  report_id:        "CSR-20261107-00001",
  schema_version:   "1.0",
  detected_at:      "2026-11-07T10:00:00.000Z",
  generated_at:     "2026-11-07T10:05:00.000Z",
  severity:         "high",
  category:         "phishing",
  status:           "detected",
  confidence_score: 87,
  summary:          "Credential harvesting phishing campaign targeting corporate email.",
  description:      "AI detected a phishing campaign using spoofed login pages to harvest credentials. Multiple users received emails with malicious links.",
  indicators: [
    { ioc_type: "domain", value: "secure-login-verify.example.com" },
    { ioc_type: "hash",   value: "d41d8cd98f00b204e9800998ecf8427e" },
  ],
  affected_assets: [
    { asset_type: "service", identifier: "corporate-email" },
    { asset_type: "user",    identifier: "user-group-finance" },
  ],
  remediation_steps: [
    { priority: 1, action: "Block domain secure-login-verify.example.com at DNS level" },
    { priority: 2, action: "Force password reset for all users who clicked the link" },
    { priority: 3, action: "Enable MFA for all corporate email accounts" },
  ],
  mitre_techniques: ["T1566", "T1078"],
  threat_actor:     "unknown",
};

const normalized  = normalizeThreatReport(SAMPLE_REPORT);
const canonical   = canonicalize(normalized);
const reportHash  = ethers.keccak256(ethers.toUtf8Bytes(canonical));
const reportId    = ethers.keccak256(
  ethers.concat([ethers.toUtf8Bytes(NAMESPACE), ethers.getBytes(reportHash)])
);

const PYTHON_HASH = "0xd5469a33795e145ad89bc2e577d20545f0e5b6e72b49b7419c78ef4f630970f7";
const PYTHON_ID   = "0x56ab21e4ee1c49b609e04024f8c9062afb6e1fb126101bac1a64858ade9c6ca9";

console.log("=".repeat(70));
console.log("  CyberShield AI — Cross-Language Hash Consistency Test");
console.log("=".repeat(70));
console.log(`\n  Canonical JSON (first 120 chars):\n  ${canonical.slice(0, 120)}…`);
console.log(`\n  TypeScript Report Hash : ${reportHash}`);
console.log(`  Python     Report Hash : ${PYTHON_HASH}`);
console.log(`  Hash match             : ${reportHash === PYTHON_HASH ? "✅ MATCH" : "❌ MISMATCH"}`);
console.log(`\n  TypeScript Report ID   : ${reportId}`);
console.log(`  Python     Report ID   : ${PYTHON_ID}`);
console.log(`  ID match               : ${reportId === PYTHON_ID ? "✅ MATCH" : "❌ MISMATCH"}`);
console.log("=".repeat(70));

if (reportHash !== PYTHON_HASH || reportId !== PYTHON_ID) {
  console.error("\n  ❌ CONSISTENCY FAILURE — Python and TypeScript produce different hashes!");
  process.exit(1);
} else {
  console.log("\n  ✅ Python ↔ TypeScript hash consistency CONFIRMED.");
  process.exit(0);
}
