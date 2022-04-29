import { Pool, PoolClient } from "pg";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { PgImmersionApplicationExportQueries } from "../../adapters/secondary/pg/PgImmersionApplicationExportQueries";
import { PgImmersionApplicationRepository } from "../../adapters/secondary/pg/PgImmersionApplicationRepository";
import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationRawBeforeExportVO } from "../../domain/immersionApplication/valueObjects/ImmersionApplicationRawBeforeExportVO";

describe("Pg implementation of ImmersionApplicationExportQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let exportQueries: PgImmersionApplicationExportQueries;
  let agencyRepo: PgAgencyRepository;
  let immersionApplicationRepo: PgImmersionApplicationRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_applications");
    await client.query("DELETE FROM agencies");
    exportQueries = new PgImmersionApplicationExportQueries(client);
    agencyRepo = new PgAgencyRepository(client);
    immersionApplicationRepo = new PgImmersionApplicationRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });
  describe("get for export", () => {
    it("retrieves all immersion applications exports", async () => {
      // Prepare
      const appleAgencyId = "11111111-1111-1111-1111-111111111111";
      const appleAgency = AgencyConfigBuilder.create(appleAgencyId)
        .withName("apple")
        .build();

      const immersionApplicationId: ImmersionApplicationId =
        "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";

      const immersionApplicationEntity: ImmersionApplicationEntity =
        ImmersionApplicationEntity.create(
          new ImmersionApplicationDtoBuilder()
            .withId(immersionApplicationId)
            .withDateStart(new Date("2021-01-15").toISOString())
            .withDateEnd(new Date("2021-01-20").toISOString())
            .withDateSubmission(new Date("2021-01-10").toISOString())
            .withAgencyId(appleAgencyId)
            .withoutWorkCondition()
            .withoutPeExternalId()
            .build(),
        );

      await agencyRepo.insert(appleAgency);
      await immersionApplicationRepo.save(immersionApplicationEntity);

      // Act
      const actualExport: ImmersionApplicationRawBeforeExportVO[] =
        await exportQueries.getAllApplicationsForExport();

      const {
        agencyId,
        id,
        immersionActivities,
        immersionSkills,
        individualProtection,
        sanitaryPrevention,
        sanitaryPreventionDescription,
        immersionAppellation,
        ...filteredProperties
      } = immersionApplicationEntity.properties;
      // Assert
      expect(actualExport[0]._props).toStrictEqual(
        new ImmersionApplicationRawBeforeExportVO({
          ...filteredProperties,
          agencyName: appleAgency.name,
          immersionProfession:
            immersionApplicationEntity.properties.immersionAppellation
              .appellationLabel,
          status: immersionApplicationEntity.status,
          dateEnd: "20/01/2021",
          dateStart: "15/01/2021",
          dateSubmission: "10/01/2021",
        })._props,
      );
    });
  });
});
