import {
  AdminRoutes,
  BackOfficeJwt,
  BackOfficeJwtPayload,
  adminRoutes,
  displayRouteName,
  expectHttpResponseToEqual,
  expectObjectsToMatch,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { makeVerifyJwtES256 } from "../../../../domains/core/jwt";
import { CustomTimeGateway } from "../../../../domains/core/time-gateway/adapters/CustomTimeGateway";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { buildTestApp } from "../../../../utils/buildTestApp";

describe(`${displayRouteName(adminRoutes.login)} Admin login`, () => {
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

    timeGateway.defaultDate = new Date();

    sharedRequest = createSupertestSharedClient(adminRoutes, deps.request);
  });

  it("refuses to connect with wrong credentials", async () => {
    const response = await sharedRequest.login({
      body: {
        user: "lala",
        password: "lulu",
      },
    });
    expectHttpResponseToEqual(response, {
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

    expectHttpResponseToEqual(response, {
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
