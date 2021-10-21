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

    const searchImmersion = new SearchImmersion(immersionOfferRepository);

    await immersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from la bonne boite",
        voluntary_to_immersion: false,
        data_source: "api_labonneboite",
        contact_in_establishment: undefined,
        score: 4.5,
        position: { lat: 43.8666, lon: 8.3333 },
      }),
    ]);

    const immersions = await searchImmersion.execute({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      lon: 6.17602,
    });
    expect(immersions[0]).toBeInstanceOf(ImmersionOfferEntity);
  });
});
