"""
CyberShield AI — Report Hash Generator v2
==========================================
Deterministic canonical serialization and Keccak-256 hashing for
CyberShield AI UnifiedThreatReport records.

This module is the Python equivalent of:
  - lib/blockchain/threatReport.ts  → normalizeThreatReport()
  - app/api/blockchain/route.ts     → computeReportHash() / computeReportId()

All three must produce IDENTICAL hashes for the same report.

Schema version: 1.0
Namespace:      CYBERSHIELD_REPORT_V1

Usage:
    report = { ... UnifiedThreatReport fields ... }
    report_hash, report_id = hash_report(report)
    print("Hash:", report_hash.hex())
    print("ID:  ", report_id.hex())
"""

import json
from web3 import Web3

# ─────────────────────────────────────────────────────────────────
#  Namespace — must exactly match:
#    Solidity:   string private constant NAMESPACE = "CYBERSHIELD_REPORT_V1";
#    TypeScript: const NAMESPACE = "CYBERSHIELD_REPORT_V1";
# ─────────────────────────────────────────────────────────────────
NAMESPACE = "CYBERSHIELD_REPORT_V1"


# ─────────────────────────────────────────────────────────────────
#  Canonical JSON serialization
#  Rules (must match TypeScript canonicalize()):
#    - Sorted keys at every nesting level
#    - No whitespace
#    - ensure_ascii=False (Unicode preserved)
# ─────────────────────────────────────────────────────────────────

def canonicalize_report(report: dict) -> str:
    """
    Deterministic JSON serialization of a report dict.
    Identical to the TypeScript canonicalize() function.
    """
    return json.dumps(
        report,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )


# ─────────────────────────────────────────────────────────────────
#  UnifiedThreatReport normalizer
#  Strips unknown fields, enforces schema structure,
#  and sorts all arrays — mirroring normalizeThreatReport() in TS.
# ─────────────────────────────────────────────────────────────────

def normalize_threat_report(raw: dict) -> dict:
    """
    Normalize a raw UnifiedThreatReport dict into the canonical form
    used for hashing. Strips extra fields; sorts all arrays.

    Args:
        raw: Raw report dict from Member 1's backend.

    Returns:
        Normalized dict ready for canonicalize() → keccak256().
    """
    # ── indicators ───────────────────────────────────────────────
    indicators = [
        {
            "ioc_type": str(ioc.get("ioc_type", "")),
            "value":    str(ioc.get("value",    "")),
        }
        for ioc in (raw.get("indicators") or [])
    ]
    indicators.sort(key=lambda x: (x["ioc_type"], x["value"]))

    # ── affected_assets ──────────────────────────────────────────
    affected_assets = [
        {
            "asset_type": str(a.get("asset_type", "")),
            "identifier": str(a.get("identifier", "")),
        }
        for a in (raw.get("affected_assets") or [])
    ]
    affected_assets.sort(key=lambda x: (x["asset_type"], x["identifier"]))

    # ── remediation_steps ────────────────────────────────────────
    remediation_steps = [
        {
            "action":   str(s.get("action",   "")),
            "priority": int(s.get("priority", 0)),
        }
        for s in (raw.get("remediation_steps") or [])
    ]
    remediation_steps.sort(key=lambda x: x["priority"])

    # ── mitre_techniques ─────────────────────────────────────────
    mitre_techniques = sorted([
        str(t) for t in (raw.get("mitre_techniques") or [])
    ])

    return {
        "report_id":        str(raw.get("report_id",        "")),
        "schema_version":   "1.0",
        "detected_at":      str(raw.get("detected_at",      "")),
        "generated_at":     str(raw.get("generated_at",     "")),
        "severity":         str(raw.get("severity",         "")),
        "category":         str(raw.get("category",         "")),
        "status":           str(raw.get("status",           "")),
        "confidence_score": int(raw.get("confidence_score", 0)),
        "summary":          str(raw.get("summary",          "")),
        "description":      str(raw.get("description",      "")),
        "indicators":       indicators,
        "affected_assets":  affected_assets,
        "remediation_steps": remediation_steps,
        "mitre_techniques": mitre_techniques,
        "threat_actor":     str(raw.get("threat_actor",     "")),
    }


# ─────────────────────────────────────────────────────────────────
#  Hash functions
# ─────────────────────────────────────────────────────────────────

