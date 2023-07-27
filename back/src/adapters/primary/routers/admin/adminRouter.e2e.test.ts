import { SuperTest, Test } from "supertest";
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
    const appConfig = new AppConfigBuilder()
      .withConfigParams({
        BACKOFFICE_USERNAME: "user",
        BACKOFFICE_PASSWORD: "pwd",
      })
      .build();

    ({ request, gateways, inMemoryUow } = await buildTestApp(appConfig));

    gateways.timeGateway.setNextDate(new Date());

    const response = await request
      .post("/admin/login")
      .send({ user: "user", password: "pwd" });

    token = response.body;
  });

  describe(`GET ${adminTargets.getDashboardUrl.url}`, () => {
    it("Fails with 401 Unauthorized without admin token", async () => {
      const { body, status } = await request.get(
        adminTargets.getDashboardUrl.url,
      );
      expectToEqual(body, { error: "You need to authenticate first" });
      expect(status).toBe(401);
    });

    it("Fails if token is not valid", async () => {
      const response = await request
        .get(adminTargets.getDashboardUrl.url)
        .set("authorization", "wrong-token");
      expect(response.body).toEqual({ error: "Provided token is invalid" });
      expect(response.status).toBe(401);
    });

    it("Gets the absolute Url of the dashboard", async () => {
      const response = await request
        .get(
          adminTargets.getDashboardUrl.url.replace(":dashboardName", "events"),
        )
        .set("authorization", token);
      expect(response.body).toBe("http://stubDashboard/events");
      expect(response.status).toBe(200);
    });

    it("Gets the absolute Url of the agency dashboard", async () => {
      const response = await request
        .get(
          `${adminTargets.getDashboardUrl.url.replace(
            ":dashboardName",
            "agency",
          )}?agencyId=my-agency-id`,
        )
        .set("authorization", token);
      expect(response.body).toBe("http://stubAgencyDashboard/my-agency-id");
      expect(response.status).toBe(200);
    });

    it("Fails to get the absolute Url of the agency dashboard when no agencyId is provided", async () => {
      const response = await request
        .get(
          `${adminTargets.getDashboardUrl.url.replace(
            ":dashboardName",
            "agency",
          )}`,
        )
        .set("authorization", token);
      expect(response.body).toEqual({
        errors:
          "You need to provide agency Id in query params : http://.../agency?agencyId=your-id",
      });
      expect(response.status).toBe(400);
    });
  });

  describe(`set feature flags route`, () => {
    it("fails with 401 with wrong admin token", async () => {
      const response = await request
        .post(`/admin/${featureFlagsRoute}`)
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

      const params: SetFeatureFlagParam = {
        flagName: "enableLogoUpload",
        flagContent: {
          isActive: false,
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
