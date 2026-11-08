/**
 * CyberShield AI — Next.js App Router API: Blockchain Integration v2
 * ===================================================================
 * Registers and verifies CyberShield AI UnifiedThreatReport records
 * on the ThreatReportRegistry smart contract.
 *
 * Schema: lib/blockchain/threatReport.ts → UnifiedThreatReport
 *
 * ── Endpoints ────────────────────────────────────────────────────
 *
 * GET  /api/blockchain?action=status
 *   → { connected, contract_address, report_count, network }
 *
 * GET  /api/blockchain?action=lookup&report_id=0x...
 *   → { report_id, report_hash, registered_by, registered_at }
 *
 * POST /api/blockchain  { action: "register", report: UnifiedThreatReport }
 *   → { status:"registered", report_hash, report_id, tx_hash, block_number }
 *
 * POST /api/blockchain  { action: "verify", report: UnifiedThreatReport }
 *   → { report_hash, report_id, verified: true|false }
 *
 * ── Security ─────────────────────────────────────────────────────
 *   - Only keccak256 fingerprints leave this server to the blockchain.
 *   - Report contents never reach the smart contract.
 *   - Private key loaded from env var, never hard-coded.
 *   - No IP addresses, passwords, or PII are ever registered on-chain.
 */

import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { normalizeThreatReport } from "@/lib/blockchain/threatReport";

// ─────────────────────────────────────────────────────────────────
//  Configuration — all from .env.local
// ─────────────────────────────────────────────────────────────────

const RPC_URL          = process.env.BLOCKCHAIN_RPC_URL          || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || "";
const PRIVATE_KEY      = process.env.BLOCKCHAIN_PRIVATE_KEY      || "";
const NETWORK_NAME     = process.env.BLOCKCHAIN_NETWORK          || "hardhat";

/**
 * Namespace — MUST exactly match the Solidity constant:
 *   string private constant NAMESPACE = "CYBERSHIELD_REPORT_V1";
 * and the Python constant in report_hash.py.
 */
const NAMESPACE = "CYBERSHIELD_REPORT_V1";

// ─────────────────────────────────────────────────────────────────
//  Contract ABI — only the 5 functions this route uses
// ─────────────────────────────────────────────────────────────────

const CONTRACT_ABI = [
  "function registerReport(bytes32 reportHash) external returns (bytes32)",
  "function verifyReport(bytes32 reportId, bytes32 reportHash) external view returns (bool)",
  "function getReport(bytes32 reportId) external view returns (bytes32, bytes32, address, uint256)",
  "function reportCount() public view returns (uint256)",
  "function hashExists(bytes32) public view returns (bool)",
];

// ─────────────────────────────────────────────────────────────────
//  Deterministic (canonical) JSON serialization
//
//  Rules (must be identical in Python report_hash.py):
//    - Sorted keys at every nesting level
//    - No whitespace
//    - Strings JSON-quoted, numbers/booleans as-is
//    - null → "null"
// ─────────────────────────────────────────────────────────────────

function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string")  return JSON.stringify(value);
  if (Array.isArray(value))       return "[" + value.map(canonicalize).join(",") + "]";
  if (typeof value === "object") {
    const keys  = Object.keys(value as object).sort();
    const pairs = keys.map(
      (k) => `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`
    );
    return "{" + pairs.join(",") + "}";
  }
  return JSON.stringify(value);
}

// ─────────────────────────────────────────────────────────────────
//  Hash helpers
//
//  computeReportHash:
//    H = keccak256( canonicalize( normalize(report) ) )
//
//  computeReportId  (mirrors Solidity generateReportId):
//    ID = keccak256( abi.encodePacked( NAMESPACE_bytes, H_bytes32 ) )
//
//  Both functions must produce byte-identical results to:
//    - Python:   report_hash.py  → generate_report_hash / generate_report_id
//    - Solidity: ThreatReportRegistry.sol → generateReportId
// ─────────────────────────────────────────────────────────────────

type RawRecord = Record<string, unknown>;

function computeReportHash(raw: RawRecord): string {
  const normalized = normalizeThreatReport(raw);
  const canonical  = canonicalize(normalized);
  return ethers.keccak256(ethers.toUtf8Bytes(canonical));
}

function computeReportId(reportHash: string): string {
  // reportHash is 0x + 64 hex chars (32 bytes).
  // We must concatenate namespace UTF-8 bytes with the raw 32 hash bytes,
  // NOT with the hex string — to match Solidity's abi.encodePacked.
  const namespaceBytes = ethers.toUtf8Bytes(NAMESPACE);   // 21 bytes
  const hashBytes      = ethers.getBytes(reportHash);      // 32 bytes exactly
  return ethers.keccak256(ethers.concat([namespaceBytes, hashBytes]));
}

// ─────────────────────────────────────────────────────────────────
//  Contract factory
// ─────────────────────────────────────────────────────────────────

