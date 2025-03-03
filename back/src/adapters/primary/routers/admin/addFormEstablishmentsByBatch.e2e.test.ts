import { addDays } from "date-fns";
import {
  type AdminRoutes,
  type ConnectedUserJwt,
  type FormEstablishmentBatchDto,
  type FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  type InclusionConnectJwtPayload,
  InclusionConnectedUserBuilder,
  adminRoutes,
  currentJwtVersions,
  expectHttpResponseToEqual,
  updatedAddress1,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { invalidTokenMessage } from "../../../../config/bootstrap/inclusionConnectAuthMiddleware";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../../domains/core/sirene/adapters/InMemorySiretGateway";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import {
  type InMemoryGateways,
  buildTestApp,
} from "../../../../utils/buildTestApp";

describe("POST /add-form-establishment-batch", () => {
  const adminBuilder = new InclusionConnectedUserBuilder()
    .withId("backoffice-admin-user")
    .withIsAdmin(true);
  const icAdmin = adminBuilder.build();
  const admin = adminBuilder.buildUser();

  const backofficeAdminJwtPayload: InclusionConnectJwtPayload = {
    version: currentJwtVersions.inclusion,
    iat: new Date().getTime(),
    exp: addDays(new Date(), 30).getTime(),
    userId: icAdmin.id,
  };

  const formEstablishment1: FormEstablishmentDto =
    FormEstablishmentDtoBuilder.valid().build();
  const payload: FormEstablishmentBatchDto = {
    groupName: "Tesla",
    title: "My title",
    description: "My description",
    formEstablishments: [formEstablishment1],
  };
  let httpClient: HttpClient<AdminRoutes>;
  let token: ConnectedUserJwt;
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
    testApp.inMemoryUow.userRepository.users = [admin];
    testApp.inMemoryUow.romeRepository.appellations = [
      {
        appellationCode: "11111",
        appellationLabel: "Test",
        romeCode: "",
        romeLabel: "",
      },
      {
        appellationCode: "22222",
        appellationLabel: "Test",
        romeCode: "",
        romeLabel: "",
      },
      {
        appellationCode: "33333",
        appellationLabel: "Test",
        romeCode: "",
        romeLabel: "",
      },
    ];

    gateways.addressApi.setNextLookupStreetAndAddresses([
      [updatedAddress1.addressAndPosition],
    ]);
    gateways.timeGateway.defaultDate = new Date();

    token = testApp.generateInclusionConnectJwt(backofficeAdminJwtPayload);
  });

  it("throws 401 if invalid token", async () => {
    const badBackOfficeJwt: ConnectedUserJwt = "Invalid";
    const response = await httpClient.addFormEstablishmentBatch({
      body: payload,
      headers: { authorization: badBackOfficeJwt },
    });

    expectHttpResponseToEqual(response, {
      status: 401,
      body: { status: 401, message: invalidTokenMessage },
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
