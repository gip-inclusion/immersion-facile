import { addDays } from "date-fns";
import {
  type AdminRoutes,
  AgencyDtoBuilder,
  type AgencyRole,
  type ApiConsumer,
  type ApiConsumerJwt,
  adminRoutes,
  type ConnectedUser,
  ConnectedUserBuilder,
  type ConnectedUserJwt,
  type ConnectedUserJwtPayload,
  createApiConsumerParamsFromApiConsumer,
  currentJwtVersions,
  defaultProConnectInfos,
  displayRouteName,
  errors,
  expectHttpResponseToEqual,
  expectObjectsToMatch,
  expectToEqual,
  type FeatureFlags,
  makeBooleanFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
  makeTextWithSeverityFeatureFlag,
  type SetFeatureFlagParam,
  technicalRoutes,
  toAgencyDtoForAgencyUsersAndAdmins,
  type User,
} from "shared";
import type { HttpClient } from "shared-routes";
import type { ResponsesToHttpResponse } from "shared-routes/src/defineRoutes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { invalidTokenMessage } from "../../../../config/bootstrap/connectedUserAuthMiddleware";
import { authorizedUnJeuneUneSolutionApiConsumer } from "../../../../domains/core/api-consumer/adapters/InMemoryApiConsumerRepository";
import type { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import {
  type GenerateApiConsumerJwt,
  type GenerateConnectedUserJwt,
  makeVerifyJwtES256,
} from "../../../../domains/core/jwt";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  buildTestApp,
  type InMemoryGateways,
} from "../../../../utils/buildTestApp";
import { processEventsForEmailToBeSent } from "../../../../utils/processEventsForEmailToBeSent";

