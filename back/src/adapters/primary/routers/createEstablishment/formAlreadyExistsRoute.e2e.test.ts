import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../../_testBuilders/EstablishmentEntityV2Builder";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import { establishmentTargets } from "shared";

describe("route to check if a form's siret already exists", () => {
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;
  const siret = "11111111111111";

  beforeEach(async () => {
    ({ request, inMemoryUow } = await buildTestApp());
  });
  it("Returns false if the siret does not exist", async () => {
    await request
      .get(establishmentTargets.isEstablishmentWithSiretAlreadyRegistered.url)
      .expect(200, "false");
  });

  it("Returns true if the siret exists", async () => {
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [
        new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityV2Builder()
              .withDataSource("form")
              .withSiret(siret)
              .build(),
          )
          .build(),
      ],
    );
    await request
      .get(
        establishmentTargets.isEstablishmentWithSiretAlreadyRegistered.url.replace(
          ":siret",
          siret,
        ),
      )
      .expect(200, "true");
  });
});
