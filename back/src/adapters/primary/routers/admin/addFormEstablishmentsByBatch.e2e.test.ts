import { SuperTest, Test } from "supertest";
import {
  adminTargets,
  BackOfficeJwt,
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

const addFormEstablishmentBatchUrl = adminTargets.addFormEstablishmentBatch.url;

describe("POST /add-form-establishment-batch", () => {
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

  it("throws 401 if not authenticated", async () => {
    const response = await request.post(addFormEstablishmentBatchUrl);
    expect(response.status).toBe(401);
  });

  it("returns 200 if everything work", async () => {
    const formEstablishment1: FormEstablishmentDto =
      FormEstablishmentDtoBuilder.valid().build();

    gateways.siret.setSirenEstablishment({
      ...TEST_OPEN_ESTABLISHMENT_1,
      siret: formEstablishment1.siret,
    });

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