describe("Admin router", () => {
  const backofficeAdminUserBuilder = new ConnectedUserBuilder()
    .withId("backoffice-admin-user")
    .withIsAdmin(true);
  const connectedBackofficeAdminUser = backofficeAdminUserBuilder.build();
  const backOfficeAdminUser = backofficeAdminUserBuilder.buildUser();

  const backofficeAdminJwtPayload: ConnectedUserJwtPayload = {
    version: currentJwtVersions.connectedUser,
    iat: Date.now(),
    exp: addDays(new Date(), 30).getTime(),
    userId: connectedBackofficeAdminUser.id,
  };

  const now = new Date();
  let sharedRequest: HttpClient<AdminRoutes>;
  let token: ConnectedUserJwt;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let appConfig: AppConfig;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;
  let generateConnectedUserJwt: GenerateConnectedUserJwt;
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
      generateConnectedUserJwt,
    } = testDepsAndApp);

    sharedRequest = createSupertestSharedClient(adminRoutes, request);

    inMemoryUow.userRepository.users = [backOfficeAdminUser];
    inMemoryUow.agencyRepository.agencies = [];

    gateways.timeGateway.defaultDate = now;
    token = generateConnectedUserJwt(backofficeAdminJwtPayload);

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
          message:
            "Schema validation failed in usecase GetDashboardUrl. See issues for details.",
          issues: [
            "name : Vous devez sélectionner une option parmi celles proposées - valeur fournie : unknown-dashboard",
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
        body: { status: 401, message: invalidTokenMessage },
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
          redirectUrl: "https://redirect-url",
          overtitle: "overtitle",
          title: "title",
        }),
      );

      const response = await sharedRequest.updateFeatureFlags({
        body: {
          flagName: "enableTemporaryOperation",
          featureFlag: makeTextImageAndRedirectFeatureFlag(true, {
            imageAlt: "updatedAltImage",
            imageUrl: "https://updated-image-url",
            message: "message",
            redirectUrl: "https://updated-redirect-url",
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
          imageUrl: "https://updated-image-url",
          message: "message",
          redirectUrl: "https://updated-redirect-url",
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
            redirectUrl: "https://redirect-url",
            overtitle: "overtitle",
            title: "title",
          }),
        },
        headers: { authorization: "wrong-token" },
      });
      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: invalidTokenMessage },
      });
    });
  });

  describe(`${displayRouteName(
    adminRoutes.getConnectedUsers,
  )} List connected users`, () => {
    it("200 - Gets the list of connected users with role 'to-review'", async () => {
      const response = await sharedRequest.getConnectedUsers({
        queryParams: { agencyRole: "to-review" },
        headers: { authorization: token },
      });
      expectHttpResponseToEqual(response, {
        status: 200,
        body: [],
      });
    });

    it("401 - missing token", async () => {
      const response = await sharedRequest.getConnectedUsers({
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
    const validatorInAgency = new ConnectedUserBuilder()
      .withId("validator-in-agency")
      .buildUser();

    const counsellorInAgency = new ConnectedUserBuilder()
      .withId("counsellor-in-agency")
      .buildUser();

    const toReviewUser: User = {
      id: "to-review",
      email: "john@mail.com",
      firstName: "John",
      lastName: "Doe",
      proConnect: defaultProConnectInfos,
      createdAt: new Date().toISOString(),
    };

    it("201 - Updates role of user from 'to-review' to 'counsellor' with notification for given agency", async () => {
      const agency = new AgencyDtoBuilder()
        .withId("two-steps-validation-agency")
        .build();

      inMemoryUow.agencyRepository.insert(
        toAgencyWithRights(agency, {
          [validatorInAgency.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
          [counsellorInAgency.id]: {
            isNotifiedByEmail: false,
            roles: ["counsellor"],
          },
          [toReviewUser.id]: { roles: ["to-review"], isNotifiedByEmail: false },
        }),
      );
      inMemoryUow.userRepository.users = [
        toReviewUser,
        validatorInAgency,
        counsellorInAgency,
        backOfficeAdminUser,
      ];

      const updatedRole: AgencyRole = "counsellor";

      const response = await sharedRequest.updateUserRoleForAgency({
        body: {
          agencyId: agency.id,
          userId: toReviewUser.id,
          roles: [updatedRole],
          isNotifiedByEmail: true,
          email: toReviewUser.email,
        },
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 201,
        body: "",
      });

      expectToEqual(inMemoryUow.agencyRepository.agencies, [
        toAgencyWithRights(agency, {
          [validatorInAgency.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
          [counsellorInAgency.id]: {
            isNotifiedByEmail: false,
            roles: ["counsellor"],
          },
          [toReviewUser.id]: { roles: [updatedRole], isNotifiedByEmail: true },
        }),
      ]);
    });

    it("400 - when trying to Update role of user from 'to-review' to 'counsellor' without notification for agency that have only one step validation", async () => {
      const toReviewUser: User = {
        id: "to-review-user",
        email: "john@mail.com",
        firstName: "John",
        lastName: "Doe",
        proConnect: defaultProConnectInfos,
        createdAt: new Date().toISOString(),
      };

      inMemoryUow.userRepository.users = [
        toReviewUser,
        validatorInAgency,
        backOfficeAdminUser,
      ];

      const agencyWithOneStep = new AgencyDtoBuilder().build();
      inMemoryUow.agencyRepository.insert(
        toAgencyWithRights(agencyWithOneStep, {
          [validatorInAgency.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
          [toReviewUser.id]: { roles: ["to-review"], isNotifiedByEmail: true },
        }),
      );

      const updatedRole: AgencyRole = "counsellor";

      const response = await sharedRequest.updateUserRoleForAgency({
        body: {
          agencyId: agencyWithOneStep.id,
          userId: toReviewUser.id,
          roles: [updatedRole],
          isNotifiedByEmail: false,
          email: toReviewUser.email,
        },
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          message: errors.agency.notEnoughCounsellors({
            agencyId: agencyWithOneStep.id,
          }).message,

          status: 400,
        },
      });

      expectToEqual(inMemoryUow.agencyRepository.agencies, [
        toAgencyWithRights(agencyWithOneStep, {
          [validatorInAgency.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
          [toReviewUser.id]: { roles: ["to-review"], isNotifiedByEmail: true },
        }),
      ]);
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
      const connectedUser: ConnectedUser = {
        id: "my-user-id",
        email: "john@mail.com",
        firstName: "John",
        lastName: "Doe",
        agencyRights: [
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency, []),
            roles: ["to-review"],
            isNotifiedByEmail: false,
          },
        ],
        dashboards: { agencies: {}, establishments: {} },
        proConnect: defaultProConnectInfos,
        createdAt: new Date().toISOString(),
      };

      const updatedRole: AgencyRole = "counsellor";

      const response = await sharedRequest.updateUserRoleForAgency({
        body: {
          agencyId: agency.id,
          userId: connectedUser.id,
          roles: [updatedRole],
          isNotifiedByEmail: false,
          email: connectedUser.email,
        },
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 404,
        body: {
          status: 404,
          message: errors.user.notFound({ userId: connectedUser.id }).message,
        },
      });
    });
  });

  describe(`${displayRouteName(
    adminRoutes.rejectIcUserForAgency,
  )} Reject user registration to agency`, () => {
    it("201 - Reject user registration to agency and send a notification email", async () => {
      const agency = new AgencyDtoBuilder().build();

      const user: User = {
        id: "my-user-id",
        email: "john@mail.com",
        firstName: "John",
        lastName: "Doe",
        proConnect: defaultProConnectInfos,
        createdAt: new Date().toISOString(),
      };

      inMemoryUow.userRepository.users = [user, backOfficeAdminUser];
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [user.id]: { roles: ["to-review"], isNotifiedByEmail: false },
        }),
      ];

      const response = await sharedRequest.rejectIcUserForAgency({
        body: {
          agencyId: agency.id,
          userId: user.id,
          justification: "osef",
        },
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        status: 201,
        body: "",
      });

      expectObjectsToMatch(inMemoryUow.agencyRepository.agencies, [
        toAgencyWithRights(agency, {}),
      ]);

      await processEventsForEmailToBeSent(eventCrawler);

      expect(gateways.notification.getSentEmails()).toMatchObject([
        {
          kind: "IC_USER_REGISTRATION_TO_AGENCY_REJECTED",
          recipients: [user.email],
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

      // biome-ignore lint/style/noNonNullAssertion: testing purpose
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

      // biome-ignore lint/style/noNonNullAssertion: testing purpose
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
        body: { status: 401, message: invalidTokenMessage },
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
        body: { status: 401, message: invalidTokenMessage },
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
        headers: { authorization: generateApiConsumerJwt({ id: "osef" }) },
        queryParams: { emailContains: "yolo" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: invalidTokenMessage },
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
