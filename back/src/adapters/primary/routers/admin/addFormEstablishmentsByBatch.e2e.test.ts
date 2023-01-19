import {
  adminTargets,
  AdminToken,
  FormEstablishmentBatch,
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
} from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { SuperTest, Test } from "supertest";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";

const addFormEstablishmentBatchRoute =
  adminTargets.addFormEstablishmentBatch.url;

describe("POST /add-form-establishment-batch", () => {
  let request: SuperTest<Test>;
  let token: AdminToken;

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
    const response = await request.post(addFormEstablishmentBatchRoute);
    expect(response.status).toBe(401);
  });

  it("returns 200 if everything work", async () => {
    const formEstablishment1: FormEstablishmentDto =
      FormEstablishmentDtoBuilder.valid().build();

    const payload: FormEstablishmentBatch = {
      groupName: "Tesla",
      formEstablishments: [formEstablishment1],
    };

    const response = await request
      .post(addFormEstablishmentBatchRoute)
      .set("authorization", token)
      .send(payload);

    expect(response.status).toBe(200);
  });
});
