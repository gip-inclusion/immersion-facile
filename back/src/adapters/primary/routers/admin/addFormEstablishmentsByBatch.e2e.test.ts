import { addDays } from "date-fns";
import {
  type AdminRoutes,
  adminRoutes,
  ConnectedUserBuilder,
  type ConnectedUserJwt,
  type ConnectedUserJwtPayload,
  currentJwtVersions,
  defaultCountryCode,
  expectHttpResponseToEqual,
  type FormEstablishmentBatchDto,
  type FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  updatedAddress1,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { invalidTokenMessage } from "../../../../config/bootstrap/connectedUserAuthMiddleware";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../../domains/core/sirene/adapters/InMemorySiretGateway";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import {
  buildTestApp,
  type InMemoryGateways,
} from "../../../../utils/buildTestApp";

describe("POST /add-form-establishment-batch", () => {
  const adminBuilder = new ConnectedUserBuilder()
    .withId("backoffice-admin-user")
    .withIsAdmin(true);
  const connectedUserAdmin = adminBuilder.build();
  const admin = adminBuilder.buildUser();

  const backofficeAdminJwtPayload: ConnectedUserJwtPayload = {
    version: currentJwtVersions.connectedUser,
    iat: Date.now(),
    exp: addDays(new Date(), 30).getTime(),
    userId: connectedUserAdmin.id,
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
      [
        {
          address: {
            ...updatedAddress1.addressAndPosition.address,
            countryCode: defaultCountryCode,
          },
          position: updatedAddress1.addressAndPosition.position,
        },
      ],
    ]);
    gateways.timeGateway.defaultDate = new Date();

    token = testApp.generateConnectedUserJwt(backofficeAdminJwtPayload);
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
        issues: [
          "authorization : Invalid input: expected string, received undefined",
        ],
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
