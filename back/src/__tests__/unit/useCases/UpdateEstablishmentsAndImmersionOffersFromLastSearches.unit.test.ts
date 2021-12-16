import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { SearchParams } from "../../../domain/immersionOffer/entities/SearchParams";
import { GetPosition } from "../../../domain/immersionOffer/ports/GetPosition";
import { UpdateEstablishmentsAndImmersionOffersFromLastSearches } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsAndImmersionOffersFromLastSearches";
import { LaPlateFormeDeLInclusionPosteBuilder } from "../../../_testBuilders/LaPlateFormeDeLInclusionPosteBuilder";
import { InMemoryLaBonneBoiteAPI } from "./../../../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemoryLaPlateformeDeLInclusionAPI } from "./../../../adapters/secondary/immersionOffer/InMemoryLaPlateformeDeLInclusionAPI";
import { InMemorySearchesMadeRepository } from "./../../../adapters/secondary/immersionOffer/InMemorySearchesMadeRepository";
import { LaBonneBoiteCompanyBuilder } from "./../../../_testBuilders/LaBonneBoiteResponseBuilder";
import { LaPlateformeDeLInclusionResultBuilder } from "./../../../_testBuilders/LaPlateformeDeLInclusionResultBuilder";

const inMemorySireneRepository = new InMemorySireneRepository();

describe("UpdateEstablishmentsAndImmersionOffersFromLastSearches", () => {
  let testUuidGenerator: TestUuidGenerator;
  let updateEstablishmentsAndImmersionOffersFromLastSearches: UpdateEstablishmentsAndImmersionOffersFromLastSearches;
  let immersionOfferRepository: InMemoryImmersionOfferRepository;
  let searchesMadeRepository: InMemorySearchesMadeRepository;
  let laBonneBoiteAPI: InMemoryLaBonneBoiteAPI;
  let laPlateFormeDeLInclusionAPI: InMemoryLaPlateformeDeLInclusionAPI;

  beforeEach(() => {
    testUuidGenerator = new TestUuidGenerator();

    immersionOfferRepository = new InMemoryImmersionOfferRepository();
    immersionOfferRepository.empty();

    searchesMadeRepository = new InMemorySearchesMadeRepository();

    laBonneBoiteAPI = new InMemoryLaBonneBoiteAPI();
    laPlateFormeDeLInclusionAPI = new InMemoryLaPlateformeDeLInclusionAPI();

    const fakeGetPosition: GetPosition = async (_address: string) => ({
      lat: 49.119146,
      lon: 6.17602,
    });

    updateEstablishmentsAndImmersionOffersFromLastSearches =
      new UpdateEstablishmentsAndImmersionOffersFromLastSearches(
        testUuidGenerator,
        laBonneBoiteAPI,
        laPlateFormeDeLInclusionAPI,
        fakeGetPosition,
        inMemorySireneRepository,
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
