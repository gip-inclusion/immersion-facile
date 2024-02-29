import { subYears } from "date-fns";
import {
  EstablishmentRoutes,
  FormEstablishmentDtoBuilder,
  createBackOfficeJwtPayload,
  createEstablishmentJwtPayload,
  establishmentRoutes,
  expectHttpResponseToEqual,
  expectToEqual,
  expiredMagicLinkErrorMessage,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import supertest from "supertest";
import {
  GenerateBackOfficeJwt,
  GenerateEditFormEstablishmentJwt,
  makeGenerateJwtES256,
} from "../../../../domains/core/jwt";
import {
  TEST_OPEN_ESTABLISHMENT_1,
  TEST_OPEN_ESTABLISHMENT_2,
} from "../../../../domains/core/sirene/adapters/InMemorySiretGateway";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { InMemoryGateways, buildTestApp } from "../../../../utils/buildTestApp";
import { AppConfig } from "../../config/appConfig";

describe("Edit form establishments", () => {
  let httpClient: HttpClient<EstablishmentRoutes>;
  let appConfig: AppConfig;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateEditEstablishmentJwt: GenerateEditFormEstablishmentJwt;
  let generateBackOfficeJwt: GenerateBackOfficeJwt;

  const formEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
    .build();

  beforeEach(async () => {
    let request: supertest.SuperTest<supertest.Test>;
    ({
      request,
      appConfig,
      gateways,
      inMemoryUow,
      generateEditEstablishmentJwt,
      generateBackOfficeJwt,
    } = await buildTestApp(
      new AppConfigBuilder().withTestPresetPreviousKeys().build(),
    ));
    httpClient = createSupertestSharedClient(establishmentRoutes, request);

    inMemoryUow.formEstablishmentRepository.setFormEstablishments([
      formEstablishment,
    ]);
  });

  it("200 - Supports posting already existing form establisment when authenticated with establishment JWT", async () => {
    const response = await httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {
        authorization: generateEditEstablishmentJwt(
          createEstablishmentJwtPayload({
            siret: TEST_OPEN_ESTABLISHMENT_1.siret,
            durationDays: 1,
            now: new Date(),
          }),
        ),
      },
    });

    expectHttpResponseToEqual(response, {
      body: "",
      status: 200,
    });
    expect(inMemoryUow.outboxRepository.events).toHaveLength(1);
    expectToEqual(await inMemoryUow.formEstablishmentRepository.getAll(), [
      formEstablishment,
    ]);
  });

  it("200 - Supports posting already existing form establisment when authenticated with backoffice JWT", async () => {
    const response = await httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {
        authorization: generateBackOfficeJwt(
          createBackOfficeJwtPayload({
            durationDays: 1,
            now: new Date(),
          }),
        ),
      },
    });

    expectHttpResponseToEqual(response, {
      body: "",
      status: 200,
    });
    expect(inMemoryUow.outboxRepository.events).toHaveLength(1);
    expectToEqual(await inMemoryUow.formEstablishmentRepository.getAll(), [
      formEstablishment,
    ]);
  });

  it("400 - not authenticated", async () => {
    const response = await httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {} as any,
    });

    expectHttpResponseToEqual(response, {
      body: {
        issues: ["authorization : Required"],
        message:
          "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: PUT /form-establishments",
        status: 400,
      },
      status: 400,
    });
  });

  it("401 - Jwt is generated from wrong private key", async () => {
    const generateJwtWithWrongKey = makeGenerateJwtES256<"establishment">(
      appConfig.apiJwtPrivateKey, // Private Key is the wrong one !
      undefined,
    );

    const response = await httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {
        authorization: generateJwtWithWrongKey(
          createEstablishmentJwtPayload({
            siret: "12345678901234",
            durationDays: 1,
            now: new Date(),
          }),
        ),
      },
    });

    expectHttpResponseToEqual(response, {
      body: { error: "Provided token is invalid" },
      status: 401,
    });
  });

  it("401 - Jwt is malformed", async () => {
    const response = await httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {
        authorization: "bad-jwt",
      },
    });

    expectHttpResponseToEqual(response, {
      body: { error: "Provided token is invalid" },
      status: 401,
    });
  });

  it("403 - Jwt is expired", async () => {
    const response = await httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {
        authorization: generateEditEstablishmentJwt(
          createEstablishmentJwtPayload({
            siret: "12345678901234",
            durationDays: 1,
            now: subYears(gateways.timeGateway.now(), 1),
          }),
        ),
      },
    });

    expectHttpResponseToEqual(response, {
      body: {
        message: expiredMagicLinkErrorMessage,
        needsNewMagicLink: true,
      },
      status: 403,
    });
  });

  it("409 - Missing establishment form", async () => {
    const response = await httpClient.updateFormEstablishment({
      body: FormEstablishmentDtoBuilder.valid()
        .withSiret(TEST_OPEN_ESTABLISHMENT_2.siret)
        .build(),
      headers: {
        authorization: generateEditEstablishmentJwt(
          createEstablishmentJwtPayload({
            siret: TEST_OPEN_ESTABLISHMENT_2.siret,
            durationDays: 1,
            now: new Date(),
          }),
        ),
      },
    });

    expectHttpResponseToEqual(response, {
      body: {
        errors:
          "Cannot update form establishment DTO with siret 77561959600155, since it is not found.",
      },
      status: 409,
    });
    expect(inMemoryUow.outboxRepository.events).toHaveLength(1);
  });
});
