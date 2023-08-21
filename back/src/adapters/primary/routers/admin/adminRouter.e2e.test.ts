import { SuperTest, Test } from "supertest";
import { ZodError } from "zod";
import {
  adminTargets,
  AgencyDtoBuilder,
  BackOfficeJwt,
  expectToEqual,
  featureFlagsRoute,
  IcUserRoleForAgencyParams,
  makeBooleanFeatureFlag,
  makeTextFeatureFlag,
  SetFeatureFlagParam,
} from "shared";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("/admin router", () => {
  let request: SuperTest<Test>;
  let token: BackOfficeJwt;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    ({ request, gateways, inMemoryUow } = await buildTestApp(
      new AppConfigBuilder()
        .withConfigParams({
          BACKOFFICE_USERNAME: "user",
          BACKOFFICE_PASSWORD: "pwd",
        })
        .build(),
    ));

    gateways.timeGateway.setNextDate(new Date());
    token = (
      await request
        .post(adminTargets.login.url)
        .send({ user: "user", password: "pwd" })
    ).body;
  });

  describe(`GET ${adminTargets.getDashboardUrl.url}`, () => {
    it("200 - Gets the absolute Url of the events dashboard", async () => {
      const { body, status } = await request
        .get(
          adminTargets.getDashboardUrl.url.replace(":dashboardName", "events"),
        )
        .set("authorization", token);
      expectToEqual(body, "http://stubDashboard/events");
      expectToEqual(status, 200);
    });

    it("200 - Gets the absolute Url of the establishments dashboard", async () => {
      const { body, status } = await request
        .get(
          adminTargets.getDashboardUrl.url.replace(
            ":dashboardName",
            "establishments",
          ),
        )
        .set("authorization", token);
      expectToEqual(body, "http://stubDashboard/establishments");
      expectToEqual(status, 200);
    });

    it("200 - Gets the absolute Url of the agency dashboard", async () => {
      const { body, status } = await request
        .get(
          `${adminTargets.getDashboardUrl.url.replace(
            ":dashboardName",
            "agency",
          )}?agencyId=my-agency-id`,
        )
        .set("authorization", token);
      expectToEqual(body, "http://stubAgencyDashboard/my-agency-id");
      expectToEqual(status, 200);
    });

    it("400 - unknown dashboard", async () => {
      const { body, status } = await request
        .get(
          adminTargets.getDashboardUrl.url.replace(
            ":dashboardName",
            "unknown-dashboard",
          ),
        )
        .set("authorization", token);

      expectToEqual(body, {
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
      });
      expectToEqual(status, 400);
    });

    it("400 - no agencyId is provided for agency dashboard", async () => {
      const response = await request
        .get(
          `${adminTargets.getDashboardUrl.url.replace(
            ":dashboardName",
            "agency",
          )}`,
        )
        .set("authorization", token);

      expectToEqual(response.body, {
        errors:
          "You need to provide agency Id in query params : http://.../agency?agencyId=your-id",
      });
      expectToEqual(response.status, 400);
    });

    it("401 - Unauthorized without admin token", async () => {
      const { body, status } = await request.get(
        adminTargets.getDashboardUrl.url,
      );
      expectToEqual(body, { error: "You need to authenticate first" });
      expectToEqual(status, 401);
    });

    it("401 - token is not valid", async () => {
      const { body, status } = await request
        .get(adminTargets.getDashboardUrl.url)
        .set("authorization", "wrong-token");
      expectToEqual(body, { error: "Provided token is invalid" });
      expectToEqual(status, 401);
    });
  });

  describe(`POST ${adminTargets.featureFlags.url}`, () => {
    it("fails with 401 with wrong admin token", async () => {
      const response = await request
        .post(adminTargets.featureFlags.url)
        .set("authorization", "wrong-token");
      expect(response.body).toEqual({ error: "Provided token is invalid" });
      expect(response.status).toBe(401);
    });

    it("sets the feature flag to given value if token is valid", async () => {
      const initialFeatureFlagsResponse = await request.get(
        `/${featureFlagsRoute}`,
      );
      expect(initialFeatureFlagsResponse.body.enableLogoUpload).toEqual(
        makeBooleanFeatureFlag(true),
      );

      const response = await request
        .post(adminTargets.featureFlags.url)
        .send({
          flagName: "enableLogoUpload",
          flagContent: {
            isActive: false,
          },
        } satisfies SetFeatureFlagParam)
        .set("authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toBe("");

      const updatedFeatureFlagsResponse = await request.get(
        `/${featureFlagsRoute}`,
      );
      expect(updatedFeatureFlagsResponse.body.enableLogoUpload).toEqual(
        makeBooleanFeatureFlag(false),
      );
    });

    it("sets the feature flag to given value if token is valid with value", async () => {
      const initialFeatureFlagsResponse = await request.get(
        `/${featureFlagsRoute}`,
      );
      expect(initialFeatureFlagsResponse.body.enableMaintenance).toEqual(
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

      const response = await request
        .post(`/admin/${featureFlagsRoute}`)
        .send(params)
        .set("authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toBe("");

      const updatedFeatureFlagsResponse = await request.get(
        `/${featureFlagsRoute}`,
      );
      expect(updatedFeatureFlagsResponse.body.enableMaintenance).toEqual(
        makeTextFeatureFlag(true, {
          message: "Maintenance message",
        }),
      );
    });
  });

  describe(`GET ${adminTargets.getInclusionConnectedUsers.url}`, () => {
    it("Fails with 401 Unauthorized without admin token", async () => {
      const { body, status } = await request.get(
        adminTargets.getInclusionConnectedUsers.url,
      );
      expect(body).toEqual({ error: "You need to authenticate first" });
      expect(status).toBe(401);
    });

    it("Gets the list of connected users with role 'toReview'", async () => {
      const response = await request
        .get(
          `${adminTargets.getInclusionConnectedUsers.url}?agencyRole=toReview`,
        )
        .set("authorization", token);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe(`GET ${adminTargets.updateUserRoleForAgency.url}`, () => {
    it("Fails with 401 Unauthorized without admin token", async () => {
      const { body, status } = await request.patch(
        adminTargets.updateUserRoleForAgency.url,
      );
      expect(body).toEqual({ error: "You need to authenticate first" });
      expect(status).toBe(401);
    });

    it("Updates role of user form 'toReview' to 'counsellor' for given agency", async () => {
      const body: IcUserRoleForAgencyParams = {
        agencyId: "my-agency-id",
        userId: "my-user-id",
        role: "counsellor",
      };

      const agency = new AgencyDtoBuilder().withId(body.agencyId).build();

      inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        {
          id: body.userId,
          email: "john@mail.com",
          firstName: "John",
          lastName: "Doe",
          agencyRights: [{ agency, role: "toReview" }],
        },
      ]);

      const response = await request
        .patch(`${adminTargets.updateUserRoleForAgency.url}`)
        .send(body)
        .set("authorization", token);

      expect(response.body).toBe("");
      expect(response.status).toBe(200);
    });
  });
});
