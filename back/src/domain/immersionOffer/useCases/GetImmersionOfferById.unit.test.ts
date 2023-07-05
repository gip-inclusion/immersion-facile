import { expectPromiseToFailWithError, expectToEqual } from "shared";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { establishmentToSearchResultByRome } from "../../../_testBuilders/searchImmersionResult";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { GetImmersionOfferById } from "./GetImmersionOfferById";

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
  let getImmersionOfferById: GetImmersionOfferById;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getImmersionOfferById = new GetImmersionOfferById(
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
        establishmentToSearchResultByRome(
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
        establishmentToSearchResultByRome(
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
