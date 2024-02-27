import {
  AddressDto,
  AgencyDtoBuilder,
  AgencyRoutes,
  BackOfficeJwt,
  CreateAgencyDto,
  agencyRoutes,
  displayRouteName,
  expectHttpResponseToEqual,
  expectToEqual,
  invalidAgencySiretMessage,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { BasicEventCrawler } from "../../../../domain/core/events/adapters/EventCrawlerImplementations";
import { InMemoryGateways, buildTestApp } from "../../../../utils/buildTestApp";
import { processEventsForEmailToBeSent } from "../../../../utils/processEventsForEmailToBeSent";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../secondary/siret/InMemorySiretGateway";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

const defaultAddress: AddressDto = {
  streetNumberAndAddress: "",
  postcode: "75002",
  departmentCode: "75",
  city: "Paris",
};

describe("Agency routes", () => {
  let httpClient: HttpClient<AgencyRoutes>;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let eventCrawler: BasicEventCrawler;
  let adminToken: BackOfficeJwt;

  beforeEach(async () => {
    const deps = await buildTestApp();
    ({ gateways, eventCrawler, inMemoryUow } = deps);

    httpClient = createSupertestSharedClient(agencyRoutes, deps.request);

    inMemoryUow.agencyRepository.setAgencies([]);
    gateways.timeGateway.defaultDate = new Date();

    adminToken = (
      await deps.request.post("/admin/login").send({
        user: deps.appConfig.backofficeUsername,
        password: deps.appConfig.backofficePassword,
      })
    ).body;
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

        const response = await httpClient.getFilteredAgencies({
          queryParams: { departmentCode: "20" },
        });

        expectHttpResponseToEqual(response, {
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
        const response = await httpClient.getAgencyPublicInfoById({
          queryParams: { agencyId: agency1ActiveNearBy.id },
        });
        expectHttpResponseToEqual(response, {
          status: 200,
          body: {
            id: "test-agency-1",
            name: "Test Agency 1",
            kind: "autre",
            address: {
              city: "Paris",
              departmentCode: "20",
              postcode: "75002",
              streetNumberAndAddress: "",
            },
            position: {
              lat: 10.11,
              lon: 10.12,
            },
            agencySiret: "12345678904444",
            signature: "empty-signature",
            refersToAgency: null,
            logoUrl: null,
          },
        });
      });

      it("Returns agency public info without refersToAgency", async () => {
        // Prepare
        await inMemoryUow.agencyRepository.insert(agency1ActiveNearBy);

        // Act and assert
        const response = await httpClient.getAgencyPublicInfoById({
          queryParams: { agencyId: agency1ActiveNearBy.id },
        });
        expectHttpResponseToEqual(response, {
          status: 200,
          body: {
            id: "test-agency-1",
            name: "Test Agency 1",
            kind: "autre",
            address: {
              city: "Paris",
              departmentCode: "20",
              postcode: "75002",
              streetNumberAndAddress: "",
            },
            position: {
              lat: 10.11,
              lon: 10.12,
            },
            agencySiret: "12345678904444",
            signature: "empty-signature",
            logoUrl: null,
            refersToAgency: null,
          },
        });
      });
    });

    describe(`${displayRouteName(
      agencyRoutes.addAgency,
    )} to add Agency`, () => {
      const parisMissionLocaleParams: CreateAgencyDto = {
        id: "some-id",
        address: {
          streetNumberAndAddress: "Agency 1 address",
          city: "Paris",
          postcode: "75001",
          departmentCode: "75",
        },
        counsellorEmails: ["counsellor@mail.com"],
        validatorEmails: ["validator@mail.com"],
        kind: "mission-locale",
        name: "Mission locale de Paris",
        position: { lat: 10, lon: 20 },
        questionnaireUrl: "https://www.myUrl.com",
        signature: "Super signature of the agency",
        agencySiret: TEST_OPEN_ESTABLISHMENT_1.siret,
        refersToAgencyId: null,
        logoUrl: null,
      };

      it("200 - support posting valid agency", async () => {
        const response = await httpClient.addAgency({
          body: parisMissionLocaleParams,
        });

        expectHttpResponseToEqual(response, {
          status: 200,
          body: "",
        });

        const {
          refersToAgencyId: _,
          ...parisMissionLocaleParamsWithoutRefersToAgencyId
        } = parisMissionLocaleParams;

        expectToEqual(inMemoryUow.agencyRepository.agencies, [
          {
            ...parisMissionLocaleParamsWithoutRefersToAgencyId,
            questionnaireUrl: parisMissionLocaleParams.questionnaireUrl,
            adminEmails: [],
            status: "needsReview",
            refersToAgencyId: null,
            codeSafir: null,
            rejectionJustification: null,
          },
        ]);
      });

      it("404 - siret not valid", async () => {
        const missionLocaleWithBadSiret: CreateAgencyDto = {
          ...parisMissionLocaleParams,
          agencySiret: "12345678909999",
        };

        const response = await httpClient.addAgency({
          body: missionLocaleWithBadSiret,
        });

        expectHttpResponseToEqual(response, {
          status: 404,
          body: {
            errors: invalidAgencySiretMessage,
          },
        });

        expectToEqual(inMemoryUow.agencyRepository.agencies, []);
      });
    });
  });

  describe("Private routes (for backoffice admin)", () => {
    describe(`${displayRouteName(
      agencyRoutes.listAgenciesWithStatus,
    )} to get agencies full dto given filters`, () => {
      it("Returns Forbidden if no token provided", async () => {
        const response = await httpClient.listAgenciesWithStatus({
          queryParams: { status: "needsReview" },
          headers: { authorization: "" },
        });

        expectHttpResponseToEqual(response, {
          status: 401,
          body: { error: "You need to authenticate first" },
        });
      });

      it("Returns all agency dtos with a given status", async () => {
        // Prepare
        await Promise.all(
          [agency1ActiveNearBy, agency4NeedsReview].map(
            async (saveAgencyParams) =>
              inMemoryUow.agencyRepository.insert(saveAgencyParams),
          ),
        );

        const response = await httpClient.listAgenciesWithStatus({
          queryParams: { status: "needsReview" },
          headers: { authorization: adminToken },
        });

        expectHttpResponseToEqual(response, {
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

        const response = await httpClient.updateAgencyStatus({
          headers: { authorization: adminToken },
          body: { status: "active" },
          urlParams: { agencyId: agency4NeedsReview.id },
        });

        expectHttpResponseToEqual(response, {
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
        const updatedAgency = new AgencyDtoBuilder()
          .withId(agency4NeedsReview.id)
          .withValidatorEmails(["this-is-a-new-validator@mail.com"])
          .withCodeSafir("1234")
          .build();

        const response = await httpClient.updateAgency({
          headers: { authorization: "wrong-token" },
          urlParams: { agencyId: "test-agency-4" },
          body: updatedAgency,
        });

        expectHttpResponseToEqual(response, {
          status: 401,
          body: { error: "Provided token is invalid" },
        });
      });

      it("Updates the agency and returns code 200", async () => {
        // Prepare
        await inMemoryUow.agencyRepository.setAgencies([agency4NeedsReview]);

        const updatedAgency = new AgencyDtoBuilder()
          .withId(agency4NeedsReview.id)
          .withValidatorEmails(["this-is-a-new-validator@mail.com"])
          .withCodeSafir("1234")
          .build();

        const response = await httpClient.updateAgency({
          headers: { authorization: adminToken },
          urlParams: { agencyId: agency4NeedsReview.id },
          body: updatedAgency,
        });

        expectHttpResponseToEqual(response, {
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
