import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemoryLaBonneBoiteAPI } from "../../../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemorySearchesMadeRepository } from "../../../adapters/secondary/immersionOffer/InMemorySearchesMadeRepository";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { SearchMadeEntity } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { UpdateEstablishmentsAndImmersionOffersFromLastSearches } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsAndImmersionOffersFromLastSearches";
import { LaBonneBoiteCompanyBuilder } from "../../../_testBuilders/LaBonneBoiteResponseBuilder";

describe("UpdateEstablishmentsAndImmersionOffersFromLastSearches", () => {
  let testUuidGenerator: TestUuidGenerator;
  let updateEstablishmentsAndImmersionOffersFromLastSearches: UpdateEstablishmentsAndImmersionOffersFromLastSearches;
  let immersionOfferRepository: InMemoryImmersionOfferRepository;
  let searchesMadeRepository: InMemorySearchesMadeRepository;
  let laBonneBoiteAPI: InMemoryLaBonneBoiteAPI;
  let sireneRepository: InMemorySireneRepository;

  beforeEach(() => {
    testUuidGenerator = new TestUuidGenerator();

    immersionOfferRepository = new InMemoryImmersionOfferRepository();

    searchesMadeRepository = new InMemorySearchesMadeRepository();

    laBonneBoiteAPI = new InMemoryLaBonneBoiteAPI();

    sireneRepository = new InMemorySireneRepository();

    updateEstablishmentsAndImmersionOffersFromLastSearches =
      new UpdateEstablishmentsAndImmersionOffersFromLastSearches(
        testUuidGenerator,
        laBonneBoiteAPI,
        sireneRepository,
        searchesMadeRepository,
        immersionOfferRepository,
      );
  });

  it("when Immersion search have been made lately, their information gets persisted in our system", async () => {
    laBonneBoiteAPI.setNextResults([new LaBonneBoiteCompanyBuilder().build()]);
    // Prepare
    const search: SearchMadeEntity = {
      id: "searchMadeId",
      rome: "A1203",
      distance_km: 10.0,
      lat: 10.0,
      lon: 20.0,
    };
    searchesMadeRepository.setSearchesMade([search]);

    // Act
    await updateEstablishmentsAndImmersionOffersFromLastSearches.execute();

    // Expect that no new searches are retrieved
    // Note : This assertion is confusing because it's highly dependent on how the  in-memory adapter...
    // Real problem is : we should have two method : one reading (getNextUnprocessedSearchMade),
    // the other writing ("setSearchMadeAsProcessed").
    expect(searchesMadeRepository.searchesMade).toHaveLength(0);

    // We expect to find the establishments in results
    const establishmentAggregatesInRepo =
      immersionOfferRepository.establishmentAggregates;

    expect(establishmentAggregatesInRepo).toHaveLength(1);

    // 1 offer from la bonne boite with 1 offer, no contact.
    const establishmentAggregateFromLaBonneBoiteInRepo =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      establishmentAggregatesInRepo.find(
        (aggregate) =>
          aggregate.establishment.dataSource === "api_labonneboite",
      )!;

    expect(establishmentAggregateFromLaBonneBoiteInRepo).toBeDefined();
    expect(
      establishmentAggregateFromLaBonneBoiteInRepo.immersionOffers,
    ).toHaveLength(1);
    expect(establishmentAggregateFromLaBonneBoiteInRepo.contacts).toHaveLength(
      0,
    );
  });
});
