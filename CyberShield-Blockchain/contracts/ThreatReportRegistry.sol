// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ThreatReportRegistry
 * @author CyberShield AI — Member 3 (Blockchain & Web3)
 * @notice Immutable on-chain registry for CyberShield AI threat reports.
 *         Stores ONLY cryptographic fingerprints — never sensitive data.
 *
 * Security principle:
 *   - No report contents, user data, API keys, or IP addresses on-chain.
 *   - Only report ID, Keccak-256 hash, timestamp, and registrant address.
 */
contract ThreatReportRegistry {

    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────

    /// @dev Fixed namespace prevents cross-application hash collisions.
    string private constant NAMESPACE = "CYBERSHIELD_REPORT_V1";

    // ──────────────────────────────────────────────
    //  Data structures
    // ──────────────────────────────────────────────

    struct Report {
        bytes32 reportId;
        bytes32 reportHash;
        address registeredBy;
        uint256 registeredAt;
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    /// @dev Report ID  →  full Report record
    mapping(bytes32 => Report) private reports;

    /// @dev Report hash  →  already registered?
    mapping(bytes32 => bool) public hashExists;

    /// @dev Running count of registered reports
    uint256 public reportCount;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event ReportRegistered(
        bytes32 indexed reportId,
        bytes32 indexed reportHash,
        address indexed registeredBy,
        uint256 registeredAt
    );

    // ──────────────────────────────────────────────
    //  Pure helpers
    // ──────────────────────────────────────────────

    /**
     * @notice Derive a deterministic report ID from a report hash.
     * @dev    ID = keccak256(NAMESPACE ‖ reportHash)
     *         Identical hashes always produce the same ID.
     */
    function generateReportId(
        bytes32 reportHash
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(NAMESPACE, reportHash)
        );
    }

    // ──────────────────────────────────────────────
    //  Write: register
    // ──────────────────────────────────────────────

    /**
     * @notice Register a new threat report on-chain.
     * @param  reportHash  Keccak-256 fingerprint of the canonical report.
     * @return reportId    Deterministic identifier derived from the hash.
     *
     * Requirements:
     *   - reportHash must not be zero.
     *   - The same hash cannot be registered twice (duplicate protection).
     */
    function registerReport(
        bytes32 reportHash
    ) external returns (bytes32) {

        require(
            reportHash != bytes32(0),
            "Invalid report hash"
        );

        // Derive deterministic ID
        bytes32 reportId = generateReportId(reportHash);

        // ── Duplicate guards ──────────────────────
        require(
            !hashExists[reportHash],
            "Report already registered"
        );
        require(
            reports[reportId].registeredAt == 0,
            "Report ID already exists"
        );

        // ── Persist ───────────────────────────────
        reports[reportId] = Report({
            reportId:     reportId,
            reportHash:   reportHash,
            registeredBy: msg.sender,
            registeredAt: block.timestamp
        });

        hashExists[reportHash] = true;
        reportCount += 1;

        emit ReportRegistered(
            reportId,
            reportHash,
            msg.sender,
            block.timestamp
        );

        return reportId;
    }

    // ──────────────────────────────────────────────
    //  Read: verify
    // ──────────────────────────────────────────────

    /**
     * @notice Verify that a report ID + hash pair is registered and consistent.
     * @return True only when:
     *         1. A record exists for `reportId`.
     *         2. Its stored hash equals `reportHash`.
     *         3. `generateReportId(reportHash)` reproduces `reportId`.
     */
    function verifyReport(
        bytes32 reportId,
        bytes32 reportHash
    ) external view returns (bool) {

        Report memory r = reports[reportId];

        if (r.registeredAt == 0)               return false; // not found
        if (r.reportHash  != reportHash)       return false; // hash mismatch
        if (generateReportId(reportHash) != reportId)
                                                return false; // ID mismatch
        return true;
    }

    // ──────────────────────────────────────────────
    //  Read: metadata
    // ──────────────────────────────────────────────

    /**
     * @notice Retrieve the public metadata of a registered report.
     * @return reportId, reportHash, registeredBy, registeredAt
     */
    function getReport(
        bytes32 reportId
    ) external view returns (
        bytes32,
        bytes32,
        address,
        uint256
    ) {
        Report memory r = reports[reportId];

        require(
            r.registeredAt != 0,
            "Report not found"
        );

        return (
            r.reportId,
            r.reportHash,
            r.registeredBy,
            r.registeredAt
        );
    }
}
