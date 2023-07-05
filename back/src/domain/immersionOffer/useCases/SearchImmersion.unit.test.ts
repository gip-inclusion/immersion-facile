import {
  addressStringToDto,
  ApiConsumer,
  expectToEqual,
  SearchImmersionParamsDto,
  SearchImmersionResultDto,
} from "shared";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import {
  boulangerAssistantImmersionOffer,
  boulangerImmersionOffer,
  secretariatImmersionOffer,
} from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { establishmentToSearchResultByRome } from "../../../_testBuilders/searchImmersionResult";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { TEST_POSITION } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryLaBonneBoiteGateway } from "../../../adapters/secondary/immersionOffer/laBonneBoite/InMemoryLaBonneBoiteGateway";
import { LaBonneBoiteCompanyDto } from "../../../adapters/secondary/immersionOffer/laBonneBoite/LaBonneBoiteCompanyDto";
import { LaBonneBoiteCompanyDtoBuilder } from "../../../adapters/secondary/immersionOffer/laBonneBoite/LaBonneBoiteCompanyDtoBuilder";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { SearchImmersion } from "./SearchImmersion";

const establishment = new EstablishmentAggregateBuilder()
  .withEstablishment(
    new EstablishmentEntityBuilder()
      .withSiret("78000403200019")
      .withPosition(TEST_POSITION)
      .withAddress({
        streetNumberAndAddress: "55 Rue du Faubourg Saint-Honoré",
        postcode: "75001",
        city: "Paris",
        departmentCode: "75",
      })
      .withNafDto({
        code: "naf code",
        nomenclature: "naf nomenclature",
      })
      .withNumberOfEmployeeRange("20-49")
      .withWebsite("www.website.com")
      .build(),
  )
  .withContact(new ContactEntityBuilder().withContactMethod("EMAIL").build())
  .withImmersionOffers([
    secretariatImmersionOffer,
    boulangerImmersionOffer,
    boulangerAssistantImmersionOffer,
  ])
  .build();

