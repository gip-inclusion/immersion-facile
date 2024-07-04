import crypto from "crypto";
import { Pool } from "pg";
import { AgencyDtoBuilder, ConventionDtoBuilder, expectToEqual } from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { PgAgencyRepository } from "../../agency/adapters/PgAgencyRepository";
import { PgConventionRepository } from "../../convention/adapters/PgConventionRepository";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";
import { PgEstablishmentQueries } from "./PgEstablishmentQueries";

describe("PgEstablishmentQueries", () => {
  let pgEstablishmentQueries: PgEstablishmentQueries;
  let pgConventionRepository: PgConventionRepository;
  let pgAgencyRepository: PgAgencyRepository;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;
  let db: KyselyDb;
  let pool: Pool;

  beforeAll(() => {
    pool = getTestPgPool();
  });

  beforeEach(async () => {
    db = makeKyselyDb(pool);
    pgEstablishmentQueries = new PgEstablishmentQueries(db);
    pgConventionRepository = new PgConventionRepository(db);
    pgAgencyRepository = new PgAgencyRepository(db);
    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      db,
    );
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agencies").execute();
    await db.deleteFrom("establishments").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("getEstablishmentStats", () => {
    describe("when no establishment stats", () => {
      it("returns data with empty array and pagination", async () => {
        const paginatedEstablishmentStats =
          await pgEstablishmentQueries.getEstablishmentStats({
            page: 1,
            perPage: 10,
          });

        expectToEqual(paginatedEstablishmentStats, {
          data: [],
          pagination: {
            totalRecords: 0,
            totalPages: 1,
            numberPerPage: 10,
            currentPage: 1,
          },
        });
      });
    });

    describe("when there are conventions", () => {
      it("returns data with array and pagination", async () => {
        const agency = new AgencyDtoBuilder().build();
        await pgAgencyRepository.insert(agency);
        const conventionSiret1A = new ConventionDtoBuilder()
          .withId(crypto.randomUUID())
          .withSiret("11110000111100")
          .withAgencyId(agency.id)
          .build();
        const conventionSiret1B = new ConventionDtoBuilder()
          .withId(crypto.randomUUID())
          .withSiret("11110000111100")
          .withAgencyId(agency.id)
          .build();
        const convention2 = new ConventionDtoBuilder()
          .withId(crypto.randomUUID())
          .withSiret("22220000222200")
          .withAgencyId(agency.id)
          .build();

        const establishmentAggregate = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("33330000333300")
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregate,
        );

        const convention3 = new ConventionDtoBuilder()
          .withId(crypto.randomUUID())
          .withSiret(establishmentAggregate.establishment.siret)
          .withAgencyId(agency.id)
          .build();

        await Promise.all([
          pgConventionRepository.save(conventionSiret1A),
          pgConventionRepository.save(conventionSiret1B),
          pgConventionRepository.save(convention2),
          pgConventionRepository.save(convention3),
        ]);

        const page1Result = await pgEstablishmentQueries.getEstablishmentStats({
          page: 1,
          perPage: 2,
        });

        expectToEqual(page1Result, {
          data: [
            {
              siret: conventionSiret1A.siret,
              name: conventionSiret1A.businessName,
              numberOfConventions: "2" as unknown as number,
              isReferenced: false,
            },
            {
              siret: convention2.siret,
              name: convention2.businessName,
              numberOfConventions: "1" as unknown as number,
              isReferenced: false,
            },
          ],
          pagination: {
            totalRecords: 3,
            totalPages: 2,
            numberPerPage: 2,
            currentPage: 1,
          },
        });

        const page2Result = await pgEstablishmentQueries.getEstablishmentStats({
          page: 2,
          perPage: 2,
        });

        expectToEqual(page2Result, {
          data: [
            {
              siret: convention3.siret,
              name: convention3.businessName,
              numberOfConventions: "1" as unknown as number,
              isReferenced: true,
            },
          ],
          pagination: {
            totalRecords: 3,
            totalPages: 2,
            numberPerPage: 2,
            currentPage: 2,
          },
        });
      });
    });
  });
});
