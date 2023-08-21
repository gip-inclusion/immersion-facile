import {
  createBackOfficeJwtPayload,
  createEstablishmentJwtPayload,
  establishmentTargets,
} from "shared";
import {
  rueSaintHonore,
  rueSaintHonoreDto,
} from "../../../../_testBuilders/addressDtos";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../secondary/siret/InMemorySiretGateway";

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

  it("Throws 400 if missing establishment", async () => {
    // Prepare
    const { request, generateBackOfficeJwt } = await buildTestApp();

    // Act
    const validJwt = generateBackOfficeJwt(
      createBackOfficeJwtPayload({
        durationDays: 1,
        now: new Date(),
      }),
    );

    const response = await request
      .get(
        establishmentTargets.getFormEstablishment.url.replace(
          ":siret",
          TEST_OPEN_ESTABLISHMENT_1.siret,
        ),
      )
      .set("Authorization", validJwt);

    // Assert
    expect(response.body).toMatchObject({
      errors: "No establishment found with siret 12345678901234.",
    });
    expect(response.status).toBe(400);
  });

  it("Retrieves form establishment from aggregates when exists and authenticated with establishment jwt", async () => {
    // Prepare
    const { request, generateEditEstablishmentJwt, inMemoryUow } =
      await buildTestApp();

    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [
        new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
              .withAddress(rueSaintHonoreDto)
              .build(),
          )
          .build(),
      ],
    );

    // Act
    const validJwt = generateEditEstablishmentJwt(
      createEstablishmentJwtPayload({
        siret: TEST_OPEN_ESTABLISHMENT_1.siret,
        durationDays: 1,
        now: new Date(),
      }),
    );

    const response = await request
      .get(
        establishmentTargets.getFormEstablishment.url.replace(
          ":siret",
          TEST_OPEN_ESTABLISHMENT_1.siret,
        ),
      )
      .set("Authorization", validJwt);

    // Assert
    expect(response.body).toMatchObject({
      siret: TEST_OPEN_ESTABLISHMENT_1.siret,
      source: "immersion-facile",
      businessAddress: rueSaintHonore,
    });
    expect(response.status).toBe(200);
  });

  it("Retrieves form establishment from aggregates when exists and authenticated with backoffice jwt", async () => {
    // Prepare
    const { request, generateBackOfficeJwt, inMemoryUow } =
      await buildTestApp();

    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [
        new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
              .withAddress(rueSaintHonoreDto)
              .build(),
          )
          .build(),
      ],
    );

    // Act
    const validJwt = generateBackOfficeJwt(
      createBackOfficeJwtPayload({
        durationDays: 1,
        now: new Date(),
      }),
    );

    const response = await request
      .get(
        establishmentTargets.getFormEstablishment.url.replace(
          ":siret",
          TEST_OPEN_ESTABLISHMENT_1.siret,
        ),
      )
      .set("Authorization", validJwt);

    // Assert
    expect(response.body).toMatchObject({
      siret: TEST_OPEN_ESTABLISHMENT_1.siret,
      source: "immersion-facile",
      businessAddress: rueSaintHonore,
    });
    expect(response.status).toBe(200);
  });
});
