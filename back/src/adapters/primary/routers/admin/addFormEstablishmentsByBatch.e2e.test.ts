import { SuperTest, Test } from "supertest";
import {
  adminRoutes,
  BackOfficeJwt,
  expectToEqual,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
} from "shared";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../secondary/siret/InMemorySiretGateway";

const addFormEstablishmentBatchUrl = adminRoutes.addFormEstablishmentBatch.url;

describe("POST /add-form-establishment-batch", () => {
  const formEstablishment1: FormEstablishmentDto =
    FormEstablishmentDtoBuilder.valid().build();
  const payload: FormEstablishmentBatchDto = {
    groupName: "Tesla",
    title: "My title",
    description: "My description",
    formEstablishments: [formEstablishment1],
  };
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

    gateways.timeGateway.defaultDate = new Date();

    const response = await request
      .post("/admin/login")
      .send({ user: "user", password: "pwd" });

    token = response.body;
  });

  it("throws 401 if invalid token", async () => {
    const badBackOfficeJwt: BackOfficeJwt = "Invalid";
    const response = await request
      .post(addFormEstablishmentBatchUrl)
      .set("authorization", badBackOfficeJwt)
      .send(payload);
    expectToEqual(response.body, { error: "Provided token is invalid" });
    expect(response.status).toBe(401);
  });

  it("throws 400 if missing token", async () => {
    const response = await request
      .post(addFormEstablishmentBatchUrl)
      .send(payload);
    expectToEqual(response.body, {
      issues: ["authorization : Required"],
      message:
        "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: POST /admin/add-form-establishment-batch",
      status: 400,
    });
    expect(response.status).toBe(400);
  });

  it("returns 200 if everything work", async () => {
    gateways.siret.setSirenEstablishment({
      ...TEST_OPEN_ESTABLISHMENT_1,
      siret: formEstablishment1.siret,
    });

    const response = await request
      .post(addFormEstablishmentBatchUrl)
      .set("authorization", token)
      .send(payload);

    expect(response.body).toEqual({
      failures: [],
      numberOfEstablishmentsProcessed: 1,
      numberOfSuccess: 1,
    });
    expect(response.status).toBe(200);
  });
});
