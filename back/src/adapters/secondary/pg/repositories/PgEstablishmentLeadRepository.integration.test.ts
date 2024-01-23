import { subDays } from "date-fns";
import { Pool, PoolClient } from "pg";
import { expectToEqual } from "shared";
import { EstablishmentLead } from "../../../../domain/offer/entities/EstablishmentLeadEntity";
import { makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
import { PgEstablishmentLeadRepository } from "./PgEstablishmentLeadRepository";

describe("PgEstablishmentLeadRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let establishmentLeadRepository: PgEstablishmentLeadRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM form_establishments");
    establishmentLeadRepository = new PgEstablishmentLeadRepository(
      makeKyselyDb(pool),
    );
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("save & getBySiret", () => {
    it("Save EstablishmentLead", async () => {
      const noResult = await establishmentLeadRepository.getBySiret(
        "40400000000404",
      );
      expect(noResult).toBeUndefined();

      const now = new Date();
      const establishmentLead: EstablishmentLead = {
        siret: "12345678901234",
        lastEventKind: "registration-accepted",
        events: [
          {
            conventionId: "45664444-1234-4000-4444-123456789012",
            occurredAt: subDays(now, 2),
            kind: "to-be-reminded",
          },
          {
            occurredAt: now,
            kind: "registration-accepted",
          },
        ],
      };

      await establishmentLeadRepository.save(establishmentLead);

      const leadInDb = await establishmentLeadRepository.getBySiret(
        establishmentLead.siret,
      );

      expectToEqual(leadInDb, establishmentLead);
    });
  });
});
