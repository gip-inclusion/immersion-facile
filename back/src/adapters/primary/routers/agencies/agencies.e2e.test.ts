import {
  AddressDto,
  AgencyDtoBuilder,
  AgencyRoutes,
  agencyRoutes,
  BackOfficeJwt,
  displayRouteName,
  expectToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import { processEventsForEmailToBeSent } from "../../../../_testBuilders/processEventsForEmailToBeSent";
import { BasicEventCrawler } from "../../../secondary/core/EventCrawlerImplementations";
import { AppConfig } from "../../config/appConfig";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

const defaultAddress: AddressDto = {
  streetNumberAndAddress: "",
  postcode: "75002",
  departmentCode: "75",
  city: "Paris",
};

describe(`Agency routes`, () => {
  let sharedRequest: HttpClient<AgencyRoutes>;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let eventCrawler: BasicEventCrawler;
  let adminToken: BackOfficeJwt;
  let appConfig: AppConfig;

  beforeEach(async () => {
    const deps = await buildTestApp();
    ({ gateways, eventCrawler, appConfig, inMemoryUow } = deps);

    sharedRequest = createSupertestSharedClient(agencyRoutes, deps.request);

    gateways.timeGateway.setNextDate(new Date());
    const response = await deps.request.post("/admin/login").send({
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

  describe("Public Routes", () => {
    describe(`${displayRouteName(
      agencyRoutes.getFilteredAgencies,
    )} get agencies with name and position given filters`, () => {
      it("Returns agency list with name and position nearby a given position", async () => {
        // Prepare
        inMemoryUow.agencyRepository.setAgencies([
          agency1ActiveNearBy,
          agency2ActiveNearBy,
          agency3ActiveFarAway,
          agency4NeedsReview,
        ]);

        const response = await sharedRequest.getFilteredAgencies({
          queryParams: { departmentCode: "20" },
        });

        expectToEqual(response, {
          status: 200,
          body: [
            {
              id: agency1ActiveNearBy.id,
              name: agency1ActiveNearBy.name,
              kind: agency1ActiveNearBy.kind,
            },
            {
              id: agency2ActiveNearBy.id,
              name: agency2ActiveNearBy.name,
              kind: agency2ActiveNearBy.kind,
            },
          ],
        });
      });
    });

    describe(`${displayRouteName(
      agencyRoutes.getAgencyPublicInfoById,
    )} to get agency public info by id`, () => {
      it("Returns agency public info", async () => {
        // Prepare
        await inMemoryUow.agencyRepository.insert(agency1ActiveNearBy);

        // Act and assert
        const response = await sharedRequest.getAgencyPublicInfoById({
          queryParams: { agencyId: agency1ActiveNearBy.id },
        });

        expectToEqual(response, {
          status: 200,
          body: {
            address: {
              city: "Paris",
              departmentCode: "20",
              postcode: "75002",
              streetNumberAndAddress: "",
            },
            id: "test-agency-1",
            name: "Test Agency 1",
            position: {
              lat: 10.11,
              lon: 10.12,
            },
            signature: "empty-signature",
          },
        });
      });
    });
  });

  describe("Private routes (for backoffice admin)", () => {
    describe(`${displayRouteName(
      agencyRoutes.listAgenciesWithStatus,
    )} to get agencies full dto given filters`, () => {
      it("Returns Forbidden if no token provided", async () => {
        const response = await sharedRequest.listAgenciesWithStatus({
          queryParams: { status: "needsReview" },
          headers: { authorization: "" },
        });

        expectToEqual(response, {
          status: 401,
          body: { error: "You need to authenticate first" },
        });
      });

      it("Returns all agency dtos with a given status", async () => {
        // Prepare
        await Promise.all(
          [agency1ActiveNearBy, agency4NeedsReview].map(async (agencyDto) =>
            inMemoryUow.agencyRepository.insert(agencyDto),
          ),
        );

        const response = await sharedRequest.listAgenciesWithStatus({
          queryParams: { status: "needsReview" },
          headers: { authorization: adminToken },
        });

        expectToEqual(response, {
          status: 200,
          body: [
            {
              id: agency4NeedsReview.id,
              name: agency4NeedsReview.name,
              kind: agency4NeedsReview.kind,
            },
          ],
        });
      });
    });

    describe(`${displayRouteName(
      agencyRoutes.updateAgencyStatus,
    )} to update an agency status`, () => {
      it("Updates the agency status, sends an email to validators and returns code 200", async () => {
        // Prepare
        await inMemoryUow.agencyRepository.insert(agency4NeedsReview);

        const response = await sharedRequest.updateAgencyStatus({
          headers: { authorization: adminToken },
          body: { status: "active" },
          urlParams: { agencyId: agency4NeedsReview.id },
        });

        expectToEqual(response, {
          status: 200,
          body: "",
        });

        expect(
          (await inMemoryUow.agencyRepository.getByIds(["test-agency-4"]))[0]
            ?.status,
        ).toBe("active");
        expect(inMemoryUow.outboxRepository.events).toHaveLength(1);

        await processEventsForEmailToBeSent(eventCrawler);
        expect(gateways.notification.getSentEmails()).toHaveLength(1);
      });
    });

    describe(`${displayRouteName(
      agencyRoutes.updateAgency,
    )} to update an agency data`, () => {
      it("fails if provided token is not valid", async () => {
        const response = await sharedRequest.updateAgency({
          headers: { authorization: "wrong-token" },
          urlParams: { agencyId: "test-agency-4" },
          body: {} as any,
        });

        expectToEqual(response, {
          status: 401,
          body: { error: "Provided token is invalid" },
        });
      });

      it("Updates the agency and returns code 200", async () => {
        // Prepare
        await inMemoryUow.agencyRepository.insert(agency4NeedsReview);

        const updatedAgency = new AgencyDtoBuilder()
          .withId(agency4NeedsReview.id)
          .withValidatorEmails(["this-is-a-new-validator@mail.com"])
          .withCodeSafir("1234")
          .build();

        const response = await sharedRequest.updateAgency({
          headers: { authorization: adminToken },
          urlParams: { agencyId: agency4NeedsReview.id },
          body: updatedAgency,
        });

        expectToEqual(response, {
          status: 200,
          body: "",
        });

        expectToEqual(
          await inMemoryUow.agencyRepository.getByIds(["test-agency-4"]),
          [updatedAgency],
        );

        expect(inMemoryUow.outboxRepository.events).toHaveLength(1);
      });
    });
  });
});
