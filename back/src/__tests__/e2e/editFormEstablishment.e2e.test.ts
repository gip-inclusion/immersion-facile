import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { FormEstablishmentDtoBuilder } from "../../_testBuilders/FormEstablishmentDtoBuilder";
import { TEST_ESTABLISHMENT1_SIRET } from "../../adapters/secondary/InMemorySireneRepository";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { editEstablishmentFormRouteWithApiKey } from "../../shared/routes";

describe("Route to post edited form establishments", () => {
  it("support posting already existing form establisment", async () => {
    // Prepare
    const { request, reposAndGateways } = await buildTestApp();
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
      .post(`/${editEstablishmentFormRouteWithApiKey}`)
      .send(formEstablishment);

    // Assert
    expect(response.status).toBe(200);

    expect(reposAndGateways.outbox.events).toHaveLength(1);
    expect(await reposAndGateways.formEstablishment.getAll()).toEqual([
      formEstablishment,
    ]);
  });
});
