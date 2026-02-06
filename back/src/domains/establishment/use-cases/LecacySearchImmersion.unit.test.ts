import {
  type ApiConsumer,
  type AppellationAndRomeDto,
  type ExternalOfferDto,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  type LegacySearchQueryParamsDto,
  type LegacySearchQueryParamsWithGeoParams,
  type NafCode,
  type RomeDto,
} from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { establishmentAggregateToSearchResultByRomeForFirstLocation } from "../adapters/InMemoryEstablishmentAggregateRepository";
import { InMemoryLaBonneBoiteGateway } from "../adapters/la-bonne-boite/InMemoryLaBonneBoiteGateway";
import type { LaBonneBoiteCompanyDto } from "../adapters/la-bonne-boite/LaBonneBoiteCompanyDto";
import { LaBonneBoiteCompanyDtoBuilder } from "../adapters/la-bonne-boite/LaBonneBoiteCompanyDtoBuilder";
import type { EstablishmentUserRight } from "../entities/EstablishmentAggregate";
import type { SearchMadeEntity } from "../entities/SearchMadeEntity";
import {
  boulangerAssistantOffer,
  boulangerOffer,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  secretariatOffer,
  TEST_LOCATION,
} from "../helpers/EstablishmentBuilders";
import { LegacySearchImmersion } from "./LegacySearchImmersion";

const secretariatAppellationAndRome: AppellationAndRomeDto = {
  romeCode: "M1607",
  appellationCode: "19364",
  appellationLabel: "Secrétaire",
  romeLabel: "Secrétariat",
};

const establishmentScore = 12;

const userRights: EstablishmentUserRight[] = [
  {
    userId: "osef",
    role: "establishment-admin",
    job: "Chef",
    phone: "+33600000000",
    shouldReceiveDiscussionNotifications: true,
    isMainContactByPhone: false,
  },
];

const establishment = new EstablishmentAggregateBuilder()
  .withEstablishment(
    new EstablishmentEntityBuilder()
      .withSiret("78000403200019")
      .withLocations([TEST_LOCATION])
      .withNafDto({
        code: "naf code",
        nomenclature: "naf nomenclature",
      })
      .withContactMode("EMAIL")
      .withNumberOfEmployeeRange("20-49")
      .withWebsite("https://www.website.com")
      .build(),
  )
  .withScore(establishmentScore)
  .withUserRights(userRights)
  .withOffers([secretariatOffer, boulangerOffer, boulangerAssistantOffer])
  .build();

const establishmentAcceptingOnlyStudent = new EstablishmentAggregateBuilder()
  .withEstablishment(
    new EstablishmentEntityBuilder()
      .withSiret("12345677123456")
      .withLocations([TEST_LOCATION])
      .withNafDto({
        code: "naf code",
        nomenclature: "naf nomenclature",
      })
      .withContactMode("EMAIL")
      .withNumberOfEmployeeRange("20-49")
      .withWebsite("https://www.website.com")
      .withSearchableBy({ students: true, jobSeekers: false })
      .build(),
  )
  .withOffers([secretariatOffer, boulangerOffer])
  .withUserRights(userRights)
  .build();

const establishmentAcceptingOnlyJobSeeker = new EstablishmentAggregateBuilder()
  .withEstablishment(
    new EstablishmentEntityBuilder()
      .withSiret("12345678901234")
      .withLocations([TEST_LOCATION])
      .withNafDto({
        code: "naf code",
        nomenclature: "naf nomenclature",
      })
      .withContactMode("EMAIL")
      .withNumberOfEmployeeRange("20-49")
      .withWebsite("https://www.website.com")
      .withSearchableBy({ students: false, jobSeekers: true })
      .build(),
  )
  .withUserRights(userRights)
  .withOffers([secretariatOffer, boulangerOffer])
  .build();

