import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { FormEstablishmentDtoBuilder } from "../../_testBuilders/FormEstablishmentDtoBuilder";
import { TEST_ESTABLISHMENT1_SIRET } from "../../adapters/secondary/InMemorySireneRepository";
import { immersionOffersRoute } from "../../shared/routes";

describe("Route to post FormEstablishments", () => {
  it("support posting valid establisment", async () => {
    const { request, reposAndGateways } = await buildTestApp();
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(TEST_ESTABLISHMENT1_SIRET)
      .build();

    const response = await request
      .post(`/${immersionOffersRoute}`)
      .send(formEstablishment);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(formEstablishment.siret);

    const inRepo = await reposAndGateways.formEstablishment.getAll();
    expect(inRepo).toEqual([formEstablishment]);
  });
});
