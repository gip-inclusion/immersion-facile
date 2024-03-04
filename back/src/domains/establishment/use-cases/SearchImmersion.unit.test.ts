import { addDays } from "date-fns";
import {
  ApiConsumer,
  AppellationAndRomeDto,
  SearchQueryParamsDto,
  SearchResultDto,
  addressStringToDto,
  expectToEqual,
} from "shared";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { establishmentAggregateToSearchResultByRomeForFirstLocation } from "../adapters/InMemoryEstablishmentAggregateRepository";
import { InMemoryLaBonneBoiteGateway } from "../adapters/la-bonne-boite/InMemoryLaBonneBoiteGateway";
import { LaBonneBoiteCompanyDto } from "../adapters/la-bonne-boite/LaBonneBoiteCompanyDto";
import { LaBonneBoiteCompanyDtoBuilder } from "../adapters/la-bonne-boite/LaBonneBoiteCompanyDtoBuilder";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  TEST_LOCATION,
  boulangerAssistantOffer,
  boulangerOffer,
  secretariatOffer,
} from "../helpers/EstablishmentBuilders";
import { SearchImmersion } from "./SearchImmersion";

const secretariatAppellationAndRome: AppellationAndRomeDto = {
  romeCode: "M1607",
  appellationCode: "19364",
  appellationLabel: "Secrétaire",
  romeLabel: "Secrétariat",
};

const establishment = new EstablishmentAggregateBuilder()
  .withEstablishment(
    new EstablishmentEntityBuilder()
      .withSiret("78000403200019")
      .withLocations([TEST_LOCATION])
      .withNafDto({
        code: "naf code",
        nomenclature: "naf nomenclature",
      })
      .withNumberOfEmployeeRange("20-49")
      .withWebsite("www.website.com")
      .build(),
  )
  .withContact(new ContactEntityBuilder().withContactMethod("EMAIL").build())
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
      .withNumberOfEmployeeRange("20-49")
      .withWebsite("www.website.com")
      .withSearchableBy({ students: true, jobSeekers: false })
      .build(),
  )
  .withContact(new ContactEntityBuilder().withContactMethod("EMAIL").build())
  .withOffers([secretariatOffer, boulangerOffer])
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
      .withNumberOfEmployeeRange("20-49")
      .withWebsite("www.website.com")
      .withSearchableBy({ students: false, jobSeekers: true })
      .build(),
  )
  .withContact(new ContactEntityBuilder().withContactMethod("EMAIL").build())
  .withOffers([secretariatOffer, boulangerOffer])
  .build();

