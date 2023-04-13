import { SuperTest, Test } from "supertest";

import {
  adminTargets,
  BackOfficeJwt,
  featureFlagsRoute,
  SetFeatureFlagParams,
} from "shared";

import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";

describe("/admin router", () => {
  let request: SuperTest<Test>;
  let token: BackOfficeJwt;
  let gateways: InMemoryGateways;

  beforeEach(async () => {
    const appConfig = new AppConfigBuilder()
      .withConfigParams({
        BACKOFFICE_USERNAME: "user",
        BACKOFFICE_PASSWORD: "pwd",
      })
      .build();

    ({ request, gateways } = await buildTestApp(appConfig));

    gateways.timeGateway.setNextDate(new Date());

    const response = await request
      .post("/admin/login")
      .send({ user: "user", password: "pwd" });

    token = response.body;
  });

  describe(`GET ${adminTargets.getDashboardUrl.url}`, () => {
    it("Fails with 401 Unauthorized without admin token", async () => {
      const response = await request.get(adminTargets.getDashboardUrl.url);
      expect(response.body).toEqual({
        error: "You need to authenticate first",
      });
      expect(response.status).toBe(401);
    });

    it("Fails if token is not valid", async () => {
      const response = await request
        .get(adminTargets.getDashboardUrl.url)
        .set("authorization", "wrong-tokend");
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
    it("fails with 401 without admin token", async () => {
      const response = await request
        .post(`/admin/${featureFlagsRoute}`)
        .set("authorization", "wrong-tokend");
      expect(response.body).toEqual({ error: "Provided token is invalid" });
      expect(response.status).toBe(401);
    });

    it("sets the feature flag to given value if token is valid", async () => {
      const initialFeatureFlagsResponse = await request.get(
        `/${featureFlagsRoute}`,
      );
      expect(initialFeatureFlagsResponse.body.enableLogoUpload).toBe(true);

      const params: SetFeatureFlagParams = {
        flagName: "enableLogoUpload",
        value: false,
      };

      const response = await request
        .post(`/admin/${featureFlagsRoute}`)
        .send(params)
        .set("authorization", token);

      expect(response.body).toEqual({ success: true });
      expect(response.status).toBe(200);

      const updatedFeatureFlagsResponse = await request.get(
        `/${featureFlagsRoute}`,
      );
      expect(updatedFeatureFlagsResponse.body.enableLogoUpload).toBe(false);
    });
  });
});
