import { addDays } from "date-fns";
import {
  AdminRoutes,
  AgencyDtoBuilder,
  AgencyRole,
  ApiConsumer,
  ApiConsumerJwt,
  FeatureFlags,
  InclusionConnectJwt,
  InclusionConnectJwtPayload,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  SetFeatureFlagParam,
  adminRoutes,
  createApiConsumerParamsFromApiConsumer,
  currentJwtVersions,
  displayRouteName,
  errors,
  expectHttpResponseToEqual,
  expectObjectsToMatch,
  expectToEqual,
  makeBooleanFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
  makeTextWithSeverityFeatureFlag,
  technicalRoutes,
} from "shared";
import { HttpClient } from "shared-routes";
import { ResponsesToHttpResponse } from "shared-routes/src/defineRoutes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { authorizedUnJeuneUneSolutionApiConsumer } from "../../../../domains/core/api-consumer/adapters/InMemoryApiConsumerRepository";
import { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import {
  GenerateApiConsumerJwt,
  GenerateInclusionConnectJwt,
  makeVerifyJwtES256,
} from "../../../../domains/core/jwt";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { InMemoryGateways, buildTestApp } from "../../../../utils/buildTestApp";
import { processEventsForEmailToBeSent } from "../../../../utils/processEventsForEmailToBeSent";

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withId("backoffice-admin-user")
  .withIsAdmin(true)
  .build();

const backofficeAdminJwtPayload: InclusionConnectJwtPayload = {
  version: currentJwtVersions.inclusion,
  iat: new Date().getTime(),
  exp: addDays(new Date(), 30).getTime(),
  userId: backofficeAdminUser.id,
};

describe("Admin router", () => {
  const now = new Date();
  let sharedRequest: HttpClient<AdminRoutes>;
  let token: InclusionConnectJwt;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let appConfig: AppConfig;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;
  let generateInclusionConnectJwt: GenerateInclusionConnectJwt;
  let getFeatureFlags: () => Promise<FeatureFlags>;
  let eventCrawler: BasicEventCrawler;

  beforeEach(async () => {
    const testDepsAndApp = await buildTestApp(
      new AppConfigBuilder()
        .withConfigParams({
          BACKOFFICE_USERNAME: "user",
          BACKOFFICE_PASSWORD: "pwd",
        })
        .build(),
    );
    const { request } = testDepsAndApp;
    ({
      gateways,
      inMemoryUow,
      appConfig,
      generateApiConsumerJwt,
      eventCrawler,
      generateInclusionConnectJwt,
    } = testDepsAndApp);

    sharedRequest = createSupertestSharedClient(adminRoutes, request);

    inMemoryUow.userRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
    ]);

    gateways.timeGateway.defaultDate = now;
    token = generateInclusionConnectJwt(backofficeAdminJwtPayload);

    getFeatureFlags = async () => {
      const { body } = await request.get(technicalRoutes.featureFlags.url);
      return body;
    };
  });

  describe(`${displayRouteName(
    adminRoutes.getDashboardUrl,
  )} Get dashboard Absolute Url`, () => {
    it("200 - Gets the absolute Url of the events dashboard", async () => {
      const response = await sharedRequest.getDashboardUrl({
        urlParams: { dashboardName: "events" },
        headers: { authorization: token },
        queryParams: {},
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: {
          name: "events",
          url: `http://stubDashboard/events/${gateways.timeGateway.now()}`,
        },
      });
    });

    it("200 - Gets the absolute Url of the establishments dashboard", async () => {
      const response = await sharedRequest.getDashboardUrl({
        urlParams: { dashboardName: "establishments" },
        headers: { authorization: token },
        queryParams: {},
      });
      expectHttpResponseToEqual(response, {
        status: 200,
        body: {
          name: "establishments",
          url: `http://stubDashboard/establishments/${gateways.timeGateway.now()}`,
        },
      });
    });

    it("200 - Gets the absolute Url of the agency dashboard", async () => {
      const agencyId = "my-agency-id";
      const response = await sharedRequest.getDashboardUrl({
        urlParams: { dashboardName: "agencyForAdmin" },
        headers: { authorization: token },
        queryParams: { agencyId: agencyId },
      });
      expectHttpResponseToEqual(response, {
        status: 200,
        body: {
          name: "agencyForAdmin",
          url: `http://stubAgencyForAdminDashboard/${agencyId}/${gateways.timeGateway.now()}`,
        },
      });
    });

    it("400 - unknown dashboard", async () => {
      const response = await sharedRequest.getDashboardUrl({
        urlParams: { dashboardName: "unknown-dashboard" },
        headers: { authorization: token },
        queryParams: {},
      });

      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          status: 400,
          message: "Schema validation failed. See issues for details.",
          issues: [
            "name : Vous devez sélectionner une option parmi celles proposées",
            "agencyId : Required",
            "conventionId : Required",
          ],
        },
      });
    });

    it("400 - no agencyId is provided for agency dashboard", async () => {
      const response = await sharedRequest.getDashboardUrl({
        urlParams: { dashboardName: "agency" },
        headers: { authorization: token },
        queryParams: {},
      });

      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          status: 400,
          message:
            "You need to provide agency Id in query params : http://.../agency?agencyId=your-id",
        },
      });
    });

    it("401 - Unauthorized without admin token", async () => {
      const response = await sharedRequest.getDashboardUrl({
        urlParams: { dashboardName: "whatever" },
        headers: { authorization: "" },
        queryParams: {},
      });
      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: "Veuillez vous authentifier" },
      });
    });

    it("401 - token is not valid", async () => {
      const response = await sharedRequest.getDashboardUrl({
        urlParams: { dashboardName: "whatever" },
        headers: { authorization: "wrong-token" },
        queryParams: {},
      });
      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: "Provided token is invalid" },
      });
    });
  });

  describe(`${displayRouteName(
    adminRoutes.updateFeatureFlags,
  )} To set or update a feature flag`, () => {
    it("201 - sets the feature flag to given value if token is valid", async () => {
      const initialFeatureFlags = await getFeatureFlags();
      expectToEqual(
        initialFeatureFlags.enableTemporaryOperation,
        makeTextImageAndRedirectFeatureFlag(false, {
          imageAlt: "altImage",
          imageUrl: "https://imageUrl",
          message: "message",
          redirectUrl: "https://redirectUrl",
          overtitle: "overtitle",
          title: "title",
        }),
      );

      const response = await sharedRequest.updateFeatureFlags({
        body: {
          flagName: "enableTemporaryOperation",
          featureFlag: makeTextImageAndRedirectFeatureFlag(true, {
            imageAlt: "updatedAltImage",
            imageUrl: "https://updatedImageUrl",
            message: "message",
            redirectUrl: "https://updatedRedirectUrl",
            overtitle: "overtitle",
            title: "title",
          }),
        },
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 201,
        body: "",
      });

      const updatedFeatureFlags = await getFeatureFlags();
      expectToEqual(
        updatedFeatureFlags.enableTemporaryOperation,
        makeTextImageAndRedirectFeatureFlag(true, {
          imageAlt: "updatedAltImage",
          imageUrl: "https://updatedImageUrl",
          message: "message",
          redirectUrl: "https://updatedRedirectUrl",
          overtitle: "overtitle",
          title: "title",
        }),
      );
    });

    it("201 - sets the feature flag to given value if token is valid with value", async () => {
      const initialFeatureFlags = await getFeatureFlags();
      expectToEqual(
        initialFeatureFlags.enableMaintenance,
        makeTextWithSeverityFeatureFlag(false, {
          message: "Maintenance message",
          severity: "warning",
        }),
      );

      const params: SetFeatureFlagParam = {
        flagName: "enableMaintenance",
        featureFlag: makeTextWithSeverityFeatureFlag(true, {
          message: "Updated Maintenance message",
          severity: "success",
        }),
      };

      const response = await sharedRequest.updateFeatureFlags({
        body: params,
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 201,
        body: "",
      });

      const updatedFeatureFlags = await getFeatureFlags();
      expectToEqual(
        updatedFeatureFlags.enableMaintenance,
        makeTextWithSeverityFeatureFlag(true, {
          message: "Updated Maintenance message",
          severity: "success",
        }),
      );
    });

    it("201 - sets the feature flag to given value if token is valid with boolean value", async () => {
      const initialFeatureFlags = await getFeatureFlags();
      expectToEqual(
        initialFeatureFlags.enableSearchByScore,
        makeBooleanFeatureFlag(false),
      );

      const updateParams: SetFeatureFlagParam = {
        flagName: "enableSearchByScore",
        featureFlag: makeBooleanFeatureFlag(true),
      };

      const response = await sharedRequest.updateFeatureFlags({
        body: updateParams,
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 201,
        body: "",
      });

      const updatedFeatureFlags = await getFeatureFlags();
      expectToEqual(
        updatedFeatureFlags.enableSearchByScore,
        makeBooleanFeatureFlag(true),
      );
    });

    it("401 - wrong admin token", async () => {
      const response = await sharedRequest.updateFeatureFlags({
        body: {
          flagName: "enableTemporaryOperation",
          featureFlag: makeTextImageAndRedirectFeatureFlag(true, {
            imageAlt: "altImage",
            imageUrl: "https://imageUrl",
            message: "message",
            redirectUrl: "https://redirectUrl",
            overtitle: "overtitle",
            title: "title",
          }),
        },
        headers: { authorization: "wrong-token" },
      });
      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: "Provided token is invalid" },
      });
    });
  });

  describe(`${displayRouteName(
    adminRoutes.getInclusionConnectedUsers,
  )} List inclusion connected user`, () => {
    it("200 - Gets the list of connected users with role 'to-review'", async () => {
      const response = await sharedRequest.getInclusionConnectedUsers({
        queryParams: { agencyRole: "to-review" },
        headers: { authorization: token },
      });
      expectHttpResponseToEqual(response, {
        status: 200,
        body: [],
      });
    });

    it("401 - missing token", async () => {
      const response = await sharedRequest.getInclusionConnectedUsers({
        queryParams: { agencyRole: "to-review" },
        headers: { authorization: "" },
      });
      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: "Veuillez vous authentifier" },
      });
    });
  });

  describe(`${displayRouteName(
    adminRoutes.updateUserRoleForAgency,
  )} Update user role for agency`, () => {
    it("201 - Updates role of user from 'to-review' to 'counsellor' for given agency", async () => {
      const agency = new AgencyDtoBuilder()
        .withId("two-steps-validation-agency")
        .withCounsellorEmails(["fake-email@gmail.com"])
        .build();
      const inclusionConnectedUser: InclusionConnectedUser = {
        id: "my-user-id",
        email: "john@mail.com",
        firstName: "John",
        lastName: "Doe",
        agencyRights: [
          { agency, roles: ["to-review"], isNotifiedByEmail: false },
        ],
        dashboards: { agencies: {}, establishments: {} },
        externalId: "john-external-id",
        createdAt: new Date().toISOString(),
      };
      const validatorInAgency = new InclusionConnectedUserBuilder()
        .withAgencyRights([
          { roles: ["validator"], agency, isNotifiedByEmail: true },
        ])
        .build();

      inMemoryUow.agencyRepository.insert(agency);
      inMemoryUow.userRepository.setInclusionConnectedUsers([
        inclusionConnectedUser,
        validatorInAgency,
        backofficeAdminUser,
      ]);

      const updatedRole: AgencyRole = "counsellor";

      const response = await sharedRequest.updateUserRoleForAgency({
        body: {
          agencyId: agency.id,
          userId: inclusionConnectedUser.id,
          roles: [updatedRole],
          isNotifiedByEmail: false,
          email: inclusionConnectedUser.email,
        },
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 201,
        body: "",
      });

      expectObjectsToMatch(inMemoryUow.userRepository.agencyRightsByUserId, {
        [inclusionConnectedUser.id]: [
          { agency, roles: [updatedRole], isNotifiedByEmail: false },
        ],
      });
    });

    it("400 - when trying to Update role of user from 'to-review' to 'counsellor' for agency that have only one step validation", async () => {
      const agency = new AgencyDtoBuilder().build();
      const inclusionConnectedUser: InclusionConnectedUser = {
        id: "my-user-id",
        email: "john@mail.com",
        firstName: "John",
        lastName: "Doe",
        agencyRights: [
          { agency, roles: ["to-review"], isNotifiedByEmail: false },
        ],
        dashboards: { agencies: {}, establishments: {} },
        externalId: "john-external-id",
        createdAt: new Date().toISOString(),
      };
      const validatorInAgency = new InclusionConnectedUserBuilder()
        .withAgencyRights([
          { roles: ["validator"], agency, isNotifiedByEmail: true },
        ])
        .build();

      inMemoryUow.agencyRepository.insert(agency);
      inMemoryUow.userRepository.setInclusionConnectedUsers([
        inclusionConnectedUser,
        validatorInAgency,
        backofficeAdminUser,
      ]);

      const updatedRole: AgencyRole = "counsellor";

      const response = await sharedRequest.updateUserRoleForAgency({
        body: {
          agencyId: agency.id,
          userId: inclusionConnectedUser.id,
          roles: [updatedRole],
          isNotifiedByEmail: false,
          email: inclusionConnectedUser.email,
        },
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          message: errors.agency.invalidRoleUpdateForOneStepValidationAgency({
            agencyId: agency.id,
            role: updatedRole,
          }).message,

          status: 400,
        },
      });

      expectObjectsToMatch(inMemoryUow.userRepository.agencyRightsByUserId, {
        [inclusionConnectedUser.id]: [
          { agency, roles: ["to-review"], isNotifiedByEmail: false },
        ],
      });
    });

    it("401 - missing admin token", async () => {
      const response = await sharedRequest.updateUserRoleForAgency({
        body: {
          agencyId: "yo",
          userId: "yolo",
          roles: ["counsellor"],
          isNotifiedByEmail: false,
          email: "any@email.fr",
        },
        headers: { authorization: "" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: "Veuillez vous authentifier" },
      });
    });

    it("404 - Missing user", async () => {
      const agency = new AgencyDtoBuilder().build();
      const inclusionConnectedUser: InclusionConnectedUser = {
        id: "my-user-id",
        email: "john@mail.com",
        firstName: "John",
        lastName: "Doe",
        agencyRights: [
          { agency, roles: ["to-review"], isNotifiedByEmail: false },
        ],
        dashboards: { agencies: {}, establishments: {} },
        externalId: "john-external-id",
        createdAt: new Date().toISOString(),
      };

      const updatedRole: AgencyRole = "counsellor";

      const response = await sharedRequest.updateUserRoleForAgency({
        body: {
          agencyId: agency.id,
          userId: inclusionConnectedUser.id,
          roles: [updatedRole],
          isNotifiedByEmail: false,
          email: inclusionConnectedUser.email,
        },
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 404,
        body: {
          status: 404,
          message: errors.user.notFound({ userId: inclusionConnectedUser.id })
            .message,
        },
      });
    });
  });

  describe(`${displayRouteName(
    adminRoutes.rejectIcUserForAgency,
  )} Reject user registration to agency`, () => {
    it("201 - Reject user registration to agency and send a notification email", async () => {
      const agency = new AgencyDtoBuilder().build();

      const inclusionConnectedUser: InclusionConnectedUser = {
        id: "my-user-id",
        email: "john@mail.com",
        firstName: "John",
        lastName: "Doe",
        agencyRights: [
          { agency, roles: ["to-review"], isNotifiedByEmail: false },
        ],
        dashboards: { agencies: {}, establishments: {} },
        externalId: "john-external-id",
        createdAt: new Date().toISOString(),
      };

      inMemoryUow.userRepository.setInclusionConnectedUsers([
        inclusionConnectedUser,
        backofficeAdminUser,
      ]);

      const response = await sharedRequest.rejectIcUserForAgency({
        body: {
          agencyId: agency.id,
          userId: inclusionConnectedUser.id,
          justification: "osef",
        },
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 201,
        body: "",
      });

      expectObjectsToMatch(inMemoryUow.userRepository.agencyRightsByUserId, {
        [inclusionConnectedUser.id]: [],
      });

      await processEventsForEmailToBeSent(eventCrawler);

      expect(gateways.notification.getSentEmails()).toMatchObject([
        {
          kind: "IC_USER_REGISTRATION_TO_AGENCY_REJECTED",
          recipients: [inclusionConnectedUser.email],
        },
      ]);
    });

    it("401 - missing admin token", async () => {
      const response = await sharedRequest.rejectIcUserForAgency({
        body: {
          agencyId: "yo",
          userId: "yolo",
          justification: "yolo",
        },
        headers: { authorization: "" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: "Veuillez vous authentifier" },
      });
    });
  });

  describe(`${displayRouteName(
    adminRoutes.saveApiConsumer,
  )} saves an api consumer`, () => {
    it("200 - save new api consumer", async () => {
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, []);
      const response = await sharedRequest.saveApiConsumer({
        body: createApiConsumerParamsFromApiConsumer(
          authorizedUnJeuneUneSolutionApiConsumer,
        ),
        headers: { authorization: token },
      });

      // biome-ignore lint/style/noNonNullAssertion:
      const jwt = expectResponseAndReturnJwt(response, {
        status: 200,
        body: expect.any(String),
      })!;

      const { id } = makeVerifyJwtES256<"apiConsumer">(
        appConfig.apiJwtPublicKey,
      )(jwt);

      expectToEqual(id, authorizedUnJeuneUneSolutionApiConsumer.id);
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, [
        {
          ...authorizedUnJeuneUneSolutionApiConsumer,
          createdAt: now.toISOString(),
        },
      ]);
    });

    it("200 - save existing api consumer", async () => {
      inMemoryUow.apiConsumerRepository.consumers = [
        authorizedUnJeuneUneSolutionApiConsumer,
      ];

      const updatedApiConsumer: ApiConsumer = {
        ...authorizedUnJeuneUneSolutionApiConsumer,
        rights: {
          searchEstablishment: {
            kinds: [],
            scope: "no-scope",
            subscriptions: [],
          },
          convention: {
            kinds: [],
            scope: {
              agencyKinds: [],
            },
            subscriptions: [],
          },
          statistics: {
            kinds: [],
            scope: "no-scope",
            subscriptions: [],
          },
        },
      };

      const response = await sharedRequest.saveApiConsumer({
        body: createApiConsumerParamsFromApiConsumer(updatedApiConsumer),
        headers: { authorization: token },
      });

      // biome-ignore lint/style/noNonNullAssertion:
      const jwt = expectResponseAndReturnJwt(response, {
        status: 200,
        body: "",
      })!;

      expect(jwt).toBe("");
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, [
        updatedApiConsumer,
      ]);
    });

    it("401 - without auth", async () => {
      const response = await sharedRequest.saveApiConsumer({
        body: createApiConsumerParamsFromApiConsumer(
          authorizedUnJeuneUneSolutionApiConsumer,
        ),
        headers: { authorization: "" },
      });

      expectResponseAndReturnJwt(response, {
        status: 401,
        body: { message: "Veuillez vous authentifier", status: 401 },
      });
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, []);
    });

    it("401 - not with backOfficeJwt", async () => {
      const response = await sharedRequest.saveApiConsumer({
        body: createApiConsumerParamsFromApiConsumer(
          authorizedUnJeuneUneSolutionApiConsumer,
        ),
        headers: { authorization: generateApiConsumerJwt({ id: "osef" }) },
      });

      expectResponseAndReturnJwt(response, {
        status: 401,
        body: { status: 401, message: "Provided token is invalid" },
      });
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, []);
    });
  });

  describe(`${displayRouteName(
    adminRoutes.getAllApiConsumers,
  )} gets all api consumers`, () => {
    it("200 - gets all api consumers", async () => {
      const response = await sharedRequest.getAllApiConsumers({
        headers: { authorization: token },
      });
      expectHttpResponseToEqual(response, {
        status: 200,
        body: [],
      });
    });

    it("401 - without auth", async () => {
      const response = await sharedRequest.getAllApiConsumers({
        headers: { authorization: "" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: "Veuillez vous authentifier" },
      });
    });

    it("401 - not with backOfficeJwt", async () => {
      const response = await sharedRequest.saveApiConsumer({
        body: createApiConsumerParamsFromApiConsumer(
          authorizedUnJeuneUneSolutionApiConsumer,
        ),
        headers: { authorization: generateApiConsumerJwt({ id: "osef" }) },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: "Provided token is invalid" },
      });
    });
  });

  describe(`${displayRouteName(
    adminRoutes.getUsers,
  )} gets users appling filters`, () => {
    it("200 - gets all users matching the query", async () => {
      const response = await sharedRequest.getUsers({
        headers: { authorization: token },
        queryParams: { emailContains: "yolo" },
      });
      expectHttpResponseToEqual(response, {
        status: 200,
        body: [],
      });
    });

    it("401 - without auth", async () => {
      const response = await sharedRequest.getUsers({
        headers: { authorization: "" },
        queryParams: { emailContains: "yolo" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: "Veuillez vous authentifier" },
      });
    });

    it("401 - not with backOfficeJwt", async () => {
      const response = await sharedRequest.getUsers({
        body: createApiConsumerParamsFromApiConsumer(
          authorizedUnJeuneUneSolutionApiConsumer,
        ),
        headers: { authorization: generateApiConsumerJwt({ id: "osef" }) },
        queryParams: { emailContains: "yolo" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: "Provided token is invalid" },
      });
    });
  });
});

const expectResponseAndReturnJwt = <
  R extends ResponsesToHttpResponse<
    AdminRoutes["saveApiConsumer"]["responses"]
  >,
>(
  response: R,
  expected: Omit<R, "headers">,
): ApiConsumerJwt | undefined => {
  expectHttpResponseToEqual(response, expected);

  if (response.status === 200) return response.body as ApiConsumerJwt;
};