describe("SearchImmersionUseCase", () => {
  let uow: InMemoryUnitOfWork;
  let uuidGenerator: TestUuidGenerator;
  let searchImmersionUseCase: SearchImmersion;
  let laBonneBoiteGateway: InMemoryLaBonneBoiteGateway;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    laBonneBoiteGateway = new InMemoryLaBonneBoiteGateway();
    uuidGenerator = new TestUuidGenerator();
    uow.romeRepository.appellations = [secretariatAppellationAndRome];
    timeGateway = new CustomTimeGateway();
    searchImmersionUseCase = new SearchImmersion(
      new InMemoryUowPerformer(uow),
      laBonneBoiteGateway,
      uuidGenerator,
      timeGateway,
    );
    uuidGenerator.setNextUuid("searchMadeUuid");
  });

  it("stores searches made", async () => {
    await searchImmersionUseCase.execute(searchSecretariatInMetzRequestDto);

    expectToEqual(uow.searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        appellationCodes: [secretariatOffer.appellationCode],
        lon: searchInMetzParams.longitude,
        lat: searchInMetzParams.latitude,
        distanceKm: searchInMetzParams.distanceKm,
        needsToBeSearched: true,
        sortedBy: "distance",
        numberOfResults: 0,
      },
    ]);
  });

  it("gets all results around if no rome is provided", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];
    laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

    const response = await searchImmersionUseCase.execute(searchInMetzParams);

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        secretariatOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        boulangerOffer.romeCode,
        606885,
      ),
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

    const response = await searchImmersionUseCase.execute({
      ...searchInMetzParams,
      sortedBy: "distance",
      appellationCodes: [
        secretariatOffer.appellationCode,
        boulangerOffer.appellationCode,
      ],
    });

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        secretariatOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        boulangerOffer.romeCode,
        606885,
      ),
      lbbToSearchResult(lbbCompanyVO),
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

    const response = await searchImmersionUseCase.execute({
      ...searchInMetzParams,
      sortedBy: "distance",
      appellationCodes: [secretariatOffer.appellationCode],
    });

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        secretariatOffer.romeCode,
        606885,
      ),
      lbbToSearchResult(lbbCompanyVO),
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

    const response = await searchImmersionUseCase.execute({
      ...searchInMetzParams,
      voluntaryToImmersion: true,
      sortedBy: "distance",
    });

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        secretariatOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        boulangerOffer.romeCode,
        606885,
      ),
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

    const response = await searchImmersionUseCase.execute({
      ...searchInMetzParams,
      appellationCodes: [secretariatOffer.appellationCode],
      sortedBy: "distance",
      voluntaryToImmersion: false,
      distanceKm: range,
    });

    expectToEqual(response, []);
  });

  it("gets only the closest LBB results if voluntaryToImmersion is false, and do not query results from DB", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];

    const range = 10;
    const companyInRange = new LaBonneBoiteCompanyDtoBuilder()
      .withSiret("22220000000022")
      .withRome(secretariatOffer.romeCode)
      .withDistanceKm(range - 5)
      .build();
    const companyJustInRange = new LaBonneBoiteCompanyDtoBuilder()
      .withSiret("33330000000033")
      .withRome(secretariatOffer.romeCode)
      .withDistanceKm(range)
      .build();
    const companyJustOutOfRange = new LaBonneBoiteCompanyDtoBuilder()
      .withSiret("44440000000044")
      .withRome(secretariatOffer.romeCode)
      .withDistanceKm(range + 1)
      .build();
    const companyFarAway = new LaBonneBoiteCompanyDtoBuilder()
      .withSiret("55550000000055")
      .withRome(secretariatOffer.romeCode)
      .withDistanceKm(range + 80)
      .build();

    laBonneBoiteGateway.setNextResults([
      companyInRange,
      companyJustInRange,
      companyJustOutOfRange,
      companyFarAway,
    ]);

    const response = await searchImmersionUseCase.execute({
      ...searchInMetzParams,
      appellationCodes: [secretariatOffer.appellationCode],
      sortedBy: "distance",
      voluntaryToImmersion: false,
      distanceKm: range,
    });

    expectToEqual(response, [
      lbbToSearchResult(companyInRange),
      lbbToSearchResult(companyJustInRange),
    ]);

    expectToEqual(uow.searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        appellationCodes: [secretariatOffer.appellationCode],
        lon: searchInMetzParams.longitude,
        lat: searchInMetzParams.latitude,
        distanceKm: range,
        needsToBeSearched: true,
        sortedBy: "distance",
        numberOfResults: 2,
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

    const response = await searchImmersionUseCase.execute({
      ...searchInMetzParams,
      appellationCodes: [secretariatOffer.appellationCode],
      sortedBy: "distance",
      voluntaryToImmersion: undefined,
    });

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        secretariatOffer.romeCode,
        606885,
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

  it("stores only the number of search results from our db when searching without specifying voluntary_to_immersion", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];

    laBonneBoiteGateway.setNextResults([
      new LaBonneBoiteCompanyDtoBuilder()
        .withSiret("33330000000033")
        .withRome(secretariatOffer.romeCode)
        .withDistanceKm(5)
        .build(),
      new LaBonneBoiteCompanyDtoBuilder()
        .withSiret("33330000000022")
        .withRome(secretariatOffer.romeCode)
        .withDistanceKm(5)
        .build(),
    ]);

    await searchImmersionUseCase.execute({
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

    const response = await searchImmersionUseCase.execute({
      ...searchInMetzParams,
      appellationCodes: [secretariatOffer.appellationCode],
      sortedBy: "distance",
    });

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        secretariatOffer.romeCode,
        606885,
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

  it("return only the establishment that only accept student if estbablishmentSearchableBy params is define to student", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
      establishmentAcceptingOnlyStudent,
      establishmentAcceptingOnlyJobSeeker,
    ];
    laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

    const searchParams: SearchQueryParamsDto = {
      ...searchInMetzParams,
      establishmentSearchableBy: "students",
    };

    const response = await searchImmersionUseCase.execute(searchParams);

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        secretariatOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        boulangerOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishmentAcceptingOnlyStudent,
        secretariatOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishmentAcceptingOnlyStudent,
        boulangerOffer.romeCode,
        606885,
      ),
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

  it("return only the establishment that only accept student if estbablishmentSearchableBy params is define to jobSeekers", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
      establishmentAcceptingOnlyStudent,
      establishmentAcceptingOnlyJobSeeker,
    ];
    laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

    const searchParams: SearchQueryParamsDto = {
      ...searchInMetzParams,
      establishmentSearchableBy: "jobSeekers",
    };

    const response = await searchImmersionUseCase.execute(searchParams);

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        secretariatOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        boulangerOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishmentAcceptingOnlyJobSeeker,
        secretariatOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishmentAcceptingOnlyJobSeeker,
        boulangerOffer.romeCode,
        606885,
      ),
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

  it("return all the establishments if estbablishmentSearchableBy params is not define", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
      establishmentAcceptingOnlyStudent,
      establishmentAcceptingOnlyJobSeeker,
    ];
    laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

    const searchParams: SearchQueryParamsDto = {
      ...searchInMetzParams,
    };

    const response = await searchImmersionUseCase.execute(searchParams);

    expectToEqual(response, [
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        secretariatOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishment,
        boulangerOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishmentAcceptingOnlyStudent,
        secretariatOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishmentAcceptingOnlyStudent,
        boulangerOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishmentAcceptingOnlyJobSeeker,
        secretariatOffer.romeCode,
        606885,
      ),
      establishmentAggregateToSearchResultByRomeForFirstLocation(
        establishmentAcceptingOnlyJobSeeker,
        boulangerOffer.romeCode,
        606885,
      ),
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

  describe("No result when a company is one internal & LBB results and the company is not searchable", () => {
    const notSearchableEstablishment = new EstablishmentAggregateBuilder(
      establishment,
    )
      .withIsSearchable(false)
      .build();

    beforeEach(() => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        notSearchableEstablishment,
      ];

      laBonneBoiteGateway.setNextResults([
        new LaBonneBoiteCompanyDtoBuilder()
          .withSiret(notSearchableEstablishment.establishment.siret)
          .withRome(secretariatOffer.romeCode)
          .build(),
      ]);
    });

    it("should only record number of internal search results", async () => {
      await searchImmersionUseCase.execute({
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
    });

    it("Without voluntary to immersion", async () => {
      const response = await searchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [secretariatOffer.appellationCode],
        sortedBy: "distance",
      });
      expectToEqual(response, []);
    });

    it("With voluntary to immersion false", async () => {
      const response = await searchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [secretariatOffer.appellationCode],
        sortedBy: "distance",
        voluntaryToImmersion: false,
      });
      expectToEqual(response, []);
    });

    it("With voluntary to immersion true", async () => {
      const response = await searchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [secretariatOffer.appellationCode],
        sortedBy: "distance",
        voluntaryToImmersion: true,
      });
      expectToEqual(response, []);
    });
  });

  describe("No result when a company is deleted & LBB results", () => {
    const notSearchableEstablishment = new EstablishmentAggregateBuilder(
      establishment,
    )
      .withIsSearchable(false)
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
      const response = await searchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [secretariatOffer.appellationCode],
        sortedBy: "distance",
      });
      expectToEqual(response, []);
    });

    it("With voluntary to immersion false", async () => {
      const response = await searchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [secretariatOffer.appellationCode],
        sortedBy: "distance",
        voluntaryToImmersion: false,
      });
      expectToEqual(response, []);
    });

    it("With voluntary to immersion true", async () => {
      const response = await searchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [secretariatOffer.appellationCode],
        sortedBy: "distance",
        voluntaryToImmersion: true,
      });
      expectToEqual(response, []);
    });
  });

  describe("No result when establishment aggregate next availability is after now", () => {
    const now = new Date();

    const establishmentWithNextAvailabilityDate =
      new EstablishmentAggregateBuilder(establishment)
        .withEstablishmentNextAvailabilityDate(addDays(now, 1))
        .withMaxContactsPerWeek(10)
        .withIsSearchable(true)
        .build();

    beforeEach(() => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentWithNextAvailabilityDate,
      ];
      uow.deletedEstablishmentRepository.deletedEstablishments = [];

      timeGateway.setNextDate(now);

      laBonneBoiteGateway.setNextResults([
        new LaBonneBoiteCompanyDtoBuilder()
          .withSiret(establishmentWithNextAvailabilityDate.establishment.siret)
          .withRome(secretariatOffer.romeCode)
          .withDistanceKm(1)
          .build(),
      ]);
    });

    it("Without voluntary to immersion", async () => {
      const response = await searchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [secretariatOffer.appellationCode],
        sortedBy: "distance",
      });
      expectToEqual(response, []);
    });

    it("With voluntary to immersion false", async () => {
      const response = await searchImmersionUseCase.execute({
        ...searchInMetzParams,
        appellationCodes: [secretariatOffer.appellationCode],
        sortedBy: "distance",
        voluntaryToImmersion: false,
      });
      expectToEqual(response, []);
    });

    it("With voluntary to immersion true", async () => {
      const response = await searchImmersionUseCase.execute({
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

        const authenticatedResponse = await searchImmersionUseCase.execute(
          { ...searchSecretariatInMetzRequestDto, voluntaryToImmersion: true },
          authenticatedApiConsumerPayload,
        );

        expectToEqual(authenticatedResponse, [
          establishmentAggregateToSearchResultByRomeForFirstLocation(
            establishment,
            secretariatOffer.romeCode,
            606885,
          ),
        ]);
      });
    });

    describe("Not authenticated with api key", () => {
      it("Search immersion, and do NOT provide contact details", async () => {
        uow.establishmentAggregateRepository.establishmentAggregates = [
          establishment,
        ];
        laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

        const unauthenticatedResponse = await searchImmersionUseCase.execute({
          ...searchSecretariatInMetzRequestDto,
          voluntaryToImmersion: true,
        });

        expectToEqual(unauthenticatedResponse, [
          establishmentAggregateToSearchResultByRomeForFirstLocation(
            establishment,
            secretariatOffer.romeCode,
            606885,
          ),
        ]);
      });
    });
  });
});