def generate_report_hash(raw: dict) -> bytes:
    """
    H = keccak256( canonicalize( normalize(raw) ) )

    Returns 32 bytes.
    Identical to TypeScript computeReportHash().
    """
    normalized = normalize_threat_report(raw)
    canonical  = canonicalize_report(normalized)
    return Web3.keccak(text=canonical)


def generate_report_id(report_hash: bytes) -> bytes:
    """
    ID = keccak256( NAMESPACE_bytes || report_hash_bytes )

    Mirrors the Solidity:
        keccak256(abi.encodePacked(NAMESPACE, reportHash))

    and the TypeScript computeReportId().

    Args:
        report_hash: 32-byte digest from generate_report_hash().

    Returns 32 bytes.
    """
    namespace_bytes = NAMESPACE.encode("utf-8")   # 21 bytes
    packed          = namespace_bytes + bytes(report_hash)   # 53 bytes
    return Web3.keccak(primitive=packed)


def hash_report(raw: dict) -> tuple[bytes, bytes]:
    """
    Convenience wrapper.

    Returns:
        (report_hash: bytes32, report_id: bytes32)
    """
    report_hash = generate_report_hash(raw)
    report_id   = generate_report_id(report_hash)
    return report_hash, report_id


# ─────────────────────────────────────────────────────────────────
#  Cross-language consistency test
#
#  Run this module directly to verify that Python and TypeScript
#  produce the same hash for the SAMPLE_REPORT below.
#
#  Steps:
#    1. Run this file:  python report_hash.py
#       Note the printed hash and ID.
#    2. POST the same SAMPLE_REPORT to the Next.js API:
#         curl -X POST http://localhost:3000/api/blockchain \
#           -H "Content-Type: application/json" \
#           -d '{"action":"verify","report":<SAMPLE_REPORT>}'
#    3. The report_hash values must be identical.
# ─────────────────────────────────────────────────────────────────

SAMPLE_REPORT = {
    "report_id":        "CSR-20261107-00001",
    "schema_version":   "1.0",
    "detected_at":      "2026-11-07T10:00:00.000Z",
    "generated_at":     "2026-11-07T10:05:00.000Z",
    "severity":         "high",
    "category":         "phishing",
    "status":           "detected",
    "confidence_score": 87,
    "summary":          "Credential harvesting phishing campaign targeting corporate email.",
    "description":      "AI detected a phishing campaign using spoofed login pages to harvest credentials. "
                        "Multiple users received emails with malicious links.",
    "indicators": [
        {"ioc_type": "domain", "value": "secure-login-verify.example.com"},
        {"ioc_type": "hash",   "value": "d41d8cd98f00b204e9800998ecf8427e"},
    ],
    "affected_assets": [
        {"asset_type": "service", "identifier": "corporate-email"},
        {"asset_type": "user",    "identifier": "user-group-finance"},
    ],
    "remediation_steps": [
        {"priority": 1, "action": "Block domain secure-login-verify.example.com at DNS level"},
        {"priority": 2, "action": "Force password reset for all users who clicked the link"},
        {"priority": 3, "action": "Enable MFA for all corporate email accounts"},
    ],
    "mitre_techniques": ["T1566", "T1078"],
    "threat_actor":     "unknown",
}


if __name__ == "__main__":
    rh, rid = hash_report(SAMPLE_REPORT)

    normalized = normalize_threat_report(SAMPLE_REPORT)
    canonical  = canonicalize_report(normalized)

    print("=" * 70)
    print("  CyberShield AI — Hash Consistency Test")
    print("=" * 70)
    print(f"\n  Report ID     : {SAMPLE_REPORT['report_id']}")
    print(f"  Schema version: {SAMPLE_REPORT['schema_version']}")
    print(f"\n  Canonical JSON (first 120 chars):")
    print(f"  {canonical[:120]}…")
    print(f"\n  Report Hash   : 0x{rh.hex()}")
    print(f"  Report ID     : 0x{rid.hex()}")
    print("=" * 70)
    print("\n  To verify cross-language consistency, POST this to Next.js:")
    print('  curl -X POST http://localhost:3000/api/blockchain \\')
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"action":"verify","report":<SAMPLE_REPORT>}\'')
    print("\n  The report_hash in the response must match the value above.")
    print("=" * 70)
