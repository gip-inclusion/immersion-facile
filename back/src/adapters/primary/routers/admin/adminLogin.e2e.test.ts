import {
  adminLogin,
  BackOfficeJwt,
  BackOfficeJwtPayload,
  expectObjectsToMatch,
} from "shared";
import { SuperTest, Test } from "supertest";
import { makeVerifyJwtES256 } from "../../../../domain/auth/jwt";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { CustomTimeGateway } from "../../../secondary/core/TimeGateway/CustomTimeGateway";
import { AppConfig } from "../../config/appConfig";

describe("admin login", () => {
  let request: SuperTest<Test>;
  let appConfig: AppConfig;
  let timeGateway: CustomTimeGateway;

  beforeEach(async () => {
    appConfig = new AppConfigBuilder()
      .withConfigParams({
        BACKOFFICE_USERNAME: "user",
        BACKOFFICE_PASSWORD: "password",
      })
      .build();

    ({
      request,
      gateways: { timeGateway },
    } = await buildTestApp(appConfig));

    timeGateway.setNextDate(new Date());
  });

  it("refuses to connect with wrong credentials", async () => {
    const response = await request.post(`/admin/${adminLogin}`).send({
      user: "lala",
      password: "lulu",
    });
    expect(response.body).toEqual({
      errors: "Wrong credentials",
    });
    expect(response.status).toBe(403);
  });

  it("returns token if credentials are correct", async () => {
    const response = await request.post(`/admin/${adminLogin}`).send({
      user: appConfig.backofficeUsername,
      password: appConfig.backofficePassword,
    });

    const token: BackOfficeJwt = response.body;

    expect(typeof token).toBe("string");
    expect(response.status).toBe(200);

    const verify = makeVerifyJwtES256<"backOffice">(appConfig.jwtPublicKey);
    const payload: BackOfficeJwtPayload = verify(token);

    expectObjectsToMatch(payload, {
      sub: appConfig.backofficeUsername,
      role: "backOffice",
    });
  });
});