const lbbCompanyVO = new LaBonneBoiteCompanyDtoBuilder()
  .withSiret("11114444222233")
  .withRome(secretariatOffer.romeCode)
  .withDistanceKm(1)
  .build();

const searchInMetzParams: SearchQueryParamsDto = {
  distanceKm: 30,
  longitude: 6.17602,
  latitude: 49.119146,
  sortedBy: "distance",
};

const searchSecretariatInMetzRequestDto: SearchQueryParamsDto = {
  ...searchInMetzParams,
  appellationCodes: [secretariatOffer.appellationCode],
};

const authenticatedApiConsumerPayload: ApiConsumer = {
  id: "my-valid-apikey-id",
  name: "passeEmploi",
  createdAt: new Date("2021-12-20").toISOString(),
  expirationDate: new Date("2022-01-01").toISOString(),
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
  },
};

const lbbToSearchResult = (lbb: LaBonneBoiteCompanyDto): SearchResultDto => ({
  additionalInformation: "",
  address: addressStringToDto(lbb.props.address),
  appellations: [],
  customizedName: "",
  distance_m: lbb.props.distance * 1000,
  fitForDisabledWorkers: false,
  naf: lbb.props.naf,
  nafLabel: "",
  name: lbb.props.name,
  numberOfEmployeeRange: "",
  position: { lat: lbb.props.lat, lon: lbb.props.lon },
  rome: lbb.props.matched_rome_code,
  romeLabel: lbb.props.matched_rome_label,
  siret: lbb.siret,
  urlOfPartner: "",
  voluntaryToImmersion: false,
  website: "",
  locationId: null,
});
