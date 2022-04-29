import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { FormEstablishmentDtoBuilder } from "../../_testBuilders/FormEstablishmentDtoBuilder";
import { TEST_ESTABLISHMENT1_SIRET } from "../../adapters/secondary/InMemorySireneRepository";
import { editEstablishmentFormRouteWithApiKey } from "shared/src/routes";
import { createEstablishmentJwtPayload } from "shared/src/tokens/MagicLinkPayload";
import { makeGenerateJwt } from "../../domain/auth/jwt";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";

describe("Route to post edited form establishments", () => {
  it("Throws 401 if not authenticated", async () => {
    const { request } = await buildTestApp();

    const response = await request
      .post(`/${editEstablishmentFormRouteWithApiKey}/dummyJwt`)
      .send({});

    // Assert
    expect(response.status).toBe(401);
  });
  it("Throws 401 if Jwt is incorrect", async () => {
    const config = new AppConfigBuilder().withTestPresetPreviousKeys().build();
    const { request } = await buildTestApp();
    const generateJwtWithWrongKey = makeGenerateJwt(config.apiJwtPrivateKey); // Private Key is the wrong one !

    const wrongJwt = generateJwtWithWrongKey(
      createEstablishmentJwtPayload({
        siret: "12345678901234",
        durationDays: 1,
        now: new Date(),
      }),
    );

    const response = await request
      .post(`/${editEstablishmentFormRouteWithApiKey}/${wrongJwt}`)
      .send({});

    // Assert
    expect(response.status).toBe(401);
  });
  it("Supports posting already existing form establisment when authenticated", async () => {
    // Prepare
    const { request, reposAndGateways, generateMagicLinkJwt } =
      await buildTestApp();

    const validJwt = generateMagicLinkJwt(
      createEstablishmentJwtPayload({
        siret: TEST_ESTABLISHMENT1_SIRET,
        durationDays: 1,
        now: new Date(),
      }),
    );
    await reposAndGateways.formEstablishment.create(
      FormEstablishmentDtoBuilder.valid()
        .withSiret(TEST_ESTABLISHMENT1_SIRET)
        .build(),
    );

    // Act
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(TEST_ESTABLISHMENT1_SIRET)
      .build();
    const response = await request
      .post(`/${editEstablishmentFormRouteWithApiKey}/${validJwt}`)
      .send(formEstablishment);

    // Assert
    expect(response.status).toBe(200);

    expect(reposAndGateways.outbox.events).toHaveLength(1);
    expect(await reposAndGateways.formEstablishment.getAll()).toEqual([
      formEstablishment,
    ]);
  });
});
