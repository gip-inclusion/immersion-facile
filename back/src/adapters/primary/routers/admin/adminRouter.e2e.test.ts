import { ZodError } from "zod";
import {
  AdminRoutes,
  adminRoutes,
  AgencyDtoBuilder,
  AgencyRole,
  ApiConsumer,
  ApiConsumerJwt,
  BackOfficeJwt,
  displayRouteName,
  expectToEqual,
  FeatureFlags,
  featureFlagsRoute,
  InclusionConnectedUser,
  makeBooleanFeatureFlag,
  makeTextFeatureFlag,
  SetFeatureFlagParam,
} from "shared";
import { HttpClient } from "shared-routes";
import { ResponsesToHttpResponse } from "shared-routes/src/defineRoutes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import {
  GenerateApiConsumerJwt,
  makeVerifyJwtES256,
} from "../../../../domain/auth/jwt";
import { authorizedUnJeuneUneSolutionApiConsumer } from "../../../secondary/InMemoryApiConsumerRepository";
import { AppConfig } from "../../config/appConfig";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("Admin router", () => {
  let sharedRequest: HttpClient<AdminRoutes>;
  let token: BackOfficeJwt;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let appConfig: AppConfig;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;
  let getFeatureFlags: () => Promise<FeatureFlags>;

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
    ({ gateways, inMemoryUow, appConfig, generateApiConsumerJwt } =
      testDepsAndApp);

    sharedRequest = createSupertestSharedClient(adminRoutes, request);

    gateways.timeGateway.setNextDate(new Date());
    token = await sharedRequest
      .login({ body: { user: "user", password: "pwd" } })
      .then((response) => {
        if (response.status === 200) return response.body;
        throw new Error(response.body.errors);
      });

    getFeatureFlags = async () => {
      const { body } = await request.get(`/${featureFlagsRoute}`);
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

      expectToEqual(response, {
        status: 200,
        body: "http://stubDashboard/events",
      });
    });

    it("200 - Gets the absolute Url of the establishments dashboard", async () => {
      const response = await sharedRequest.getDashboardUrl({
        urlParams: { dashboardName: "establishments" },
        headers: { authorization: token },
        queryParams: {},
      });
      expectToEqual(response, {
        status: 200,
        body: "http://stubDashboard/establishments",
      });
    });

    it("200 - Gets the absolute Url of the agency dashboard", async () => {
      const response = await sharedRequest.getDashboardUrl({
        urlParams: { dashboardName: "agency" },
        headers: { authorization: token },
        queryParams: { agencyId: "my-agency-id" },
      });
      expectToEqual(response, {
        status: 200,
        body: "http://stubAgencyDashboard/my-agency-id",
      });
    });

    it("400 - unknown dashboard", async () => {
      const response = await sharedRequest.getDashboardUrl({
        urlParams: { dashboardName: "unknown-dashboard" },
        headers: { authorization: token },
        queryParams: {},
      });

      expectToEqual(response, {
        status: 400,
        body: {
          errors: `Error: ${new ZodError([
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
                          options: ["conventions", "events", "establishments"],
                          path: ["name"],
                          message:
                            "Invalid enum value. Expected 'conventions' | 'events' | 'establishments', received 'unknown-dashboard'",
                        },
                      ]),
                      new ZodError([
                        {
                          received: "unknown-dashboard",
                          code: "invalid_enum_value",
                          options: ["agency"],
                          path: ["name"],
                          message:
                            "Invalid enum value. Expected 'agency', received 'unknown-dashboard'",
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
                      "Invalid enum value. Expected 'conventionStatus', received 'unknown-dashboard'",
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
          ]).toString()}`,
        },
      });
    });

    it("400 - no agencyId is provided for agency dashboard", async () => {
      const response = await sharedRequest.getDashboardUrl({
        urlParams: { dashboardName: "agency" },
        headers: { authorization: token },
        queryParams: {},
      });

      expectToEqual(response, {
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
      expectToEqual(response, {
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
      expectToEqual(response, {
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
        initialFeatureFlags.enableLogoUpload,
        makeBooleanFeatureFlag(true),
      );

      const response = await sharedRequest.updateFeatureFlags({
        body: {
          flagName: "enableLogoUpload",
          flagContent: { isActive: false },
        },
        headers: { authorization: token },
      });

      expectToEqual(response, {
        status: 201,
        body: "",
      });

      const updatedFeatureFlags = await getFeatureFlags();
      expectToEqual(
        updatedFeatureFlags.enableLogoUpload,
        makeBooleanFeatureFlag(false),
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
        flagContent: {
          isActive: true,
          value: {
            message: "Maintenance message",
          },
        },
      };

      const response = await sharedRequest.updateFeatureFlags({
        body: params,
        headers: { authorization: token },
      });

      expectToEqual(response, {
        status: 201,
        body: "",
      });

      const updatedFeatureFlags = await getFeatureFlags();
      expectToEqual(
        updatedFeatureFlags.enableMaintenance,
        makeTextFeatureFlag(true, {
          message: "Maintenance message",
        }),
      );
    });

    it("401 - wrong admin token", async () => {
      const response = await sharedRequest.updateFeatureFlags({
        body: {
          flagName: "enableLogoUpload",
          flagContent: { isActive: false },
        },
        headers: { authorization: "wrong-token" },
      });
      expectToEqual(response, {
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
      expectToEqual(response, {
        status: 200,
        body: [],
      });
    });

    it("401 - missing token", async () => {
      const response = await sharedRequest.getInclusionConnectedUsers({
        queryParams: { agencyRole: "toReview" },
        headers: { authorization: "" },
      });
      expectToEqual(response, {
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
        agencyRights: [{ agency, role: "toReview" }],
      };

      inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        inclusionConnectedUser,
      ]);

      const updatedRole: AgencyRole = "counsellor";

      const response = await sharedRequest.updateUserRoleForAgency({
        body: {
          agencyId: agency.id,
          userId: inclusionConnectedUser.id,
          role: updatedRole,
        },
        headers: { authorization: token },
      });

      expectToEqual(response, {
        status: 201,
        body: "",
      });

      expectToEqual(
        inMemoryUow.inclusionConnectedUserRepository.agencyRightsByUserId,
        {
          [inclusionConnectedUser.id]: [{ agency, role: updatedRole }],
        },
      );
    });

    it("401 - missing admin token", async () => {
      const response = await sharedRequest.updateUserRoleForAgency({
        body: {
          agencyId: "yo",
          userId: "yolo",
          role: "counsellor",
        },
        headers: { authorization: "" },
      });

      expectToEqual(response, {
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
        agencyRights: [{ agency, role: "toReview" }],
      };

      const updatedRole: AgencyRole = "counsellor";

      const response = await sharedRequest.updateUserRoleForAgency({
        body: {
          agencyId: agency.id,
          userId: inclusionConnectedUser.id,
          role: updatedRole,
        },
        headers: { authorization: token },
      });

      expectToEqual(response, {
        status: 404,
        body: { errors: "User with id my-user-id not found" },
      });
    });
  });

  describe(`${displayRouteName(
    adminRoutes.saveApiConsumer,
  )} saves an api consumer`, () => {
    it("200 - save new api consumer", async () => {
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, []);
      const response = await sharedRequest.saveApiConsumer({
        body: authorizedUnJeuneUneSolutionApiConsumer,
        headers: { authorization: token },
      });

      const jwt = expectResponseAndReturnJwt(response, {
        status: 200,
        body: {
          jwt: expect.any(String),
        },
      })!;

      const { id } = makeVerifyJwtES256<"apiConsumer">(
        appConfig.apiJwtPublicKey,
      )(jwt);

      expectToEqual(id, authorizedUnJeuneUneSolutionApiConsumer.id);
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, [
        authorizedUnJeuneUneSolutionApiConsumer,
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
          },
          convention: {
            kinds: [],
            scope: {
              agencyKinds: [],
              agencyIds: [],
            },
          },
        },
      };

      const response = await sharedRequest.saveApiConsumer({
        body: updatedApiConsumer,
        headers: { authorization: token },
      });

      const jwt = expectResponseAndReturnJwt(response, {
        status: 200,
        body: {
          jwt: expect.any(String),
        },
      })!;

      const { id } = makeVerifyJwtES256<"apiConsumer">(
        appConfig.apiJwtPublicKey,
      )(jwt);

      expectToEqual(id, authorizedUnJeuneUneSolutionApiConsumer.id);
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, [
        updatedApiConsumer,
      ]);
    });

    it("401 - without auth", async () => {
      const response = await sharedRequest.saveApiConsumer({
        body: authorizedUnJeuneUneSolutionApiConsumer,
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
        body: authorizedUnJeuneUneSolutionApiConsumer,
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
      expectToEqual(response, {
        status: 200,
        body: [],
      });
    });

    it("401 - without auth", async () => {
      const response = await sharedRequest.getAllApiConsumers({
        headers: { authorization: "" },
      });

      expectToEqual(response, {
        status: 401,
        body: { error: "You need to authenticate first" },
      });
    });

    it("401 - not with backOfficeJwt", async () => {
      const response = await sharedRequest.saveApiConsumer({
        body: authorizedUnJeuneUneSolutionApiConsumer,
        headers: { authorization: generateApiConsumerJwt({ id: "osef" }) },
      });

      expectToEqual(response, {
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
  expected: R,
): ApiConsumerJwt | undefined => {
  expectToEqual(response, expected);

  if (response.status === 200) return response.body.jwt as ApiConsumerJwt;
};
