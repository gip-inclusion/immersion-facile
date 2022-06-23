import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { agenciesRoute } from "shared/src/routes";
import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";

describe("/agencies route", () => {
  let request: SuperTest<Test>;
  const agency1ActiveNearBy = AgencyDtoBuilder.create("test-agency-1")
    .withName("Test Agency 1")
    .withStatus("active")
    .withPosition(10.11, 10.12)
    .build();

  const agency2ActiveNearBy = AgencyDtoBuilder.create("test-agency-2")
    .withName("Test Agency 2")
    .withStatus("active")
    .withPosition(10, 10)
    .build();

  const agency3ActiveFarAway = AgencyDtoBuilder.create("test-agency-3")
    .withName("Test Agency 3")
    .withStatus("active")
    .withPosition(1, 2)
    .build();

  const agency4NeedsReview = AgencyDtoBuilder.create("test-agency-4")
    .withName("Test Agency 4")
    .withStatus("needsReview")
    .build();

  beforeEach(async () => {
    const { app, repositories } = await createApp(
      new AppConfigBuilder().build(),
    );
    request = supertest(app);

    // Prepare
    const agencyRepo = repositories.agency;

    await Promise.all(
      [
        agency1ActiveNearBy,
        agency2ActiveNearBy,
        agency3ActiveFarAway,
        agency4NeedsReview,
      ].map(async (agencyDto) => agencyRepo.insert(agencyDto)),
    );
  });

  describe("public route", () => {
    it("returns agency list with name and position nearby a given position", async () => {
      // Act and asseer
      await request.get(`/agencies?lat=10.123&lon=10.123`).expect(200, [
        {
          id: agency1ActiveNearBy.id,
          name: agency1ActiveNearBy.name,
          position: agency1ActiveNearBy.position,
        },
        {
          id: agency2ActiveNearBy.id,
          name: agency2ActiveNearBy.name,
          position: agency2ActiveNearBy.position,
        },
      ]);
    });
  });
  describe("private route", () => {
    it("Returns all agency dto with a given status", async () => {
      // Getting the application succeeds and shows that it's validated.
      await request
        .get(`/admin/${agenciesRoute}?status=needsReview`)
        .auth("e2e_tests", "e2e")
        .expect(200, [agency4NeedsReview]);
    });
  });
});
