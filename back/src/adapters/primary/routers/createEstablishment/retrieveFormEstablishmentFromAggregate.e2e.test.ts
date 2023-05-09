import {
  createEstablishmentMagicLinkPayload,
  establishmentTargets,
} from "shared";
import {
  rueSaintHonore,
  rueSaintHonoreDto,
} from "../../../../_testBuilders/addressDtos";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { TEST_ESTABLISHMENT1_SIRET } from "../../../secondary/siret/InMemorySiretGateway";

describe("Route to retrieve form establishment given an establishment JWT", () => {
  it("Throws 401 if not authenticated", async () => {
    const { request } = await buildTestApp();

    const response = await request.get(
      establishmentTargets.getFormEstablishment.url.replace(
        ":siret",
        "no-siret",
      ),
    );

    // Assert
    expect(response.status).toBe(401);
  });
  it("Retrieves form establishment from aggregates when exists and authenticated", async () => {
    // Prepare
    const { request, generateEditEstablishmentJwt, inMemoryUow } =
      await buildTestApp();
    const siret = TEST_ESTABLISHMENT1_SIRET;
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [
        new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withSiret(siret)
              .withAddress(rueSaintHonoreDto)
              .build(),
          )
          .build(),
      ],
    );

    // Act
    const validJwt = generateEditEstablishmentJwt(
      createEstablishmentMagicLinkPayload({
        siret,
        durationDays: 1,
        now: new Date(),
      }),
    );

    const response = await request
      .get(
        establishmentTargets.getFormEstablishment.url.replace(":siret", siret),
      )
      .set("Authorization", validJwt);

    // Assert
    expect(response.body).toMatchObject({
      siret,
      source: "immersion-facile",
      businessAddress: rueSaintHonore,
    });
    expect(response.status).toBe(200);
  });
});
