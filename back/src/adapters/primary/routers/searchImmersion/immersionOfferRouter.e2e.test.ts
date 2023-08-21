import { type SuperTest, type Test } from "supertest";
import { AppellationCode, immersionOfferTargets, SiretDto } from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { ContactEntityBuilder } from "../../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

const makeImmersionOfferUrl = (
  siret: SiretDto | undefined,
  appellationCode: AppellationCode | undefined,
): string =>
  `${immersionOfferTargets.getImmersionOffer.url}?siret=${siret}&appellationCode=${appellationCode}`;

const immersionOffer = new ImmersionOfferEntityV2Builder().build();
const establishmentAggregate = new EstablishmentAggregateBuilder()
  .withEstablishment(
    new EstablishmentEntityBuilder().withSiret("11112222333344").build(),
  )
  .withContact(
    new ContactEntityBuilder()
      .withId("theContactId")
      .withContactMethod("EMAIL")
      .build(),
  )
  .withImmersionOffers([immersionOffer])
  .build();

describe("immersionOfferRouter", () => {
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    const testAppAndDeps = await buildTestApp();
    request = testAppAndDeps.request;
    inMemoryUow = testAppAndDeps.inMemoryUow;
  });

  describe(`GET immersion-offer route`, () => {
    it(`GET route with mandatory params should return 200`, async () => {
      await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
        [establishmentAggregate],
      );

      const response = await request.get(
        makeImmersionOfferUrl(
          establishmentAggregate.establishment.siret,
          establishmentAggregate.immersionOffers[0].appellationCode,
        ),
      );

      expect(response.status).toBe(200);
    });

    it(`GET route without mandatory fields or invalid fields should return 400`, async () => {
      const response = await request.get(
        makeImmersionOfferUrl("my-fake-siret", undefined),
      );

      expect(response.status).toBe(400);
      expect(response.body.errors).toHaveLength(2);
    });
  });
});
