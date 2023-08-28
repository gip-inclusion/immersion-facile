import {
  AdminRoutes,
  adminRoutes,
  BackOfficeJwt,
  BackOfficeJwtPayload,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { makeVerifyJwtES256 } from "../../../../domain/auth/jwt";
import { CustomTimeGateway } from "../../../secondary/core/TimeGateway/CustomTimeGateway";
import { AppConfig } from "../../config/appConfig";

describe("admin login", () => {
  let sharedRequest: HttpClient<AdminRoutes>;
  let appConfig: AppConfig;
  let timeGateway: CustomTimeGateway;

  beforeEach(async () => {
    appConfig = new AppConfigBuilder()
      .withConfigParams({
        BACKOFFICE_USERNAME: "user",
        BACKOFFICE_PASSWORD: "password",
      })
      .build();

    const deps = await buildTestApp(appConfig);
    timeGateway = deps.gateways.timeGateway;

    timeGateway.setNextDate(new Date());

    sharedRequest = createSupertestSharedClient(adminRoutes, deps.request);
  });

  it("refuses to connect with wrong credentials", async () => {
    const response = await sharedRequest.login({
      body: {
        user: "lala",
        password: "lulu",
      },
    });
    expectToEqual(response, {
      status: 403,
      body: {
        errors: "Wrong credentials",
      },
    });
  });

  it("returns token if credentials are correct", async () => {
    const response = await sharedRequest.login({
      body: {
        user: appConfig.backofficeUsername,
        password: appConfig.backofficePassword,
      },
    });

    expectToEqual(response, {
      status: 200,
      body: expect.any(String),
    });

    if (response.status !== 200) throw new Error("Unreachable");
    const token: BackOfficeJwt = response.body;

    const verify = makeVerifyJwtES256<"backOffice">(appConfig.jwtPublicKey);
    const payload: BackOfficeJwtPayload = verify(token);

    expectObjectsToMatch(payload, {
      sub: appConfig.backofficeUsername,
      role: "backOffice",
    });
  });
});