describe("SearchImmersionUseCase", () => {
  let uow: InMemoryUnitOfWork;
  let uuidGenerator: TestUuidGenerator;
  let searchImmersionUseCase: SearchImmersion;
  let laBonneBoiteGateway: InMemoryLaBonneBoiteGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    laBonneBoiteGateway = new InMemoryLaBonneBoiteGateway();
    uuidGenerator = new TestUuidGenerator();
    searchImmersionUseCase = new SearchImmersion(
      new InMemoryUowPerformer(uow),
      laBonneBoiteGateway,
      uuidGenerator,
    );
  });

  it("stores searches made", async () => {
    uuidGenerator.setNextUuid("searchMadeUuid");

    await searchImmersionUseCase.execute(searchSecretariatInMetzRequestDto);

    expectToEqual(uow.searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        rome: secretariatImmersionOffer.romeCode,
        lon: searchInMetzParams.longitude,
        lat: searchInMetzParams.latitude,
        distanceKm: searchInMetzParams.distanceKm,
        needsToBeSearched: true,
        sortedBy: "distance",
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
      establishmentToSearchResultByRome(
        establishment,
        secretariatImmersionOffer.romeCode,
        false,
        606885,
      ),
      establishmentToSearchResultByRome(
        establishment,
        boulangerImmersionOffer.romeCode,
        false,
        606885,
      ),
    ]);
  });

  it("gets both form and LBB establishments if voluntaryToImmersion is not provided", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];
    laBonneBoiteGateway.setNextResults([lbbCompanyVO]);

    const response = await searchImmersionUseCase.execute({
      ...searchInMetzParams,
      sortedBy: "distance",
      rome: secretariatImmersionOffer.romeCode,
    });

    expectToEqual(response, [
      establishmentToSearchResultByRome(
        establishment,
        secretariatImmersionOffer.romeCode,
        false,
        606885,
      ),
      lbbToSearchResult(lbbCompanyVO),
    ]);
  });

  it("gets only form establishments if voluntaryToImmersion is true", async () => {
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
      establishmentToSearchResultByRome(
        establishment,
        secretariatImmersionOffer.romeCode,
        false,
        606885,
      ),
      establishmentToSearchResultByRome(
        establishment,
        boulangerImmersionOffer.romeCode,
        false,
        606885,
      ),
    ]);
  });

  it("gets only the closest LBB establishments if voluntaryToImmersion is false, and do not query results from DB", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];

    const range = 10;
    const companyInRange = new LaBonneBoiteCompanyDtoBuilder()
      .withSiret("22220000000022")
      .withRome(secretariatImmersionOffer.romeCode)
      .withDistanceKm(range - 5)
      .build();
    const companyJustInRange = new LaBonneBoiteCompanyDtoBuilder()
      .withSiret("33330000000033")
      .withRome(secretariatImmersionOffer.romeCode)
      .withDistanceKm(range)
      .build();
    const companyJustOutOfRange = new LaBonneBoiteCompanyDtoBuilder()
      .withSiret("44440000000044")
      .withRome(secretariatImmersionOffer.romeCode)
      .withDistanceKm(range + 1)
      .build();
    const companyFarAway = new LaBonneBoiteCompanyDtoBuilder()
      .withSiret("55550000000055")
      .withRome(secretariatImmersionOffer.romeCode)
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
      rome: secretariatImmersionOffer.romeCode,
      sortedBy: "distance",
      voluntaryToImmersion: false,
      distanceKm: range,
    });

    expectToEqual(response, [
      lbbToSearchResult(companyInRange),
      lbbToSearchResult(companyJustInRange),
    ]);
  });

  it("gets only the form result if a company with same siret is also in LBB results", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];

    const lbbCompanyWithSameSiret = new LaBonneBoiteCompanyDtoBuilder()
      .withSiret(establishment.establishment.siret)
      .withRome(secretariatImmersionOffer.romeCode)
      .build();

    laBonneBoiteGateway.setNextResults([lbbCompanyWithSameSiret]);

    const response = await searchImmersionUseCase.execute({
      ...searchInMetzParams,
      rome: secretariatImmersionOffer.romeCode,
      sortedBy: "distance",
    });

    expectToEqual(response, [
      establishmentToSearchResultByRome(
        establishment,
        secretariatImmersionOffer.romeCode,
        false,
        606885,
      ),
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
          .withRome(secretariatImmersionOffer.romeCode)
          .build(),
      ]);
    });

    it("Without voluntary to immersion", async () => {
      const response = await searchImmersionUseCase.execute({
        ...searchInMetzParams,
        rome: secretariatImmersionOffer.romeCode,
        sortedBy: "distance",
      });
      expectToEqual(response, []);
    });

    it("With voluntary to immersion false", async () => {
      const response = await searchImmersionUseCase.execute({
        ...searchInMetzParams,
        rome: secretariatImmersionOffer.romeCode,
        sortedBy: "distance",
        voluntaryToImmersion: false,
      });
      expectToEqual(response, []);
    });

    it("With voluntary to immersion true", async () => {
      const response = await searchImmersionUseCase.execute({
        ...searchInMetzParams,
        rome: secretariatImmersionOffer.romeCode,
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
          establishmentToSearchResultByRome(
            establishment,
            secretariatImmersionOffer.romeCode,
            false,
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
          establishmentToSearchResultByRome(
            establishment,
            secretariatImmersionOffer.romeCode,
            false,
            606885,
          ),
        ]);
      });
    });
  });
});

const lbbCompanyVO = new LaBonneBoiteCompanyDtoBuilder()
  .withSiret("11114444222233")
  .withRome(secretariatImmersionOffer.romeCode)
  .withDistanceKm(1)
  .build();

const searchInMetzParams: SearchImmersionParamsDto = {
  distanceKm: 30,
  longitude: 6.17602,
  latitude: 49.119146,
  sortedBy: "distance",
};

const searchSecretariatInMetzRequestDto: SearchImmersionParamsDto = {
  ...searchInMetzParams,
  rome: secretariatImmersionOffer.romeCode,
};

const authenticatedApiConsumerPayload: ApiConsumer = {
  id: "my-valid-apikey-id",
  consumer: "passeEmploi",
  createdAt: new Date("2021-12-20"),
  expirationDate: new Date("2022-01-01"),
  isAuthorized: true,
};

const lbbToSearchResult = (
  lbb: LaBonneBoiteCompanyDto,
): SearchImmersionResultDto => ({
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
});
