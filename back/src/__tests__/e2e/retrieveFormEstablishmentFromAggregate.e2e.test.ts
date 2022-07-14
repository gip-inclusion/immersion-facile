import { formEstablishmentsRoute } from "shared/src/routes";
import { createEstablishmentMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { TEST_ESTABLISHMENT1_SIRET } from "../../adapters/secondary/InMemorySireneGateway";

describe("Route to retrieve form establishment given an establishment JWT", () => {
  it("Throws 401 if not authenticated", async () => {
    const { request } = await buildTestApp();

    const response = await request.get(`/${formEstablishmentsRoute}/noJwt`);

    // Assert
    expect(response.status).toBe(401);
  });
  it("Retrieves form establishment from aggregates when exists and authenticated", async () => {
    // Prepare
    const { request, generateMagicLinkJwt, inMemoryUow } = await buildTestApp();
    const siret = TEST_ESTABLISHMENT1_SIRET;
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [
        new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityV2Builder()
              .withSiret(siret)
              .withDataSource("form")
              .withAddress("108 rue des prunes, 75019 Paris")
              .build(),
          )
          .build(),
      ],
    );

    // Act
    const validJwt = generateMagicLinkJwt(
      createEstablishmentMagicLinkPayload({
        siret,
        durationDays: 1,
        now: new Date(),
      }),
    );
    const response = await request
      .get(`/${formEstablishmentsRoute}/${siret}`)
      .set("Authorization", validJwt);

    // Assert
    expect(response.body).toMatchObject({
      siret,
      source: "immersion-facile",
      businessAddress: "108 rue des prunes, 75019 Paris",
    });
    expect(response.status).toBe(200);
  });
});
