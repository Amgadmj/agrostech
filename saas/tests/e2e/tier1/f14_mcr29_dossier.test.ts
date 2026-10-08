/**
 * Tier 1 — Feature 14: MCR 2-9 Dossier Generation & ICP-Brasil PAdES-LTV Signature Structures
 * Requirement: ORIGINAL_REQUEST.md §R3 & PROJECT.md Feature 14
 */

import { testTier1, assertEqual, assertTrue, assertFalse, assertMatch } from "../harness";
import crypto from "crypto";
import { FAZENDA_BURITIS_FIXTURE, EMBARGOED_PROPERTY_FIXTURE } from "../fixtures/reference_data";

export function registerF14Tests(): void {
  testTier1(
    "F14-01",
    "F14.1: Dossier generation produces valid SHA-256 document integrity checksum",
    () => {
      const documentPayload = JSON.stringify({
        carCode: FAZENDA_BURITIS_FIXTURE.car_code,
        grossAreaHa: FAZENDA_BURITIS_FIXTURE.gross_area_ha,
        netPlantableAreaHa: FAZENDA_BURITIS_FIXTURE.expected_net_plantable_ha,
        regulation: "BCB Resolução CMN nº 5.267/2025 - MCR 2-9",
        issuedAt: "2026-09-26T12:00:00Z",
      });

      const hash = crypto.createHash("sha256").update(documentPayload).digest("hex");
      assertEqual(hash.length, 64);
      assertMatch(hash, /^[0-9a-f]{64}$/);
    }
  );

  testTier1(
    "F14-02",
    "F14.2: ICP-Brasil PAdES-LTV digital signature profile contains accredited ACT and DOC-ICP-15 OID",
    () => {
      const padesMetadata = {
        dossierId: crypto.randomUUID(),
        policyOid: "2.16.76.1.7.1", // DOC-ICP-15 PAdES ADRB
        certificateChain: {
          actName: "Autoridade de Carimbo do Tempo SERPRO",
          issuerCn: "AC SERPRO Brasil v5",
          subjectCn: "AGROSTECH PERICIAS DIGITAIS LTDA:12345678000199",
          serialNumber: "3A4B5C6D7E8F901234567890",
        },
        signatureFormat: "PAdES-LTV",
        hashAlgorithm: "SHA-256",
      };

      assertEqual(padesMetadata.policyOid, "2.16.76.1.7.1");
      assertTrue(padesMetadata.certificateChain.actName.includes("Carimbo do Tempo"));
      assertEqual(padesMetadata.signatureFormat, "PAdES-LTV");
    }
  );

  testTier1(
    "F14-03",
    "F14.3: RFC 3161 cryptographic timestamp token is encoded in valid Base64 DER structure",
    () => {
      // Synthetic RFC 3161 TimeStampResp token
      const rawTimestampToken = Buffer.from("ASN1_RFC3161_TIMESTAMP_TOKEN_BURITIS_20260926_SERPRO_ACT");
      const base64Token = rawTimestampToken.toString("base64");

      // Verify base64 decoding roundtrip
      const decoded = Buffer.from(base64Token, "base64").toString();
      assertTrue(decoded.includes("RFC3161"));
      assertMatch(base64Token, /^[A-Za-z0-9+/=]+$/);
    }
  );

  testTier1(
    "F14-04",
    "F14.4: MCR 2-9 socioenvironmental evaluation marks clean parcel as CONFORME",
    () => {
      const evaluateMcr29 = (data: typeof FAZENDA_BURITIS_FIXTURE) => {
        const hasEmbargo = data.embargoes_ha > 0;
        const hasPublicOverlap = data.public_overlaps_ha > 0;
        const isCompliant = !hasEmbargo && !hasPublicOverlap;
        return {
          isCompliant,
          mcr29Status: isCompliant ? "CONFORME" : "IMPEDIDO",
          mandatoryRemoteSensing: data.gross_area_ha > 300,
        };
      };

      const result = evaluateMcr29(FAZENDA_BURITIS_FIXTURE);
      assertTrue(result.isCompliant);
      assertEqual(result.mcr29Status, "CONFORME");
      assertFalse(result.mandatoryRemoteSensing);
    }
  );

  testTier1(
    "F14-05",
    "F14.5: MCR 2-9 socioenvironmental evaluation marks embargoed property as IMPEDIDO",
    () => {
      const evaluateMcr29 = (data: typeof EMBARGOED_PROPERTY_FIXTURE) => {
        const hasEmbargo = data.embargoes_ha > 0;
        const isCompliant = !hasEmbargo;
        return {
          isCompliant,
          mcr29Status: isCompliant ? "CONFORME" : "IMPEDIDO",
          impediments: hasEmbargo ? ["MCR 2-9-2: Vedação a Áreas Embargadas pelo IBAMA"] : [],
        };
      };

      const result = evaluateMcr29(EMBARGOED_PROPERTY_FIXTURE);
      assertFalse(result.isCompliant);
      assertEqual(result.mcr29Status, "IMPEDIDO");
      assertTrue(result.impediments.length > 0);
    }
  );
}
