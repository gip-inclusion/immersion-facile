import type { Pool } from "pg";
import {
  type BanEstablishmentPayload,
  expectArraysToEqualIgnoringOrder,
  expectToEqual,
} from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../config/pg/pgPool";
import { PgBannedEstablishmentRepository } from "./PgBannedEstablishmentRepository";

describe("PgBannedEstablishmentRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgEstablishmentRepository: PgBannedEstablishmentRepository;

  const bannedEstablishment: BanEstablishmentPayload = {
    siret: "12345678901234",
    establishmentBannishmentJustification: "Le cidre n'est pas breton",
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

  describe("getBannedEstablishments", () => {
    it("returns all banned establishments", async () => {
      const anotherBannedEstablishment: BanEstablishmentPayload = {
        siret: "98765432109876",
        establishmentBannishmentJustification:
          "Leurs kouign amann ne contiennent que 40% de beurre",
      };

      await db
        .insertInto("banned_establishments")
        .values([
          {
            siret: bannedEstablishment.siret,
            bannishment_justification:
              bannedEstablishment.establishmentBannishmentJustification,
          },
          {
            siret: anotherBannedEstablishment.siret,
            bannishment_justification:
              anotherBannedEstablishment.establishmentBannishmentJustification,
          },
        ])
        .execute();

      expectArraysToEqualIgnoringOrder(
        await pgEstablishmentRepository.getBannedEstablishments(),
        [bannedEstablishment, anotherBannedEstablishment],
      );
    });

    it("returns empty array when no establishments are banned", async () => {
      expectToEqual(
        await pgEstablishmentRepository.getBannedEstablishments(),
        [],
      );
    });
  });

  describe("getBannedEstablishmentBySiret", () => {
    it("returns the banned establishment with the given siret if it exists", async () => {
      await db
        .insertInto("banned_establishments")
        .values({
          siret: bannedEstablishment.siret,
          bannishment_justification:
            bannedEstablishment.establishmentBannishmentJustification,
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
        establishmentBannishmentJustification:
          bannedEstablishment.establishmentBannishmentJustification,
      });

      const bannedEstablishments = await getAllBannedEstablishments(db);

      expectToEqual(bannedEstablishments, [bannedEstablishment]);
    });

    it("throws if the establishment with the given siret is already banned", async () => {
      await pgEstablishmentRepository.banEstablishment({
        siret: bannedEstablishment.siret,
        establishmentBannishmentJustification:
          bannedEstablishment.establishmentBannishmentJustification,
      });

      expect(
        pgEstablishmentRepository.banEstablishment({
          siret: bannedEstablishment.siret,
          establishmentBannishmentJustification:
            bannedEstablishment.establishmentBannishmentJustification,
        }),
      ).rejects.toThrow();
    });
  });
});

const getAllBannedEstablishments = async (
  db: KyselyDb,
): Promise<BanEstablishmentPayload[]> =>
  (await db.selectFrom("banned_establishments").selectAll().execute()).map(
    (dbBannedEstablishment) => ({
      siret: dbBannedEstablishment.siret,
      establishmentBannishmentJustification:
        dbBannedEstablishment.bannishment_justification,
    }),
  );
