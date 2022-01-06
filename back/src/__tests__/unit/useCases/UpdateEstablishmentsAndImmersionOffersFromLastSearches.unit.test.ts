import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAdresseAPI } from "../../../adapters/secondary/immersionOffer/InMemoryAdresseAPI";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemoryLaBonneBoiteAPI } from "../../../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemoryLaPlateformeDeLInclusionAPI } from "../../../adapters/secondary/immersionOffer/InMemoryLaPlateformeDeLInclusionAPI";
import { InMemorySearchesMadeRepository } from "../../../adapters/secondary/immersionOffer/InMemorySearchesMadeRepository";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { SearchMadeEntity } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
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

    expect(establishmentAggregatesInRepo).toHaveLength(2);

    // 1 establishment from la plateforme de l'inclusion with 3 offers, no contact.
    const establishmentAggregateFromLaPlateformeDeLinclusionInRepo =
      establishmentAggregatesInRepo.find(
        (aggregate) =>
          aggregate.establishment.dataSource === "api_laplateformedelinclusion",
      );
    expect(
      establishmentAggregateFromLaPlateformeDeLinclusionInRepo,
    ).toBeDefined();

    expect(
      establishmentAggregateFromLaPlateformeDeLinclusionInRepo?.immersionOffers,
    ).toHaveLength(3);

    expect(
      establishmentAggregateFromLaPlateformeDeLinclusionInRepo?.contacts,
    ).toHaveLength(0);

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
