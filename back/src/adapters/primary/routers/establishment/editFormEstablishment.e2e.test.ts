import { subYears } from "date-fns";
import supertest from "supertest";
import {
  createBackOfficeJwtPayload,
  createEstablishmentJwtPayload,
  establishmentTargets,
  expectToEqual,
  FormEstablishmentDtoBuilder,
} from "shared";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import {
  GenerateBackOfficeJwt,
  GenerateEditFormEstablishmentJwt,
  makeGenerateJwtES256,
} from "../../../../domain/auth/jwt";
import {
  TEST_OPEN_ESTABLISHMENT_1,
  TEST_OPEN_ESTABLISHMENT_2,
} from "../../../secondary/siret/InMemorySiretGateway";
import { AppConfig } from "../../config/appConfig";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe(`PUT /${establishmentTargets.updateFormEstablishment.url} - Route to post edited form establishments`, () => {
  let request: supertest.SuperTest<supertest.Test>;
  let appConfig: AppConfig;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateEditEstablishmentJwt: GenerateEditFormEstablishmentJwt;
  let generateBackOfficeJwt: GenerateBackOfficeJwt;

  const formEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
    .build();

  beforeEach(async () => {
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

    inMemoryUow.formEstablishmentRepository.setFormEstablishments([
      formEstablishment,
    ]);
  });

  it("200 - Supports posting already existing form establisment when authenticated with establishment JWT", async () => {
    const response = await request
      .put(establishmentTargets.updateFormEstablishment.url)
      .set(
        "Authorization",
        generateEditEstablishmentJwt(
          createEstablishmentJwtPayload({
            siret: TEST_OPEN_ESTABLISHMENT_1.siret,
            durationDays: 1,
            now: new Date(),
          }),
        ),
      )
      .send(formEstablishment);

    expectToEqual(response.status, 200);
    expectToEqual(response.body, "");
    expect(inMemoryUow.outboxRepository.events).toHaveLength(1);
    expectToEqual(await inMemoryUow.formEstablishmentRepository.getAll(), [
      formEstablishment,
    ]);
  });

  it("200 - Supports posting already existing form establisment when authenticated with backoffice JWT", async () => {
    const response = await request
      .put(establishmentTargets.updateFormEstablishment.url)
      .set(
        "Authorization",
        generateBackOfficeJwt(
          createBackOfficeJwtPayload({
            durationDays: 1,
            now: new Date(),
          }),
        ),
      )
      .send(formEstablishment);

    expectToEqual(response.status, 200);
    expectToEqual(response.body, "");
    expect(inMemoryUow.outboxRepository.events).toHaveLength(1);
    expectToEqual(await inMemoryUow.formEstablishmentRepository.getAll(), [
      formEstablishment,
    ]);
  });

  it("401 - not authenticated", async () => {
    const response = await request
      .put(establishmentTargets.updateFormEstablishment.url)
      .send({});

    expectToEqual(response.body, { error: "forbidden: unauthenticated" });
    expectToEqual(response.status, 401);
  });

  it("401 - Jwt is generated from wrong private key", async () => {
    const generateJwtWithWrongKey = makeGenerateJwtES256<"establishment">(
      appConfig.apiJwtPrivateKey, // Private Key is the wrong one !
      undefined,
    );

    const response = await request
      .put(establishmentTargets.updateFormEstablishment.url)
      .set(
        "Authorization",
        generateJwtWithWrongKey(
          createEstablishmentJwtPayload({
            siret: "12345678901234",
            durationDays: 1,
            now: new Date(),
          }),
        ),
      )
      .send({});

    expectToEqual(response.body, { error: "Provided token is invalid" });
    expectToEqual(response.status, 401);
  });

  it("401 - Jwt is malformed", async () => {
    const response = await request
      .put(establishmentTargets.updateFormEstablishment.url)
      .set("Authorization", "malformed-jwt")
      .send({});

    expectToEqual(response.body, { error: "Provided token is invalid" });
    expectToEqual(response.status, 401);
  });

  it("403 - Jwt is expired", async () => {
    const response = await request
      .put(establishmentTargets.updateFormEstablishment.url)
      .set(
        "Authorization",
        generateEditEstablishmentJwt(
          createEstablishmentJwtPayload({
            siret: "12345678901234",
            durationDays: 1,
            now: subYears(gateways.timeGateway.now(), 1),
          }),
        ),
      )
      .send({});

    expectToEqual(response.body, {
      message: "Le lien magique est périmé",
      needsNewMagicLink: true,
    });
    expectToEqual(response.status, 403);
  });

  it("409 - Missing establishment form", async () => {
    const response = await request
      .put(establishmentTargets.updateFormEstablishment.url)
      .set(
        "Authorization",
        generateEditEstablishmentJwt(
          createEstablishmentJwtPayload({
            siret: TEST_OPEN_ESTABLISHMENT_2.siret,
            durationDays: 1,
            now: new Date(),
          }),
        ),
      )
      .send(
        FormEstablishmentDtoBuilder.valid()
          .withSiret(TEST_OPEN_ESTABLISHMENT_2.siret)
          .build(),
      );

    expectToEqual(response.status, 409);
    expectToEqual(response.body, {
      message:
        "Cannot update form establishment DTO with siret 77561959600155, since it is not found.",
      status: 409,
    });
    expect(inMemoryUow.outboxRepository.events).toHaveLength(1);
  });
});
