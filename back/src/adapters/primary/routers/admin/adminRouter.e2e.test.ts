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
  expectHttpResponseToEqual,
  expectObjectsToMatch,
  expectToEqual,
  makeBooleanFeatureFlag,
  makeTextFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
  technicalRoutes,
} from "shared";
import { HttpClient } from "shared-routes";
import { ResponsesToHttpResponse } from "shared-routes/src/defineRoutes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { ZodError } from "zod";
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

    inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
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
          errors: new ZodError([
            {
              code: "invalid_union",
              unionErrors: [
                new ZodError([
                  {
                    code: "invalid_union",
                    unionErrors: [
                      new ZodError([
                        {
                          received: "unknown-dashboard",
                          code: "invalid_enum_value",
                          options: [
                            "conventions",
                            "events",
                            "establishments",
                            "agencies",
                          ],
                          path: ["name"],
                          message:
                            "Vous devez sélectionner une option parmi celles proposées",
                        },
                      ]),
                      new ZodError([
                        {
                          received: "unknown-dashboard",
                          code: "invalid_enum_value",
                          options: ["agencyForAdmin"],
                          path: ["name"],
                          message:
                            "Vous devez sélectionner une option parmi celles proposées",
                        },
                        {
                          code: "invalid_type",
                          expected: "string",
                          received: "undefined",
                          path: ["agencyId"],
                          message: "Required",
                        },
                      ]),
                    ],
                    path: [],
                    message: "Invalid input",
                  },
                ]),
                new ZodError([
                  {
                    received: "unknown-dashboard",
                    code: "invalid_enum_value",
                    options: ["conventionStatus"],
                    path: ["name"],
                    message:
                      "Vous devez sélectionner une option parmi celles proposées",
                  },
                  {
                    code: "invalid_type",
                    expected: "string",
                    received: "undefined",
                    path: ["conventionId"],
                    message: "Required",
                  },
                ]),
              ],
              path: [],
              message: "Invalid input",
            },
          ]).toString(),
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
          errors:
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
        body: { error: "You need to authenticate first" },
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
        body: { error: "Provided token is invalid" },
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
        makeTextFeatureFlag(false, { message: "Maintenance message" }),
      );

      const params: SetFeatureFlagParam = {
        flagName: "enableMaintenance",
        featureFlag: makeTextFeatureFlag(true, {
          message: "Updated Maintenance message",
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
        makeTextFeatureFlag(true, {
          message: "Updated Maintenance message",
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
        body: { error: "Provided token is invalid" },
      });
    });
  });

  describe(`${displayRouteName(
    adminRoutes.getInclusionConnectedUsers,
  )} List inclusion connected user`, () => {
    it("200 - Gets the list of connected users with role 'toReview'", async () => {
      const response = await sharedRequest.getInclusionConnectedUsers({
        queryParams: { agencyRole: "toReview" },
        headers: { authorization: token },
      });
      expectHttpResponseToEqual(response, {
        status: 200,
        body: [],
      });
    });

    it("401 - missing token", async () => {
      const response = await sharedRequest.getInclusionConnectedUsers({
        queryParams: { agencyRole: "toReview" },
        headers: { authorization: "" },
      });
      expectHttpResponseToEqual(response, {
        status: 401,
        body: { error: "You need to authenticate first" },
      });
    });
  });

  describe(`${displayRouteName(
    adminRoutes.updateUserRoleForAgency,
  )} Update user role for agency`, () => {
    it("201 - Updates role of user form 'toReview' to 'counsellor' for given agency", async () => {
      const agency = new AgencyDtoBuilder().build();
      const inclusionConnectedUser: InclusionConnectedUser = {
        id: "my-user-id",
        email: "john@mail.com",
        firstName: "John",
        lastName: "Doe",
        agencyRights: [
          { agency, roles: ["toReview"], isNotifiedByEmail: false },
        ],
        dashboards: { agencies: {}, establishments: {} },
        externalId: "john-external-id",
        createdAt: new Date().toISOString(),
      };

      inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        inclusionConnectedUser,
        backofficeAdminUser,
      ]);

      const updatedRole: AgencyRole = "counsellor";

      const response = await sharedRequest.updateUserRoleForAgency({
        body: {
          agencyId: agency.id,
          userId: inclusionConnectedUser.id,
          roles: [updatedRole],
        },
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 201,
        body: "",
      });

      expectObjectsToMatch(
        inMemoryUow.inclusionConnectedUserRepository.agencyRightsByUserId,
        {
          [inclusionConnectedUser.id]: [
            { agency, roles: [updatedRole], isNotifiedByEmail: false },
          ],
        },
      );
    });

    it("401 - missing admin token", async () => {
      const response = await sharedRequest.updateUserRoleForAgency({
        body: {
          agencyId: "yo",
          userId: "yolo",
          roles: ["counsellor"],
        },
        headers: { authorization: "" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { error: "You need to authenticate first" },
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
          { agency, roles: ["toReview"], isNotifiedByEmail: false },
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
        },
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 404,
        body: { errors: "User with id my-user-id not found" },
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
          { agency, roles: ["toReview"], isNotifiedByEmail: false },
        ],
        dashboards: { agencies: {}, establishments: {} },
        externalId: "john-external-id",
        createdAt: new Date().toISOString(),
      };

      inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
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

      expectObjectsToMatch(
        inMemoryUow.inclusionConnectedUserRepository.agencyRightsByUserId,
        {
          [inclusionConnectedUser.id]: [],
        },
      );

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
        body: { error: "You need to authenticate first" },
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
        body: { error: "You need to authenticate first" },
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
        body: { error: "Provided token is invalid" },
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
        body: { error: "You need to authenticate first" },
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
        body: { error: "Provided token is invalid" },
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