describe("LegacySearchImmersionUseCase", () => {
  const searchWithMinimalParams: LegacySearchQueryParamsDto = {
    sortedBy: "date",
  };

  const searchInMetzParams: LegacySearchQueryParamsWithGeoParams = {
    distanceKm: 30,
    longitude: 6.17602,
    latitude: 49.119146,
    sortedBy: "distance",
  };

  const searchSecretariatInMetzRequestDto: LegacySearchQueryParamsDto = {
    ...searchInMetzParams,
    appellationCodes: [secretariatOffer.appellationCode],
  };

  let uow: InMemoryUnitOfWork;
  let uuidGenerator: TestUuidGenerator;
  let legacySearchImmersionUseCase: LegacySearchImmersion;
  let laBonneBoiteGateway: InMemoryLaBonneBoiteGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    laBonneBoiteGateway = new InMemoryLaBonneBoiteGateway();
    uuidGenerator = new TestUuidGenerator();
    uow.romeRepository.appellations = [
      secretariatAppellationAndRome,
      {
        appellationCode: boulangerOffer.appellationCode,
        appellationLabel: boulangerOffer.appellationLabel,
        romeCode: boulangerOffer.romeCode,
        romeLabel: boulangerOffer.romeLabel,
      },
    ];
    legacySearchImmersionUseCase = new LegacySearchImmersion(
      new InMemoryUowPerformer(uow),
      laBonneBoiteGateway,
      uuidGenerator,
    );
    uuidGenerator.setNextUuid("searchMadeUuid");
  });

  describe("stores searches made", () => {
    const searchMadeWithoutNafCode: SearchMadeEntity = {
      id: "searchMadeUuid",
      appellationCodes: [secretariatOffer.appellationCode],
      lon: searchInMetzParams.longitude,
      lat: searchInMetzParams.latitude,
      distanceKm: searchInMetzParams.distanceKm,
      needsToBeSearched: true,
      sortedBy: "distance",
      numberOfResults: 0,
    };

    it("without nafCode", async () => {
      await legacySearchImmersionUseCase.execute(
        searchSecretariatInMetzRequestDto,
      );

      expectToEqual(uow.searchMadeRepository.searchesMade, [
        searchMadeWithoutNafCode,
      ]);
    });

    it("with nafCodes", async () => {
      const nafCodes: NafCode[] = ["7510A", "8560C"];
      await legacySearchImmersionUseCase.execute({
        ...searchSecretariatInMetzRequestDto,
        nafCodes,
      });
      expectToEqual(uow.searchMadeRepository.searchesMade, [
        {
          ...searchMadeWithoutNafCode,
          nafCodes,
        },
      ]);
    });
  });

  describe("searches without geo params", () => {
    beforeEach(() => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishment,
        establishmentAcceptingOnlyStudent,
        establishmentAcceptingOnlyJobSeeker,
      ];
    });

    it("gets results for search made without geo params and stores search made", async () => {
      const response = await legacySearchImmersionUseCase.execute(
        searchWithMinimalParams,
      );
      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyStudent,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyStudent,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyJobSeeker,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyJobSeeker,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
      ]);

      expectToEqual(uow.searchMadeRepository.searchesMade, [
        {
          id: "searchMadeUuid",
          appellationCodes: undefined,
          needsToBeSearched: true,
          numberOfResults: 6,
          sortedBy: "date",
        },
      ]);
    });
    it("gets results for search made with appellations but without geo params", async () => {
      const response = await legacySearchImmersionUseCase.execute({
        ...searchWithMinimalParams,
        appellationCodes: [secretariatOffer.appellationCode],
      });
      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),

        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyStudent,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),

        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyJobSeeker,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
      ]);

      expectToEqual(uow.searchMadeRepository.searchesMade, [
        {
          id: "searchMadeUuid",
          needsToBeSearched: true,
          numberOfResults: 3,
          appellationCodes: [secretariatOffer.appellationCode],
          sortedBy: "date",
        },
      ]);
    });

    it("gets all results for search made with appellations but no geo params", async () => {
      const response = await legacySearchImmersionUseCase.execute(
        searchWithMinimalParams,
      );
      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyStudent,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyStudent,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyJobSeeker,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyJobSeeker,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
        }),
      ]);

      expectToEqual(uow.searchMadeRepository.searchesMade, [
        {
          id: "searchMadeUuid",
          appellationCodes: undefined,
          needsToBeSearched: true,
          numberOfResults: 6,
          sortedBy: "date",
        },
      ]);
    });
  });

  it("gets all results around if no rome is provided", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];
    laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

    const response =
      await legacySearchImmersionUseCase.execute(searchInMetzParams);

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation({
        establishmentAggregate: establishment,
        romeCode: secretariatOffer.romeCode,
        remoteWorkMode: "ON_SITE",
        distance_m: 606885,
      }),
      establishmentAggregateToSearchResultByRomeForFirstLocation({
        establishmentAggregate: establishment,
        romeCode: boulangerOffer.romeCode,
        remoteWorkMode: "ON_SITE",
        distance_m: 606885,
      }),
    ]);
    expectToEqual(uow.searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        appellationCodes: undefined,
        lon: searchInMetzParams.longitude,
        lat: searchInMetzParams.latitude,
        distanceKm: searchInMetzParams.distanceKm,
        needsToBeSearched: true,
        sortedBy: "distance",
        numberOfResults: 2,
      },
    ]);
  });

  it("gets both search results and LBB results when multiple appellationCodes", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];
    laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

    const response = await legacySearchImmersionUseCase.execute({
      ...searchInMetzParams,
      sortedBy: "distance",
      appellationCodes: [
        secretariatOffer.appellationCode,
        boulangerOffer.appellationCode,
      ],
    });

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation({
        establishmentAggregate: establishment,
        romeCode: secretariatOffer.romeCode,
        remoteWorkMode: "ON_SITE",
        distance_m: 606885,
      }),
      establishmentAggregateToSearchResultByRomeForFirstLocation({
        establishmentAggregate: establishment,
        romeCode: boulangerOffer.romeCode,
        remoteWorkMode: "ON_SITE",
        distance_m: 606885,
      }),
      lbbToSearchResult(
        lbbCompanyVO,
        {
          romeCode: secretariatOffer.romeCode,
          romeLabel: secretariatOffer.romeLabel,
        },
        { distance_m: 23649 },
      ),
    ]);
    expectToEqual(uow.searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        appellationCodes: [
          secretariatOffer.appellationCode,
          boulangerOffer.appellationCode,
        ],
        lon: searchInMetzParams.longitude,
        lat: searchInMetzParams.latitude,
        distanceKm: searchInMetzParams.distanceKm,
        needsToBeSearched: true,
        sortedBy: "distance",
        numberOfResults: 2,
      },
    ]);
  });

  it("gets both search results and LBB results if voluntaryToImmersion is not provided", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];
    laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

    const response = await legacySearchImmersionUseCase.execute({
      ...searchInMetzParams,
      sortedBy: "distance",
      appellationCodes: [secretariatOffer.appellationCode],
    });

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation({
        establishmentAggregate: establishment,
        romeCode: secretariatOffer.romeCode,
        remoteWorkMode: "ON_SITE",
        distance_m: 606885,
      }),
      lbbToSearchResult(
        lbbCompanyVO,
        {
          romeCode: secretariatOffer.romeCode,
          romeLabel: secretariatOffer.romeLabel,
        },
        { distance_m: 23649 },
      ),
    ]);
    expectToEqual(uow.searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        appellationCodes: [secretariatOffer.appellationCode],
        lon: searchInMetzParams.longitude,
        lat: searchInMetzParams.latitude,
        distanceKm: searchInMetzParams.distanceKm,
        needsToBeSearched: true,
        sortedBy: "distance",
        numberOfResults: 1,
      },
    ]);
  });

  it("gets only search results if voluntaryToImmersion is true", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];
    laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

    const response = await legacySearchImmersionUseCase.execute({
      ...searchInMetzParams,
      voluntaryToImmersion: true,
      sortedBy: "distance",
    });

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation({
        establishmentAggregate: establishment,
        romeCode: secretariatOffer.romeCode,
        remoteWorkMode: "ON_SITE",
        distance_m: 606885,
      }),
      establishmentAggregateToSearchResultByRomeForFirstLocation({
        establishmentAggregate: establishment,
        romeCode: boulangerOffer.romeCode,
        remoteWorkMode: "ON_SITE",
        distance_m: 606885,
      }),
    ]);
    expectToEqual(uow.searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        lon: searchInMetzParams.longitude,
        lat: searchInMetzParams.latitude,
        distanceKm: searchInMetzParams.distanceKm,
        needsToBeSearched: true,
        sortedBy: "distance",
        numberOfResults: 2,
        voluntaryToImmersion: true,
      },
    ]);
  });

  it("does not crash when LBB returns an error, and provides only search results", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];
    laBonneBoiteGateway.setError(new Error("This is an LBB error"));
    const range = 10;

    const response = await legacySearchImmersionUseCase.execute({
      ...searchInMetzParams,
      appellationCodes: [secretariatOffer.appellationCode],
      sortedBy: "distance",
      voluntaryToImmersion: false,
      distanceKm: range,
    });

    expectToEqual(response, []);
  });

  it("gets only LBB results if voluntaryToImmersion is false, and do not query results from DB", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];

    const range = 50;
    const companiesInRangeFromLbb = [
      new LaBonneBoiteCompanyDtoBuilder()
        .withSiret("22220000000022")
        .withRome(secretariatOffer.romeCode)
        .build(),
      new LaBonneBoiteCompanyDtoBuilder()
        .withSiret("33330000000033")
        .withRome(secretariatOffer.romeCode)
        .build(),
      new LaBonneBoiteCompanyDtoBuilder()
        .withSiret("44440000000044")
        .withRome(secretariatOffer.romeCode)
        .build(),
    ];

    laBonneBoiteGateway.setNextResults(companiesInRangeFromLbb);

    const response = await legacySearchImmersionUseCase.execute({
      ...searchInMetzParams,
      appellationCodes: [secretariatOffer.appellationCode],
      sortedBy: "distance",
      voluntaryToImmersion: false,
      distanceKm: range,
    });

    expectToEqual(
      response,
      companiesInRangeFromLbb.map((result) =>
        lbbToSearchResult(
          result,
          {
            romeCode: secretariatOffer.romeCode,
            romeLabel: secretariatOffer.romeLabel,
          },
          { distance_m: 23649 },
        ),
      ),
    );

    expectToEqual(uow.searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        appellationCodes: [secretariatOffer.appellationCode],
        lon: searchInMetzParams.longitude,
        lat: searchInMetzParams.latitude,
        distanceKm: range,
        needsToBeSearched: true,
        sortedBy: "distance",
        numberOfResults: 3,
        voluntaryToImmersion: false,
      },
    ]);
  });

  it("deduplicate results if a company with same siret is both in search results and LBB results", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];

    laBonneBoiteGateway.setNextResults([
      new LaBonneBoiteCompanyDtoBuilder()
        .withSiret(establishment.establishment.siret)
        .withRome(secretariatOffer.romeCode)
        .build(),
    ]);

    const response = await legacySearchImmersionUseCase.execute({
      ...searchInMetzParams,
      appellationCodes: [secretariatOffer.appellationCode],
      sortedBy: "distance",
      voluntaryToImmersion: undefined,
    });

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation({
        establishmentAggregate: establishment,
        romeCode: secretariatOffer.romeCode,
        remoteWorkMode: "ON_SITE",
        distance_m: 606885,
      }),
    ]);
    expectToEqual(uow.searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        appellationCodes: [secretariatOffer.appellationCode],
        lon: searchInMetzParams.longitude,
        lat: searchInMetzParams.latitude,
        distanceKm: searchInMetzParams.distanceKm,
        needsToBeSearched: true,
        sortedBy: "distance",
        numberOfResults: 1,
      },
    ]);
  });

  it("stores only the number of search results from our db when searching without specifying voluntary_to_immersion", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];

    laBonneBoiteGateway.setNextResults([
      new LaBonneBoiteCompanyDtoBuilder()
        .withSiret("33330000000033")
        .withRome(secretariatOffer.romeCode)
        .build(),
      new LaBonneBoiteCompanyDtoBuilder()
        .withSiret("33330000000022")
        .withRome(secretariatOffer.romeCode)
        .build(),
    ]);

    await legacySearchImmersionUseCase.execute({
      ...searchInMetzParams,
      appellationCodes: [secretariatOffer.appellationCode],
      sortedBy: "distance",
      voluntaryToImmersion: undefined,
    });

    expectToEqual(uow.searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        appellationCodes: [secretariatOffer.appellationCode],
        lon: searchInMetzParams.longitude,
        lat: searchInMetzParams.latitude,
        distanceKm: searchInMetzParams.distanceKm,
        needsToBeSearched: true,
        sortedBy: "distance",
        numberOfResults: 1,
      },
    ]);
  });

  it("gets only the search results if a company with same siret is also in LBB results even if establishement was previously deleted, than added again", async () => {
    uow.deletedEstablishmentRepository.deletedEstablishments = [
      {
        siret: establishment.establishment.siret,
        createdAt: new Date(),
        deletedAt: new Date(),
      },
    ];
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];

    laBonneBoiteGateway.setNextResults([
      new LaBonneBoiteCompanyDtoBuilder()
        .withSiret(establishment.establishment.siret)
        .withRome(secretariatOffer.romeCode)
        .build(),
    ]);

    const response = await legacySearchImmersionUseCase.execute({
      ...searchInMetzParams,
      appellationCodes: [secretariatOffer.appellationCode],
      sortedBy: "distance",
    });

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation({
        establishmentAggregate: establishment,
        romeCode: secretariatOffer.romeCode,
        remoteWorkMode: "ON_SITE",
        distance_m: 606885,
      }),
    ]);
    expectToEqual(uow.searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        appellationCodes: [secretariatOffer.appellationCode],
        lon: searchInMetzParams.longitude,
        lat: searchInMetzParams.latitude,
        distanceKm: searchInMetzParams.distanceKm,
        needsToBeSearched: true,
        sortedBy: "distance",
        numberOfResults: 1,
      },
    ]);
  });

  describe("estbablishmentSearchableBy param", () => {
    it("define to student : return only the establishment that only accept student", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishment,
        establishmentAcceptingOnlyStudent,
        establishmentAcceptingOnlyJobSeeker,
      ];
      laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

      const searchParams: LegacySearchQueryParamsDto = {
        ...searchInMetzParams,
        establishmentSearchableBy: "students",
      };

      const response = await legacySearchImmersionUseCase.execute(searchParams);

      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyStudent,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyStudent,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
      ]);
      expectToEqual(uow.searchMadeRepository.searchesMade, [
        {
          id: "searchMadeUuid",
          appellationCodes: undefined,
          lon: searchInMetzParams.longitude,
          lat: searchInMetzParams.latitude,
          distanceKm: searchInMetzParams.distanceKm,
          needsToBeSearched: true,
          sortedBy: "distance",
          numberOfResults: 4,
          establishmentSearchableBy: "students",
        },
      ]);
    });

    it("define to jobSeekers : return only the establishment that only accept job seekers", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishment,
        establishmentAcceptingOnlyStudent,
        establishmentAcceptingOnlyJobSeeker,
      ];
      laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

      const searchParams: LegacySearchQueryParamsDto = {
        ...searchInMetzParams,
        establishmentSearchableBy: "jobSeekers",
      };

      const response = await legacySearchImmersionUseCase.execute(searchParams);

      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyJobSeeker,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyJobSeeker,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
      ]);
      expectToEqual(uow.searchMadeRepository.searchesMade, [
        {
          id: "searchMadeUuid",
          appellationCodes: undefined,
          lon: searchInMetzParams.longitude,
          lat: searchInMetzParams.latitude,
          distanceKm: searchInMetzParams.distanceKm,
          needsToBeSearched: true,
          sortedBy: "distance",
          numberOfResults: 4,
          establishmentSearchableBy: "jobSeekers",
        },
      ]);
    });

    it("not define : return all the establishments", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishment,
        establishmentAcceptingOnlyStudent,
        establishmentAcceptingOnlyJobSeeker,
      ];
      laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

      const searchParams: LegacySearchQueryParamsDto = {
        ...searchInMetzParams,
      };

      const response = await legacySearchImmersionUseCase.execute(searchParams);

      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyStudent,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyStudent,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyJobSeeker,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentAcceptingOnlyJobSeeker,
          romeCode: boulangerOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
      ]);

      expectToEqual(uow.searchMadeRepository.searchesMade, [
        {
          id: "searchMadeUuid",
          appellationCodes: undefined,
          lon: searchInMetzParams.longitude,
          lat: searchInMetzParams.latitude,
          distanceKm: searchInMetzParams.distanceKm,
          needsToBeSearched: true,
          sortedBy: "distance",
          numberOfResults: 6,
        },
      ]);
    });
  });

  describe("When a company is in repository & in LBB results", () => {
    const notInRepoEstablishmentSiret = "11111111111111";
    const displayableEstablishment = new EstablishmentAggregateBuilder(
      establishment,
    )
      .withOffers([secretariatOffer])
      .build();

    beforeEach(() => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        displayableEstablishment,
      ];

      laBonneBoiteGateway.setNextResults([
        new LaBonneBoiteCompanyDtoBuilder()
          .withSiret(displayableEstablishment.establishment.siret)
          .withRome(secretariatOffer.romeCode)
          .build(),
      ]);
    });

    it("returns only a displayable establishment from repository, not from LBB", async () => {
      const response = await legacySearchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [secretariatOffer.appellationCode],
        sortedBy: "distance",
      });
      expectToEqual(uow.searchMadeRepository.searchesMade, [
        {
          id: "searchMadeUuid",
          appellationCodes: [secretariatOffer.appellationCode],
          lon: searchInMetzParams.longitude,
          lat: searchInMetzParams.latitude,
          distanceKm: searchInMetzParams.distanceKm,
          needsToBeSearched: true,
          sortedBy: "distance",
          numberOfResults: 1,
        },
      ]);
      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: displayableEstablishment,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
      ]);
    });

    it("returns LBB result if establishment not in repo", async () => {
      const lbbResultNotInRepo = new LaBonneBoiteCompanyDtoBuilder()
        .withSiret(notInRepoEstablishmentSiret)
        .withRome(boulangerOffer.romeCode)
        .build();
      laBonneBoiteGateway.setNextResults([lbbResultNotInRepo]);
      const response = await legacySearchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [boulangerOffer.appellationCode],
        sortedBy: "distance",
      });
      expectToEqual(response, [
        lbbToSearchResult(lbbResultNotInRepo, boulangerOffer, {
          distance_m: 23649,
        }),
      ]);
    });
  });

  describe("No result when a company is deleted & LBB results", () => {
    const notSearchableEstablishment = new EstablishmentAggregateBuilder(
      establishment,
    )
      .withIsMaxDiscussionsForPeriodReached(true)
      .build();

    beforeEach(() => {
      uow.establishmentAggregateRepository.establishmentAggregates = [];
      uow.deletedEstablishmentRepository.deletedEstablishments = [
        {
          siret: notSearchableEstablishment.establishment.siret,
          createdAt: new Date(),
          deletedAt: new Date(),
        },
      ];

      laBonneBoiteGateway.setNextResults([
        new LaBonneBoiteCompanyDtoBuilder()
          .withSiret(notSearchableEstablishment.establishment.siret)
          .withRome(secretariatOffer.romeCode)
          .build(),
      ]);
    });

    it("Without voluntary to immersion", async () => {
      const response = await legacySearchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [secretariatOffer.appellationCode],
        sortedBy: "distance",
      });
      expectToEqual(response, []);
    });

    it("With voluntary to immersion false", async () => {
      const response = await legacySearchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [secretariatOffer.appellationCode],
        sortedBy: "distance",
        voluntaryToImmersion: false,
      });
      expectToEqual(response, []);
    });

    it("With voluntary to immersion true", async () => {
      const response = await legacySearchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [secretariatOffer.appellationCode],
        sortedBy: "distance",
        voluntaryToImmersion: true,
      });
      expectToEqual(response, []);
    });
  });

  describe("handle authentication", () => {
    describe("authenticated with api key", () => {
      it("Search immersion, and DO NOT provide contact details", async () => {
        uow.establishmentAggregateRepository.establishmentAggregates = [
          establishment,
        ];
        laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

        const authenticatedResponse =
          await legacySearchImmersionUseCase.execute(
            {
              ...searchSecretariatInMetzRequestDto,
              voluntaryToImmersion: true,
            },
            authenticatedApiConsumerPayload,
          );

        expectToEqual(authenticatedResponse, [
          establishmentAggregateToSearchResultByRomeForFirstLocation({
            establishmentAggregate: establishment,
            romeCode: secretariatOffer.romeCode,
            remoteWorkMode: "ON_SITE",
            distance_m: 606885,
          }),
        ]);
      });
    });

    describe("Not authenticated with api key", () => {
      it("Search immersion, and do NOT provide contact details", async () => {
        uow.establishmentAggregateRepository.establishmentAggregates = [
          establishment,
        ];
        laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

        const unauthenticatedResponse =
          await legacySearchImmersionUseCase.execute({
            ...searchSecretariatInMetzRequestDto,
            voluntaryToImmersion: true,
          });

        expectToEqual(unauthenticatedResponse, [
          establishmentAggregateToSearchResultByRomeForFirstLocation({
            establishmentAggregate: establishment,
            romeCode: secretariatOffer.romeCode,
            remoteWorkMode: "ON_SITE",
            distance_m: 606885,
          }),
        ]);
      });
    });
  });

  describe("repository call optimization", () => {
    it("does not call discussion & convention repositories when there is no search results", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [];

      const response = await legacySearchImmersionUseCase.execute({
        ...searchSecretariatInMetzRequestDto,
        sortedBy: "score",
      });

      expectToEqual(response, []);
      expectToEqual(uow.discussionRepository.discussionCallsCount, 0);
      expectToEqual(uow.conventionQueries.getConventionsByFiltersCalled, 0);
    });

    it("does not call discussion & convention repositories when there is search results but not sorted by score", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishment,
      ];

      const response = await legacySearchImmersionUseCase.execute({
        ...searchSecretariatInMetzRequestDto,
        ...searchInMetzParams,
        sortedBy: "distance",
      });

      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
      ]);
      expectToEqual(uow.discussionRepository.discussionCallsCount, 0);
      expectToEqual(uow.conventionQueries.getConventionsByFiltersCalled, 0);
    });
  });

  describe("scoring capabilities", () => {
    it("orders search results by score", async () => {
      const establishment1 = new EstablishmentAggregateBuilder(establishment)
        .withEstablishmentSiret("11112312312311")
        .withScore(100)
        .build();

      const establishment2 = new EstablishmentAggregateBuilder(establishment)
        .withEstablishmentSiret("22222312312312")
        .withScore(200)
        .build();

      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishment1,
        establishment2,
      ];

      const response = await legacySearchImmersionUseCase.execute({
        ...searchSecretariatInMetzRequestDto,
        sortedBy: "score",
      });

      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment2,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishment1,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
      ]);
    });
  });

  describe("filter FitForDisabledWorkers", () => {
    const establishmentWithFitForDisabledWorkersNo =
      new EstablishmentAggregateBuilder(establishment)
        .withEstablishmentSiret("11111111111111")
        .withFitForDisabledWorkers("no")
        .build();

    const establishmentWithFitForDisabledWorkersYesCertified =
      new EstablishmentAggregateBuilder(establishment)
        .withEstablishmentSiret("11111111111112")
        .withFitForDisabledWorkers("yes-ft-certified")
        .build();

    const establishmentWithFitForDisabledWorkersYesDeclaredOnly =
      new EstablishmentAggregateBuilder(establishment)
        .withEstablishmentSiret("11111111111113")
        .withFitForDisabledWorkers("yes-declared-only")
        .build();

    beforeEach(() => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentWithFitForDisabledWorkersNo,
        establishmentWithFitForDisabledWorkersYesCertified,
        establishmentWithFitForDisabledWorkersYesDeclaredOnly,
      ];
    });

    it("without filter all establisments", async () => {
      const response = await legacySearchImmersionUseCase.execute({
        ...searchSecretariatInMetzRequestDto,
      });

      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentWithFitForDisabledWorkersNo,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate:
            establishmentWithFitForDisabledWorkersYesCertified,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate:
            establishmentWithFitForDisabledWorkersYesDeclaredOnly,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
      ]);
    });

    it("with filter false establishments with fitForDisabledWorkers false (legacy has no literals)", async () => {
      const response = await legacySearchImmersionUseCase.execute({
        ...searchSecretariatInMetzRequestDto,
        fitForDisabledWorkers: false,
      });

      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentWithFitForDisabledWorkersNo,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
      ]);
    });

    it("with filter true establishments with fitForDisabledWorkers true (legacy has no literals)", async () => {
      const response = await legacySearchImmersionUseCase.execute({
        ...searchSecretariatInMetzRequestDto,
        fitForDisabledWorkers: true,
      });

      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate:
            establishmentWithFitForDisabledWorkersYesCertified,
          romeCode: secretariatOffer.romeCode,
          distance_m: 606885,
          customScore:
            establishmentWithFitForDisabledWorkersYesCertified.establishment
              .score,
          remoteWorkMode: "ON_SITE",
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate:
            establishmentWithFitForDisabledWorkersYesDeclaredOnly,
          romeCode: secretariatOffer.romeCode,
          distance_m: 606885,
          customScore:
            establishmentWithFitForDisabledWorkersYesDeclaredOnly.establishment
              .score,
          remoteWorkMode: "ON_SITE",
        }),
      ]);
    });
  });

  describe("param nafCode", () => {
    const naf7201A: NafCode = "7201A";
    const naf6001B: NafCode = "6001B";
    const naf5044C: NafCode = "5044C";

    const establishmentWithNafA = new EstablishmentAggregateBuilder(
      establishment,
    )
      .withEstablishmentNaf({ code: naf7201A, nomenclature: "" })
      .withEstablishmentSiret("11111111111111")
      .build();

    const establishmentWithNafB = new EstablishmentAggregateBuilder(
      establishment,
    )
      .withEstablishmentNaf({ code: naf6001B, nomenclature: "" })
      .withEstablishmentSiret("11111111111112")
      .build();

    const establishmentWithNafC = new EstablishmentAggregateBuilder(
      establishment,
    )
      .withEstablishmentNaf({ code: naf5044C, nomenclature: "" })
      .withEstablishmentSiret("11111111111113")
      .build();

    const lbbWithNafA = new LaBonneBoiteCompanyDtoBuilder()
      .withSiret("11114444222211")
      .withRome(secretariatOffer.romeCode)
      .withNaf({ code: naf7201A, nomenclature: "" })
      .build();

    const lbbWithNafB = new LaBonneBoiteCompanyDtoBuilder()
      .withSiret("11114444222222")
      .withRome(secretariatOffer.romeCode)
      .withNaf({ code: naf6001B, nomenclature: "" })
      .build();
    const lbbWithNafC = new LaBonneBoiteCompanyDtoBuilder()
      .withSiret("11114444222233")
      .withRome(secretariatOffer.romeCode)
      .withNaf({ code: naf5044C, nomenclature: "" })
      .build();

    beforeEach(() => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentWithNafA,
        establishmentWithNafB,
        establishmentWithNafC,
      ];
      laBonneBoiteGateway.setNextResults([
        lbbWithNafA,
        lbbWithNafB,
        lbbWithNafC,
      ]);
    });

    it("bad request error when nafCodes provided but empty", async () => {
      await expectPromiseToFailWithError(
        legacySearchImmersionUseCase.execute({
          ...searchSecretariatInMetzRequestDto,
          nafCodes: [],
        }),
        errors.inputs.badSchema({
          useCaseName: "LegacySearchImmersion",
          flattenErrors: [
            "nafCodes : Too small: expected array to have >=1 items",
          ],
        }),
      );
    });

    it("all establishment when filter is not provided", async () => {
      const response = await legacySearchImmersionUseCase.execute(
        searchSecretariatInMetzRequestDto,
      );

      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentWithNafA,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentWithNafB,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentWithNafC,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        lbbToSearchResult(
          lbbWithNafA,
          {
            romeCode: secretariatOffer.romeCode,
            romeLabel: secretariatOffer.romeLabel,
          },
          { distance_m: 23649 },
        ),
        lbbToSearchResult(
          lbbWithNafB,
          {
            romeCode: secretariatOffer.romeCode,
            romeLabel: secretariatOffer.romeLabel,
          },
          { distance_m: 23649 },
        ),
        lbbToSearchResult(
          lbbWithNafC,
          {
            romeCode: secretariatOffer.romeCode,
            romeLabel: secretariatOffer.romeLabel,
          },
          { distance_m: 23649 },
        ),
      ]);
    });

    it("only establishments with a naf code when provided", async () => {
      const response = await legacySearchImmersionUseCase.execute({
        ...searchSecretariatInMetzRequestDto,
        nafCodes: [naf7201A],
      });

      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentWithNafA,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        lbbToSearchResult(
          lbbWithNafA,
          {
            romeCode: secretariatOffer.romeCode,
            romeLabel: secretariatOffer.romeLabel,
          },
          { distance_m: 23649 },
        ),
      ]);
    });

    it("only establishments with multiple naf codes when provided", async () => {
      const response = await legacySearchImmersionUseCase.execute({
        ...searchSecretariatInMetzRequestDto,
        nafCodes: [naf7201A, naf6001B],
      });

      expectToEqual(response, [
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentWithNafA,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        establishmentAggregateToSearchResultByRomeForFirstLocation({
          establishmentAggregate: establishmentWithNafB,
          romeCode: secretariatOffer.romeCode,
          remoteWorkMode: "ON_SITE",
          distance_m: 606885,
        }),
        lbbToSearchResult(
          lbbWithNafA,
          {
            romeCode: secretariatOffer.romeCode,
            romeLabel: secretariatOffer.romeLabel,
          },
          { distance_m: 23649 },
        ),
        lbbToSearchResult(
          lbbWithNafB,
          {
            romeCode: secretariatOffer.romeCode,
            romeLabel: secretariatOffer.romeLabel,
          },
          { distance_m: 23649 },
        ),
      ]);
    });
  });
});

