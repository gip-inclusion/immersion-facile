import type { Pool } from "pg";
import { expectToEqual } from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../config/pg/pgPool";
import type { BannedEstablishment } from "../use-cases/BanEstablishment";
import { PgBannedEstablishmentRepository } from "./PgBannedEstablishmentRepository";

describe("PgBannedEstablishmentRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgEstablishmentRepository: PgBannedEstablishmentRepository;

  const bannedEstablishment: BannedEstablishment = {
    siret: "12345678901234",
    bannishmentJustification: "Le cidre n'est pas breton",
  };

  beforeEach(async () => {
    pool = makeTestPgPool();
    db = makeKyselyDb(pool);
    pgEstablishmentRepository = new PgBannedEstablishmentRepository(db);

    await db.deleteFrom("banned_establishments").execute();
  });

  afterEach(async () => {
    await pool.end();
  });

  describe("getBannedEstablishmentBySiret", () => {
    it("returns the banned establishment with the given siret if it exists", async () => {
      await db
        .insertInto("banned_establishments")
        .values({
          siret: bannedEstablishment.siret,
          bannishment_justification:
            bannedEstablishment.bannishmentJustification,
        })
        .execute();

      expectToEqual(
        await pgEstablishmentRepository.getBannedEstablishmentBySiret(
          bannedEstablishment.siret,
        ),
        bannedEstablishment,
      );
    });

    it("returns undefined if there is no banned establishment with the given siret", async () => {
      expectToEqual(
        await pgEstablishmentRepository.getBannedEstablishmentBySiret(
          bannedEstablishment.siret,
        ),
        undefined,
      );
    });
  });

  describe("banEstablishment", () => {
    it("bans the establishment with the given siret and bannishment justification", async () => {
      await pgEstablishmentRepository.banEstablishment({
        siret: bannedEstablishment.siret,
        bannishmentJustification: bannedEstablishment.bannishmentJustification,
      });

      const bannedEstablishments = await getAllBannedEstablishments(db);

      expectToEqual(bannedEstablishments, [bannedEstablishment]);
    });

    it("throws if the establishment with the given siret is already banned", async () => {
      await pgEstablishmentRepository.banEstablishment({
        siret: bannedEstablishment.siret,
        bannishmentJustification: bannedEstablishment.bannishmentJustification,
      });

      expect(
        pgEstablishmentRepository.banEstablishment({
          siret: bannedEstablishment.siret,
          bannishmentJustification:
            bannedEstablishment.bannishmentJustification,
        }),
      ).rejects.toThrow();
    });
  });
});

const getAllBannedEstablishments = async (
  db: KyselyDb,
): Promise<BannedEstablishment[]> =>
  (await db.selectFrom("banned_establishments").selectAll().execute()).map(
    (dbBannedEstablishment) => ({
      siret: dbBannedEstablishment.siret,
      bannishmentJustification: dbBannedEstablishment.bannishment_justification,
    }),
  );
