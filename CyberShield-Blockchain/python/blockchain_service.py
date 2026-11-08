"""
CyberShield AI — Blockchain Service
=====================================
Connects the Python backend to the ThreatReportRegistry smart contract
running on a Hardhat local node (or any EVM chain).

Workflow:
  1. Python generates a threat / medical report.
  2. report_hash.py canonicalizes & hashes it.
  3. This module calls registerReport() on-chain.
  4. Returns the transaction receipt + on-chain verification.

Security:
  - Uses the first Hardhat development account by default.
  - For production, load credentials from env vars or a managed signer.
  - NEVER commit private keys to version control.
"""

import json
import os
from pathlib import Path

from web3 import Web3
from web3.exceptions import ContractLogicError

from report_hash import hash_report


# ─────────────────────────────────────────────────────
#  Configuration
# ─────────────────────────────────────────────────────

RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")

# Path to deployment metadata written by scripts/deploy.js
DEPLOYMENT_FILE = Path(__file__).resolve().parent.parent / "deployment.json"

# Path to compiled contract ABI
ABI_FILE = (
    Path(__file__).resolve().parent.parent
    / "artifacts"
    / "contracts"
    / "ThreatReportRegistry.sol"
    / "ThreatReportRegistry.json"
)


class BlockchainService:
    """High-level interface to the ThreatReportRegistry contract."""

    def __init__(
        self,
        rpc_url: str = RPC_URL,
        contract_address: str | None = None,
        account_address: str | None = None,
        private_key: str | None = None,
    ):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))

        if not self.w3.is_connected():
            raise ConnectionError(
                f"Cannot reach blockchain node at {rpc_url}. "
                "Is `npx hardhat node` running?"
            )

        # ── Contract address ─────────────────────────
        if contract_address:
            self.contract_address = Web3.to_checksum_address(contract_address)
        elif DEPLOYMENT_FILE.exists():
            info = json.loads(DEPLOYMENT_FILE.read_text())
            self.contract_address = Web3.to_checksum_address(
                info["contractAddress"]
            )
        else:
            raise FileNotFoundError(
                f"No deployment.json found at {DEPLOYMENT_FILE}. "
                "Deploy the contract first with `npx hardhat run scripts/deploy.js`."
            )

        # ── ABI ──────────────────────────────────────
        if not ABI_FILE.exists():
            raise FileNotFoundError(
                f"Compiled ABI not found at {ABI_FILE}. "
                "Run `npx hardhat compile` first."
            )
        artifact = json.loads(ABI_FILE.read_text())
        abi = artifact["abi"]

        self.contract = self.w3.eth.contract(
            address=self.contract_address,
            abi=abi,
        )

        # ── Signer ───────────────────────────────────
        if account_address:
            self.account = Web3.to_checksum_address(account_address)
        else:
            # Default: first Hardhat dev account
            self.account = self.w3.eth.accounts[0]

        self.private_key = private_key or os.getenv("DEPLOYER_PRIVATE_KEY")

    # ─────────────────────────────────────────────────
    #  Register
    # ─────────────────────────────────────────────────

    def register_report(
        self, report_type: str, raw_report: dict
    ) -> dict:
        """
        Hash a report and register it on-chain.

        Returns a dict with:
          - report_hash  (hex)
          - report_id    (hex)
          - tx_hash      (hex)
          - block_number (int)
          - status       ("registered")
        """
        report_hash, report_id = hash_report(report_type, raw_report)

        tx = self.contract.functions.registerReport(
            report_hash
        ).build_transaction({
            "from": self.account,
            "nonce": self.w3.eth.get_transaction_count(self.account),
            "gas": 200_000,
            "gasPrice": self.w3.eth.gas_price,
        })

        if self.private_key:
            signed = self.w3.eth.account.sign_transaction(
                tx, private_key=self.private_key
            )
            tx_hash = self.w3.eth.send_raw_transaction(
                signed.raw_transaction
            )
        else:
            # Local Hardhat — accounts are unlocked
            tx_hash = self.w3.eth.send_transaction(tx)

        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            "report_hash":  "0x" + report_hash.hex(),
            "report_id":    "0x" + report_id.hex(),
            "tx_hash":      receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber,
            "status":       "registered",
        }

    # ─────────────────────────────────────────────────
    #  Verify
    # ─────────────────────────────────────────────────

    def verify_report(
        self, report_type: str, raw_report: dict
    ) -> dict:
        """
        Recalculate the hash and verify against the on-chain record.

        Returns a dict with:
          - report_hash (hex)
          - report_id   (hex)
          - verified    (bool)
        """
        report_hash, report_id = hash_report(report_type, raw_report)

        verified = self.contract.functions.verifyReport(
            report_id, report_hash
        ).call()

        return {
            "report_hash": "0x" + report_hash.hex(),
            "report_id":   "0x" + report_id.hex(),
            "verified":    verified,
        }

    # ─────────────────────────────────────────────────
    #  Lookup
    # ─────────────────────────────────────────────────

    def get_report_metadata(self, report_id_hex: str) -> dict:
        """
        Retrieve on-chain metadata for a registered report.

        Args:
            report_id_hex: The report ID as a hex string (0x…).

        Returns a dict with reportId, reportHash, registeredBy, registeredAt.
        """
        report_id = bytes.fromhex(report_id_hex.removeprefix("0x"))

        try:
            rid, rh, by, at = self.contract.functions.getReport(
                report_id
            ).call()
        except ContractLogicError as e:
            return {"error": str(e)}

        return {
            "report_id":     "0x" + rid.hex(),
            "report_hash":   "0x" + rh.hex(),
            "registered_by": by,
            "registered_at": at,
        }

    # ─────────────────────────────────────────────────
    #  Stats
    # ─────────────────────────────────────────────────

    def report_count(self) -> int:
        """Return the total number of registered reports."""
        return self.contract.functions.reportCount().call()


# ─────────────────────────────────────────────────────
#  CLI demo
# ─────────────────────────────────────────────────────

if __name__ == "__main__":
    svc = BlockchainService()

    sample = {
        "results": [
            {
                "parameter": "Hemoglobin",
                "value": "14.5",
                "normalRange": "13.0-17.5",
                "status": "normal",
            },
        ],
        "explanation": "All values within normal limits.",
        "abnormalFindings": [],
        "recommendations": "No follow-up needed.",
    }

    print("\n═══  Registering report  ═══")
    result = svc.register_report("lab_report", sample)
    for k, v in result.items():
        print(f"  {k}: {v}")

    print("\n═══  Verifying report  ═══")
    v = svc.verify_report("lab_report", sample)
    for k, v2 in v.items():
        print(f"  {k}: {v2}")

    print(f"\n  Total reports on-chain: {svc.report_count()}")
