import { addDays } from "date-fns";
import {
  AdminRoutes,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  InclusionConnectJwt,
  InclusionConnectJwtPayload,
  InclusionConnectedUserBuilder,
  adminRoutes,
  currentJwtVersions,
  expectHttpResponseToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../../domains/core/sirene/adapters/InMemorySiretGateway";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { InMemoryGateways, buildTestApp } from "../../../../utils/buildTestApp";

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withId("backoffice-admin-user")
  .withIsAdmin(true)
  .build();

const backofficeAdminJwtPayload: InclusionConnectJwtPayload = {
  version: currentJwtVersions.inclusion,
  iat: new Date().getTime(),
  exp: addDays(new Date(), 30).getTime(),
  userId: backofficeAdminUser.id,
};

describe("POST /add-form-establishment-batch", () => {
  const formEstablishment1: FormEstablishmentDto =
    FormEstablishmentDtoBuilder.valid().build();
  const payload: FormEstablishmentBatchDto = {
    groupName: "Tesla",
    title: "My title",
    description: "My description",
    formEstablishments: [formEstablishment1],
  };
  let httpClient: HttpClient<AdminRoutes>;
  let token: InclusionConnectJwt;
  let gateways: InMemoryGateways;

  beforeEach(async () => {
    const testApp = await buildTestApp(
      new AppConfigBuilder()
        .withConfigParams({
          BACKOFFICE_USERNAME: "user",
          BACKOFFICE_PASSWORD: "pwd",
        })
        .build(),
    );

    ({ gateways } = testApp);
    httpClient = createSupertestSharedClient(adminRoutes, testApp.request);
    testApp.inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers(
      [backofficeAdminUser],
    );

    gateways.timeGateway.defaultDate = new Date();

    token = testApp.generateInclusionConnectJwt(backofficeAdminJwtPayload);
  });

  it("throws 401 if invalid token", async () => {
    const badBackOfficeJwt: InclusionConnectJwt = "Invalid";
    const response = await httpClient.addFormEstablishmentBatch({
      body: payload,
      headers: { authorization: badBackOfficeJwt },
    });

    expectHttpResponseToEqual(response, {
      body: { error: "Provided token is invalid" },
      status: 401,
    });
  });

  it("throws 400 if missing token", async () => {
    const response = await httpClient.addFormEstablishmentBatch({
      body: payload,
      headers: {} as { authorization: string },
    });

    expectHttpResponseToEqual(response, {
      body: {
        issues: ["authorization : Required"],
        message:
          "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: POST /admin/add-form-establishment-batch",
        status: 400,
      },
      status: 400,
    });
  });

  it("returns 200 if everything work", async () => {
    gateways.siret.setSirenEstablishment({
      ...TEST_OPEN_ESTABLISHMENT_1,
      siret: formEstablishment1.siret,
    });

    const response = await httpClient.addFormEstablishmentBatch({
      body: payload,
      headers: { authorization: token },
    });

    expectHttpResponseToEqual(response, {
      body: {
        failures: [],
        numberOfEstablishmentsProcessed: 1,
        numberOfSuccess: 1,
      },
      status: 200,
    });
  });
});