const lbbCompanyVO = new LaBonneBoiteCompanyDtoBuilder()
  .withSiret("11114444222233")
  .withRome(secretariatOffer.romeCode)
  .build();

const authenticatedApiConsumerPayload: ApiConsumer = {
  id: "my-valid-apikey-id",
  name: "passeEmploi",
  createdAt: new Date("2021-12-20").toISOString(),
  expirationDate: new Date("2022-01-01").toISOString(),
  revokedAt: null,
  currentKeyIssuedAt: new Date("2021-12-20").toISOString(),
  contact: {
    firstName: "",
    lastName: "",
    emails: [""],
    phone: "",
    job: "",
  },
  rights: {
    searchEstablishment: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
    convention: {
      kinds: [],
      scope: {
        agencyIds: [],
      },
      subscriptions: [],
    },
    statistics: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
};

const lbbToSearchResult = (
  lbb: LaBonneBoiteCompanyDto,
  romeDto: RomeDto,
  { distance_m }: { distance_m: number | undefined },
): ExternalOfferDto => ({
  address: {
    city: lbb.props.city,
    postcode: lbb.props.postcode,
    streetNumberAndAddress: "",
    departmentCode: lbb.props.department_number,
  },
  appellations: [],
  distance_m,
  establishmentScore: 0,
  locationId: null,
  naf: lbb.props.naf,
  nafLabel: lbb.props.naf_label,
  name: lbb.props.company_name,
  numberOfEmployeeRange: `${lbb.props.headcount_min}-${lbb.props.headcount_max}`,
  position: lbb.props.location,
  rome: romeDto.romeCode,
  romeLabel: romeDto.romeLabel,
  siret: lbb.siret,
  urlOfPartner: `https://labonneboite.francetravail.fr/entreprise/${lbb.siret}`,
  voluntaryToImmersion: false,
  fitForDisabledWorkers: null,
});
