import { expectPromiseToFailWithError, expectToEqual } from "shared";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import {
  EstablishmentAggregateBuilder,
  establishmentAggregateToSearchResultByRome,
} from "../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { GetSearchImmersionResultBySiretAndRome } from "./GetImmersionOfferById";

const immersionOffer = new ImmersionOfferEntityV2Builder().build();
const establishmentAgg = new EstablishmentAggregateBuilder()
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

describe("GetImmersionOfferById", () => {
  let getImmersionOfferById: GetSearchImmersionResultBySiretAndRome;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getImmersionOfferById = new GetSearchImmersionResultBySiretAndRome(
      new InMemoryUowPerformer(uow),
    );
  });

  describe("right paths", () => {
    it("retreive search result", async () => {
      await uow.establishmentAggregateRepository.insertEstablishmentAggregates([
        establishmentAgg,
      ]);

      const result = await getImmersionOfferById.execute({
        siret: establishmentAgg.establishment.siret,
        rome: immersionOffer.romeCode,
      });

      expectToEqual(
        result,
        establishmentAggregateToSearchResultByRome(
          establishmentAgg,
          immersionOffer.romeCode,
          false,
        ),
      );
    });

    it("retreive search result even if establishment is not seachable", async () => {
      const notSearchableEstablishmentAgg = new EstablishmentAggregateBuilder(
        establishmentAgg,
      )
        .withIsSearchable(false)
        .build();
      await uow.establishmentAggregateRepository.insertEstablishmentAggregates([
        notSearchableEstablishmentAgg,
      ]);

      const result = await getImmersionOfferById.execute({
        siret: notSearchableEstablishmentAgg.establishment.siret,
        rome: immersionOffer.romeCode,
      });

      expectToEqual(
        result,
        establishmentAggregateToSearchResultByRome(
          notSearchableEstablishmentAgg,
          immersionOffer.romeCode,
          false,
        ),
      );
    });
  });

  describe("wrong paths", () => {
    it("missing establishement aggregate", async () => {
      await uow.establishmentAggregateRepository.insertEstablishmentAggregates(
        [],
      );

      await expectPromiseToFailWithError(
        getImmersionOfferById.execute({
          siret: establishmentAgg.establishment.siret,
          rome: immersionOffer.romeCode,
        }),
        new Error(
          `No offer found for siret ${establishmentAgg.establishment.siret} and rome ${immersionOffer.romeCode}`,
        ),
      );
    });
  });
});
