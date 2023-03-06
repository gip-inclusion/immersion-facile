import {
  adminTargets,
  BackOfficeJwt,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
} from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { SuperTest, Test } from "supertest";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { defaultSiretResponse } from "../../../../_testBuilders/StubGetSiret";

const addFormEstablishmentBatchUrl = adminTargets.addFormEstablishmentBatch.url;

describe("POST /add-form-establishment-batch", () => {
  let request: SuperTest<Test>;
  let token: BackOfficeJwt;

  beforeEach(async () => {
    const appConfig = new AppConfigBuilder()
      .withConfigParams({
        ADMIN_JWT_SECRET: "a-secret",
        BACKOFFICE_USERNAME: "user",
        BACKOFFICE_PASSWORD: "pwd",
      })
      .build();

    ({ request } = await buildTestApp(appConfig));

    const response = await request
      .post("/admin/login")
      .send({ user: "user", password: "pwd" });

    token = response.body;
  });

  it("throws 401 if not authenticated", async () => {
    const response = await request.post(addFormEstablishmentBatchUrl);
    expect(response.status).toBe(401);
  });

  it("returns 200 if everything work", async () => {
    const formEstablishment1: FormEstablishmentDto =
      FormEstablishmentDtoBuilder.valid()
        .withSiret(defaultSiretResponse.siret)
        .build();

    const payload: FormEstablishmentBatchDto = {
      groupName: "Tesla",
      formEstablishments: [formEstablishment1],
    };

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
