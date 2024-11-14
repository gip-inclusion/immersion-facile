import { addDays } from "date-fns";
import {
  AddressDto,
  AgencyDtoBuilder,
  AgencyRoutes,
  CreateAgencyDto,
  InclusionConnectJwt,
  InclusionConnectedUserBuilder,
  agencyRoutes,
  currentJwtVersions,
  displayRouteName,
  errors,
  expectHttpResponseToEqual,
  expectToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import { GenerateInclusionConnectJwt } from "../../../../domains/core/jwt";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../../domains/core/sirene/adapters/InMemorySiretGateway";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { toAgencyWithRights } from "../../../../utils/agency";
import { InMemoryGateways, buildTestApp } from "../../../../utils/buildTestApp";
import { processEventsForEmailToBeSent } from "../../../../utils/processEventsForEmailToBeSent";

describe("Agency routes", () => {
  const defaultAddress: AddressDto = {
    streetNumberAndAddress: "",
    postcode: "75002",
    departmentCode: "75",
    city: "Paris",
  };

  const backofficeAdminUser = new InclusionConnectedUserBuilder()
    .withIsAdmin(true)
    .buildUser();

  let httpClient: HttpClient<AgencyRoutes>;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let eventCrawler: BasicEventCrawler;
  let backofficeAdminToken: InclusionConnectJwt;
  let generateInclusionConnectJwt: GenerateInclusionConnectJwt;

  beforeEach(async () => {
    const deps = await buildTestApp();
    ({ gateways, eventCrawler, inMemoryUow, generateInclusionConnectJwt } =
      deps);

    httpClient = createSupertestSharedClient(agencyRoutes, deps.request);

    inMemoryUow.agencyRepository.agencies = [];
    inMemoryUow.userRepository.users = [backofficeAdminUser];
    gateways.timeGateway.defaultDate = new Date();

    backofficeAdminToken = generateInclusionConnectJwt({
      userId: backofficeAdminUser.id,
      version: currentJwtVersions.inclusion,
      iat: new Date().getTime(),
      exp: addDays(new Date(), 5).getTime(),
    });
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
    .withAddress(defaultAddress)
    .build();
  const validator = new InclusionConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@mail.com")
    .buildUser();

  describe("Public Routes", () => {
    describe(`${displayRouteName(
      agencyRoutes.getAgencyOptionsByFilter,
    )} get agencies with name and position given filters`, () => {
      it("Returns agency list with name and position nearby a given position", async () => {
        // Prepare
        inMemoryUow.agencyRepository.agencies = [
          toAgencyWithRights(agency1ActiveNearBy),
          toAgencyWithRights(agency2ActiveNearBy),
          toAgencyWithRights(agency3ActiveFarAway),
          toAgencyWithRights(agency4NeedsReview, {
            [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
          }),
        ];

        const response = await httpClient.getAgencyOptionsByFilter({
          queryParams: { departmentCode: "20" },
        });

        expectHttpResponseToEqual(response, {
          status: 200,
          body: [
            {
              id: agency1ActiveNearBy.id,
              name: `${agency1ActiveNearBy.name} (${agency1ActiveNearBy.address.city})`,
              kind: agency1ActiveNearBy.kind,
              status: agency1ActiveNearBy.status,
            },
            {
              id: agency2ActiveNearBy.id,
              name: `${agency2ActiveNearBy.name} (${agency2ActiveNearBy.address.city})`,
              kind: agency2ActiveNearBy.kind,
              status: agency2ActiveNearBy.status,
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
        inMemoryUow.agencyRepository.agencies = [
          toAgencyWithRights(agency1ActiveNearBy),
        ];

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
        inMemoryUow.agencyRepository.agencies = [
          toAgencyWithRights(agency1ActiveNearBy),
        ];

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
        coveredDepartments: ["75"],
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
        refersToAgencyName: null,
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

        const validator = await inMemoryUow.userRepository.findByEmail(
          parisMissionLocaleParams.validatorEmails[0],
        );
        if (!validator) throw new Error("Missing validator user");
        const counsellor = await inMemoryUow.userRepository.findByEmail(
          parisMissionLocaleParams.counsellorEmails[0],
        );
        if (!counsellor) throw new Error("Missing counsellor user");

        expectToEqual(inMemoryUow.userRepository.users, [
          backofficeAdminUser,
          validator,
          counsellor,
        ]);
        expectToEqual(inMemoryUow.agencyRepository.agencies, [
          toAgencyWithRights(
            {
              ...parisMissionLocaleParamsWithoutRefersToAgencyId,
              questionnaireUrl: parisMissionLocaleParams.questionnaireUrl,
              status: "needsReview",
              refersToAgencyId: null,
              codeSafir: null,
              rejectionJustification: null,
              counsellorEmails: [],
              validatorEmails: [],
            },
            {
              [validator.id]: {
                isNotifiedByEmail: true,
                roles: ["validator"],
              },
              [counsellor.id]: {
                isNotifiedByEmail: true,
                roles: ["counsellor"],
              },
            },
          ),
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
            status: 404,
            message: errors.agency.invalidSiret({
              siret: missionLocaleWithBadSiret.agencySiret,
            }).message,
          },
        });

        expectToEqual(inMemoryUow.agencyRepository.agencies, []);
      });
    });
  });

  describe("Private routes (for backoffice admin)", () => {
    describe(`${displayRouteName(
      agencyRoutes.listAgenciesOptionsWithStatus,
    )} to get agencies full dto given filters`, () => {
      it("Returns Forbidden if no token provided", async () => {
        const response = await httpClient.listAgenciesOptionsWithStatus({
          queryParams: { status: "needsReview" },
          headers: { authorization: "" },
        });

        expectHttpResponseToEqual(response, {
          status: 401,
          body: { status: 401, message: "Veuillez vous authentifier" },
        });
      });

      it("Returns all agency dtos with a given status", async () => {
        // Prepare
        inMemoryUow.agencyRepository.agencies = [
          toAgencyWithRights(agency1ActiveNearBy),
          toAgencyWithRights(agency4NeedsReview, {
            [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
          }),
        ];

        const response = await httpClient.listAgenciesOptionsWithStatus({
          queryParams: { status: "needsReview" },
          headers: { authorization: backofficeAdminToken },
        });

        expectHttpResponseToEqual(response, {
          status: 200,
          body: [
            {
              id: agency4NeedsReview.id,
              name: agency4NeedsReview.name,
              kind: agency4NeedsReview.kind,
              status: agency4NeedsReview.status,
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
        inMemoryUow.agencyRepository.agencies = [
          toAgencyWithRights(agency4NeedsReview, {
            [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
          }),
        ];
        inMemoryUow.userRepository.users = [validator, backofficeAdminUser];

        const response = await httpClient.updateAgencyStatus({
          headers: { authorization: backofficeAdminToken },
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
        const response = await httpClient.updateAgency({
          headers: { authorization: "wrong-token" },
          urlParams: { agencyId: "test-agency-4" },
          body: {
            ...new AgencyDtoBuilder()
              .withId(agency4NeedsReview.id)
              .withCodeSafir("1234")
              .build(),
            validatorEmails: ["this-is-a-new-validator@mail.com"],
          },
        });

        expectHttpResponseToEqual(response, {
          status: 401,
          body: { status: 401, message: "Provided token is invalid" },
        });
      });

      it("Updates the agency and returns code 200", async () => {
        // Prepare
        inMemoryUow.agencyRepository.agencies = [
          toAgencyWithRights(agency4NeedsReview, {
            [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
          }),
        ];

        const response = await httpClient.updateAgency({
          headers: { authorization: backofficeAdminToken },
          urlParams: { agencyId: agency4NeedsReview.id },
          body: {
            ...new AgencyDtoBuilder()
              .withId(agency4NeedsReview.id)
              .withCodeSafir("1234")
              .build(),
            validatorEmails: ["this-is-a-new-validator@mail.com"],
          },
        });

        expectHttpResponseToEqual(response, {
          status: 200,
          body: "",
        });

        expectToEqual(inMemoryUow.agencyRepository.agencies, [
          toAgencyWithRights(
            new AgencyDtoBuilder()
              .withId(agency4NeedsReview.id)
              .withCodeSafir("1234")
              .build(),
            {
              [validator.id]: {
                isNotifiedByEmail: false,
                roles: ["validator"],
              },
            },
          ),
        ]);

        expect(inMemoryUow.outboxRepository.events).toHaveLength(1);
      });
    });
  });
});
