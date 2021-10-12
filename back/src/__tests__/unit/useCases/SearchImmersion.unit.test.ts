import { SearchImmersion } from "../../../domain/searchImmersion/useCases/SearchImmersion";
import {
  fakeLaBonneBoiteGateway,
  fakeLaPlateFormeDeLInclusionGateway,
} from "../../../_testBuilders/FakeHttpCalls";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/searchImmersion/InMemoryImmersonOfferRepository";
import { ImmersionOfferEntity } from "../../../domain/searchImmersion/entities/ImmersionOfferEntity";

describe("SearchImmersion", () => {
  test("Search immersion works", async () => {
    const immersionOfferRepository = new InMemoryImmersionOfferRepository();

    const searchImmersion = new SearchImmersion(
      fakeLaBonneBoiteGateway,
      immersionOfferRepository,
    );

    const immersions = await searchImmersion.execute({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      lon: 6.17602,
    });

    expect(immersions[0]).toBeInstanceOf(ImmersionOfferEntity);
  });
});
