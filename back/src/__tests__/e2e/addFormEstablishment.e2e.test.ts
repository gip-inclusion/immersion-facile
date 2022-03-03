import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { FormEstablishmentDtoBuilder } from "../../_testBuilders/FormEstablishmentDtoBuilder";
import { TEST_ESTABLISHMENT1_SIRET } from "../../adapters/secondary/InMemorySireneRepository";
import {
  addEstablishmentFormRouteWithApiKey,
  addEstablishmentFormRouteWithoutApiKey,
} from "../../shared/routes";

describe("Route to post addEstablishmentFormRouteWithoutApiKey", () => {
  it("support posting valid establishment from front", async () => {
    const { request, reposAndGateways } = await buildTestApp();

    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(TEST_ESTABLISHMENT1_SIRET)
      .build();

    const response = await request
      .post(`/${addEstablishmentFormRouteWithoutApiKey}`)
      .send(formEstablishment);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(formEstablishment.siret);

    const inRepo = await reposAndGateways.formEstablishment.getAll();
    expect(inRepo).toEqual([formEstablishment]);
  });

  describe("Route to post addEstablishmentFormRouteWithApiKey", () => {
    it("forbids access to route if no api consumer", async () => {
      const { request } = await buildTestApp();

      const response = await request
        .post(`/${addEstablishmentFormRouteWithApiKey}`)
        .send({});

      expect(response.status).toBe(403);
    });

    it("support adding establishment from known api consumer", async () => {
      const { request, reposAndGateways, generateApiJwt } =
        await buildTestApp();
      const formEstablishment = FormEstablishmentDtoBuilder.valid()
        .withSource("testConsumer")
        .withSiret(TEST_ESTABLISHMENT1_SIRET)
        .build();
      const { source, ...formEstablishmentWithoutSource } = formEstablishment;

      const jwt = generateApiJwt({ id: "my-id" });

      const response = await request
        .post(`/${addEstablishmentFormRouteWithApiKey}`)
        .set("Authorization", jwt)
        .send(formEstablishmentWithoutSource);

      expect(response.status).toBe(200);

      const inRepo = await reposAndGateways.formEstablishment.getAll();
      expect(inRepo).toEqual([formEstablishment]);
    });
  });
});