function getContract(): ethers.Contract {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "BLOCKCHAIN_CONTRACT_ADDRESS is not set in .env.local. " +
      "Run: cd CyberShield-Blockchain && npx hardhat run scripts/deploy.js --network localhost"
    );
  }
  if (!PRIVATE_KEY) {
    throw new Error(
      "BLOCKCHAIN_PRIVATE_KEY is not set in .env.local."
    );
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// ─────────────────────────────────────────────────────────────────
//  Input validation helper
// ─────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof RawRecord)[] = [
  "report_id", "schema_version", "detected_at", "generated_at",
  "severity", "category", "status", "confidence_score",
  "summary", "description",
];

function validateReport(report: unknown): { valid: true; data: RawRecord } | { valid: false; error: string } {
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    return { valid: false, error: "'report' must be a JSON object" };
  }
  const r = report as RawRecord;
  for (const field of REQUIRED_FIELDS) {
    if (r[field] === undefined || r[field] === null || r[field] === "") {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  if (r.schema_version !== "1.0") {
    return { valid: false, error: `Unsupported schema_version: ${r.schema_version}. Expected "1.0"` };
  }
  const score = Number(r.confidence_score);
  if (isNaN(score) || score < 0 || score > 100) {
    return { valid: false, error: "confidence_score must be a number 0–100" };
  }
  return { valid: true, data: r };
}

// ─────────────────────────────────────────────────────────────────
//  GET handler
// ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // ── status ────────────────────────────────────────────────────
    if (action === "status") {
      if (!CONTRACT_ADDRESS) {
        return NextResponse.json({
          connected: false,
          error: "BLOCKCHAIN_CONTRACT_ADDRESS not configured in .env.local",
        });
      }
      try {
        const contract = getContract();
        const count    = await contract.reportCount();
        return NextResponse.json({
          connected:        true,
          contract_address: CONTRACT_ADDRESS,
          report_count:     Number(count),
          network:          NETWORK_NAME,
          schema_version:   "1.0",
        });
      } catch (err) {
        return NextResponse.json({
          connected: false,
          error: err instanceof Error ? err.message : "Cannot connect to blockchain node",
        });
      }
    }

    // ── lookup ────────────────────────────────────────────────────
    if (action === "lookup") {
      const reportId = searchParams.get("report_id");
      if (!reportId?.startsWith("0x") || reportId.length !== 66) {
        return NextResponse.json(
          { error: "report_id must be a 0x-prefixed 32-byte hex string (66 chars)" },
          { status: 400 }
        );
      }
      const contract = getContract();
      try {
        const [rid, rHash, registeredBy, registeredAt] = await contract.getReport(
          ethers.getBytes(reportId)
        );
        return NextResponse.json({
          report_id:     rid,
          report_hash:   rHash,
          registered_by: registeredBy,
          registered_at: Number(registeredAt),
        });
      } catch {
        return NextResponse.json({ error: "Report not found on-chain" }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: "Valid ?action= values: status | lookup" },
      { status: 400 }
    );

  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
//  POST handler
// ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { action?: string; report?: unknown };
    const { action, report } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing 'action' field. Valid: register | verify" },
        { status: 400 }
      );
    }

    // ── register ──────────────────────────────────────────────────
    if (action === "register") {
      const validation = validateReport(report);
      if (!validation.valid) {
        const { error } = validation;
        return NextResponse.json({ error }, { status: 400 });
      }

      const reportHash = computeReportHash(validation.data);
      const reportId   = computeReportId(reportHash);
      const contract   = getContract();

      // Cheap read-only duplicate check before spending gas
      const alreadyRegistered = await contract.hashExists(ethers.getBytes(reportHash));
      if (alreadyRegistered) {
        return NextResponse.json(
          {
            error:       "Report already registered",
            report_hash: reportHash,
            report_id:   reportId,
          },
          { status: 409 }
        );
      }

      const tx      = await contract.registerReport(ethers.getBytes(reportHash));
      const receipt = await tx.wait();

      return NextResponse.json({
        status:       "registered",
        report_hash:  reportHash,
        report_id:    reportId,
        tx_hash:      receipt.hash,
        block_number: receipt.blockNumber,
      });
    }

    // ── verify ────────────────────────────────────────────────────
    if (action === "verify") {
      const validation = validateReport(report);
      if (!validation.valid) {
        const { error } = validation;
        return NextResponse.json({ error }, { status: 400 });
      }

      const reportHash = computeReportHash(validation.data);
      const reportId   = computeReportId(reportHash);
      const contract   = getContract();

      const verified = await contract.verifyReport(
        ethers.getBytes(reportId),
        ethers.getBytes(reportHash)
      );

      return NextResponse.json({
        report_hash: reportHash,
        report_id:   reportId,
        verified,
      });
    }

    return NextResponse.json(
      { error: `Unknown action: "${action}". Valid: register | verify` },
      { status: 400 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[blockchain/route] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
