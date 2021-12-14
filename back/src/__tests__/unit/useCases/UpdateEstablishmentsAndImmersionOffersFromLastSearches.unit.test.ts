import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAdresseAPI } from "../../../adapters/secondary/immersionOffer/InMemoryAdresseAPI";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemoryLaBonneBoiteAPI } from "../../../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemoryLaPlateformeDeLInclusionAPI } from "../../../adapters/secondary/immersionOffer/InMemoryLaPlateformeDeLInclusionAPI";
import { InMemorySearchesMadeRepository } from "../../../adapters/secondary/immersionOffer/InMemorySearchesMadeRepository";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { SearchParams } from "../../../domain/immersionOffer/entities/SearchParams";
import { UpdateEstablishmentsAndImmersionOffersFromLastSearches } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsAndImmersionOffersFromLastSearches";
import { LaBonneBoiteCompanyBuilder } from "../../../_testBuilders/LaBonneBoiteResponseBuilder";
import { LaPlateFormeDeLInclusionPosteBuilder } from "../../../_testBuilders/LaPlateFormeDeLInclusionPosteBuilder";
import { LaPlateformeDeLInclusionResultBuilder } from "../../../_testBuilders/LaPlateformeDeLInclusionResultBuilder";

describe("UpdateEstablishmentsAndImmersionOffersFromLastSearches", () => {
  let testUuidGenerator: TestUuidGenerator;
  let updateEstablishmentsAndImmersionOffersFromLastSearches: UpdateEstablishmentsAndImmersionOffersFromLastSearches;
  let immersionOfferRepository: InMemoryImmersionOfferRepository;
  let searchesMadeRepository: InMemorySearchesMadeRepository;
  let laBonneBoiteAPI: InMemoryLaBonneBoiteAPI;
  let laPlateFormeDeLInclusionAPI: InMemoryLaPlateformeDeLInclusionAPI;
  let adresseAPI: InMemoryAdresseAPI;
  let sireneRepository: InMemorySireneRepository;

  beforeEach(() => {
    testUuidGenerator = new TestUuidGenerator();

    immersionOfferRepository = new InMemoryImmersionOfferRepository();
    immersionOfferRepository.empty();

    searchesMadeRepository = new InMemorySearchesMadeRepository();

    laBonneBoiteAPI = new InMemoryLaBonneBoiteAPI();
    laPlateFormeDeLInclusionAPI = new InMemoryLaPlateformeDeLInclusionAPI();

    adresseAPI = new InMemoryAdresseAPI();
    sireneRepository = new InMemorySireneRepository();

    updateEstablishmentsAndImmersionOffersFromLastSearches =
      new UpdateEstablishmentsAndImmersionOffersFromLastSearches(
        testUuidGenerator,
        laBonneBoiteAPI,
        laPlateFormeDeLInclusionAPI,
        adresseAPI,
        sireneRepository,
        searchesMadeRepository,
        immersionOfferRepository,
      );
  });

  it("when Immersion search have been made lately, their information gets persisted in our system", async () => {
    laBonneBoiteAPI.setNextResults([new LaBonneBoiteCompanyBuilder().build()]);
    laPlateFormeDeLInclusionAPI.setNextResults([
      new LaPlateformeDeLInclusionResultBuilder()
        .withPostes([
          new LaPlateFormeDeLInclusionPosteBuilder()
            .withRome("Maintenance des bâtiments et des locaux (I1203)")
            .build(),
          new LaPlateFormeDeLInclusionPosteBuilder()
            .withRome("Conduite de transport en commun sur route (N4103)")
            .build(),
          new LaPlateFormeDeLInclusionPosteBuilder()
            .withRome("Secrétariat (M1607)")
            .build(),
        ])
        .build(),
    ]);
    adresseAPI.setNextPosition({ lat: 49.119146, lon: 6.17602 });

    // prepare
    const search: SearchParams = {
      rome: "A1203",
      distance_km: 10.0,
      lat: 10.0,
      lon: 20.0,
    };
    searchesMadeRepository.setSearchesMade([search]);

    // act
    await updateEstablishmentsAndImmersionOffersFromLastSearches.execute();

    expect(searchesMadeRepository.searchesMade).toHaveLength(0);

    //We expect to find the immersion in results
    const immersionOffersInRepo = immersionOfferRepository.immersionOffers;

    expect(immersionOffersInRepo).toHaveLength(4);

    expect(
      immersionOffersInRepo.filter(
        (immersionOffer) => immersionOffer.getRome() === "M1607",
      ),
    ).toHaveLength(2);
  });
});
