import {
  AddressDto,
  BackOfficeJwt,
  agenciesRoute,
  AgencyDtoBuilder,
  expectToEqual,
} from "shared";
import { SuperTest, Test } from "supertest";
import {
  InMemoryGateways,
  buildTestApp,
} from "../../../../_testBuilders/buildTestApp";
import { BasicEventCrawler } from "../../../secondary/core/EventCrawlerImplementations";
import { AppConfig } from "../../config/appConfig";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

const defaultAddress: AddressDto = {
  streetNumberAndAddress: "",
  postcode: "75002",
  departmentCode: "75",
  city: "Paris",
};

describe(`/${agenciesRoute} route`, () => {
  let request: SuperTest<Test>;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let eventCrawler: BasicEventCrawler;
  let adminToken: BackOfficeJwt;
  let appConfig: AppConfig;

  beforeEach(async () => {
    ({ request, gateways, eventCrawler, appConfig, inMemoryUow } =
      await buildTestApp());

    gateways.timeGateway.setNextDate(new Date());
    const response = await request.post("/admin/login").send({
      user: appConfig.backofficeUsername,
      password: appConfig.backofficePassword,
    });
    adminToken = response.body;
  });

  const agency1ActiveNearBy = AgencyDtoBuilder.create("test-agency-1")
    .withName("Test Agency 1")
    .withStatus("active")
    .withPosition(10.11, 10.12)
    .withAddress({ ...defaultAddress, departmentCode: "20" })
    .build();

  const agency2ActiveNearBy = AgencyDtoBuilder.create("test-agency-2")
    .withName("Test Agency 2")
    .withStatus("active")
    .withPosition(10, 10)
    .withAddress({ ...defaultAddress, departmentCode: "20" })
    .build();

  const agency3ActiveFarAway = AgencyDtoBuilder.create("test-agency-3")
    .withName("Test Agency 3")
    .withStatus("active")
    .withPosition(1, 2)
    .withAddress(defaultAddress)
    .build();
  const agency4NeedsReview = AgencyDtoBuilder.create("test-agency-4")
    .withName("Test Agency 4")
    .withStatus("needsReview")
    .withValidatorEmails(["emmanuelle@email.com"])
    .withAddress(defaultAddress)
    .build();

  describe("public route to get agencies with name and position given filters", () => {
    it("returns agency list with name and position nearby a given position", async () => {
      // Prepare
      inMemoryUow.agencyRepository.setAgencies([
        agency1ActiveNearBy,
        agency2ActiveNearBy,
        agency3ActiveFarAway,
        agency4NeedsReview,
      ]);
      // Act and asseer
      await request.get(`/${agenciesRoute}?departmentCode=20`).expect(200, [
        {
          id: agency1ActiveNearBy.id,
          name: agency1ActiveNearBy.name,
        },
        {
          id: agency2ActiveNearBy.id,
          name: agency2ActiveNearBy.name,
        },
      ]);
    });
  });
  describe("private route to get agencies full dto given filters", () => {
    it("Returns Forbidden if no token provided", async () => {
      const response = await request.get(
        `/admin/${agenciesRoute}?status=needsReview`,
      );

      expect(response.body).toEqual({
        error: "You need to authenticate first",
      });
      expect(response.status).toBe(401);
    });

    it("Returns all agency dtos with a given status", async () => {
      // Prepare
      await Promise.all(
        [agency1ActiveNearBy, agency4NeedsReview].map(async (agencyDto) =>
          inMemoryUow.agencyRepository.insert(agencyDto),
        ),
      );
      // Getting the application succeeds and shows that it's validated.
      await request
        .get(`/admin/${agenciesRoute}?status=needsReview`)
        .set("Authorization", adminToken)
        .expect(200, [
          { id: agency4NeedsReview.id, name: agency4NeedsReview.name },
        ]);
    });
  });

  describe("private route to update an agency status", () => {
    it("Updates the agency status, sends an email to validators and returns code 200", async () => {
      // Prepare
      await inMemoryUow.agencyRepository.insert(agency4NeedsReview);

      // Act and assert
      await request
        .patch(`/admin/${agenciesRoute}/test-agency-4`)
        .set("Authorization", adminToken)
        .send({ status: "active" })
        .expect(200);

      expect(
        (await inMemoryUow.agencyRepository.getById("test-agency-4"))?.status,
      ).toBe("active");
      expect(inMemoryUow.outboxRepository.events).toHaveLength(1);

      await eventCrawler.processNewEvents();
      expect(gateways.email.getSentEmails()).toHaveLength(1);
    });
  });
  describe("private route to update an agency data", () => {
    it("fails if provided token is not valid", async () => {
      await request
        .put(`/admin/${agenciesRoute}/test-agency-4`)
        .set("Authorization", "wrong-token")
        .send({})
        .expect(401);
    });

    it("Updates the agency and returns code 200", async () => {
      // Prepare
      await inMemoryUow.agencyRepository.insert(agency4NeedsReview);

      const updatedAgency = new AgencyDtoBuilder()
        .withId(agency4NeedsReview.id)
        .withValidatorEmails(["this-is-a-new-validator@mail.com"])
        .withCodeSafir("1234")
        .build();

      // Act and assert
      await request
        .put(`/admin/${agenciesRoute}/test-agency-4`)
        .set("Authorization", adminToken)
        .send(updatedAgency)
        .expect(200);

      expectToEqual(
        await inMemoryUow.agencyRepository.getById("test-agency-4"),
        updatedAgency,
      );

      expect(inMemoryUow.outboxRepository.events).toHaveLength(1);
    });
  });
});
