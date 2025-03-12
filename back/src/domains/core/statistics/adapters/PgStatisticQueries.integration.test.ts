import crypto from "node:crypto";
import type { Pool } from "pg";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  UserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import { toAgencyWithRights } from "../../../../utils/agency";
import { makeUniqueUserForTest } from "../../../../utils/user";
import { PgAgencyRepository } from "../../../agency/adapters/PgAgencyRepository";
import { PgConventionRepository } from "../../../convention/adapters/PgConventionRepository";
import { PgEstablishmentAggregateRepository } from "../../../establishment/adapters/PgEstablishmentAggregateRepository";
import type { EstablishmentUserRight } from "../../../establishment/entities/EstablishmentAggregate";
import { EstablishmentAggregateBuilder } from "../../../establishment/helpers/EstablishmentBuilders";
import { PgUserRepository } from "../../authentication/inclusion-connect/adapters/PgUserRepository";
import { UuidV4Generator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import { PgStatisticQueries } from "./PgStatisticQueries";

describe("PgStatisticQueries", () => {
  let pgStatisticQueries: PgStatisticQueries;
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
    pgStatisticQueries = new PgStatisticQueries(db);
    pgConventionRepository = new PgConventionRepository(db);
    pgAgencyRepository = new PgAgencyRepository(db);
    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      db,
    );
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agencies").execute();
    await db.deleteFrom("establishments").execute();
    await db.deleteFrom("users").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("getEstablishmentStats", () => {
    describe("when no establishment stats", () => {
      it("returns data with empty array and pagination", async () => {
        const paginatedEstablishmentStats =
          await pgStatisticQueries.getEstablishmentStats({
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
      const agency = new AgencyDtoBuilder().build();
      const user = new UserBuilder()
        .withId(new UuidV4Generator().new())
        .build();
      const userRight: EstablishmentUserRight = {
        role: "establishment-admin",
        userId: user.id,
        job: "",
        phone: "",
      };
      const establishmentAggregate = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("33330000333300")
        .withUserRights([userRight])
        .build();
      const establishmentAggregateLinkedToNoConvention =
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("88880000888800")
          .withLocationId("11111111-1111-4111-1111-111111111111")
          .withUserRights([userRight])
          .build();
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
      const convention3 = new ConventionDtoBuilder()
        .withId(crypto.randomUUID())
        .withSiret(establishmentAggregate.establishment.siret)
        .withBusinessName(establishmentAggregate.establishment.name)
        .withAgencyId(agency.id)
        .build();

      beforeEach(async () => {
        const validator = makeUniqueUserForTest(uuid());
        const userRepository = new PgUserRepository(db);
        await userRepository.save(user);
        await userRepository.save(validator);
        await pgAgencyRepository.insert(
          toAgencyWithRights(agency, {
            [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
          }),
        );
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregate,
        );
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregateLinkedToNoConvention,
        );
        await Promise.all([
          pgConventionRepository.save(conventionSiret1A),
          pgConventionRepository.save(conventionSiret1B),
          pgConventionRepository.save(convention2),
          pgConventionRepository.save(convention3),
        ]);
      });

      it("throws BadRequest if page number is heigher than totalPages", async () => {
        const queryParams = {
          page: 10,
          perPage: 2,
        };
        await expectPromiseToFailWithError(
          pgStatisticQueries.getEstablishmentStats(queryParams),
          errors.establishment.badPagination({
            page: queryParams.page,
            perPage: queryParams.perPage,
            totalPages: 2,
          }),
        );
      });

      it("returns data with array and pagination", async () => {
        const page1Result = await pgStatisticQueries.getEstablishmentStats({
          page: 1,
          perPage: 2,
        });

        expectToEqual(page1Result, {
          data: [
            {
              siret: conventionSiret1A.siret,
              name: conventionSiret1A.businessName,
              numberOfConventions: 2,
              isReferenced: false,
            },
            {
              siret: convention2.siret,
              name: convention2.businessName,
              numberOfConventions: 1,
              isReferenced: false,
            },
          ],
          pagination: {
            totalRecords: 4,
            totalPages: 2,
            numberPerPage: 2,
            currentPage: 1,
          },
        });

        const page2Result = await pgStatisticQueries.getEstablishmentStats({
          page: 2,
          perPage: 2,
        });

        expectToEqual(page2Result, {
          data: [
            {
              siret: convention3.siret,
              name: convention3.businessName,
              numberOfConventions: 1,
              isReferenced: true,
            },
            {
              siret:
                establishmentAggregateLinkedToNoConvention.establishment.siret,
              name: establishmentAggregateLinkedToNoConvention.establishment
                .name,
              numberOfConventions: 0,
              isReferenced: true,
            },
          ],
          pagination: {
            totalRecords: 4,
            totalPages: 2,
            numberPerPage: 2,
            currentPage: 2,
          },
        });
      });
    });
  });
});
