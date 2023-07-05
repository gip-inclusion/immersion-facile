import {
  AddressDto,
  ApiConsumer,
  expectArraysToEqualIgnoringOrder,
  expectArraysToMatch,
  SearchImmersionParamsDto,
  SearchImmersionResultDto,
} from "shared";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import {
  defaultNafCode,
  EstablishmentEntityBuilder,
} from "../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { LaBonneBoiteCompanyVOBuilder } from "../../../_testBuilders/LaBonneBoiteCompanyVOBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import {
  TEST_NAF_LABEL,
  TEST_POSITION,
  TEST_ROME_LABEL,
} from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryLaBonneBoiteAPI } from "../../../adapters/secondary/immersionOffer/laBonneBoite/InMemoryLaBonneBoiteAPI";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { SearchMadeEntity } from "../entities/SearchMadeEntity";
import { SearchImmersion } from "./SearchImmersion";

const secretariatRome = "M1607";
const boulangerRome = "D1102";

const searchInMetzParams: SearchImmersionParamsDto = {
  distanceKm: 30,
  longitude: 6.17602,
  latitude: 49.119146,
  sortedBy: "distance",
};

const rueSaintHonore: AddressDto = {
  streetNumberAndAddress: "55 Rue du Faubourg Saint-Honoré",
  postcode: "75001",
  city: "Paris",
  departmentCode: "75",
};

const lbbCompanyVO = new LaBonneBoiteCompanyVOBuilder()
  .withSiret("11114444222233")
  .withRome(secretariatRome)
  .withDistance(1)
  .build();

const siretOfFormCompany = "78000403200019";

const prepareSearchableData = async () => {
  const laBonneBoiteAPI = new InMemoryLaBonneBoiteAPI([lbbCompanyVO]);
  const uow = createInMemoryUow();
  const establishmentAggregateRepository = uow.establishmentAggregateRepository;
  const searchMadeRepository = uow.searchMadeRepository;

  const uuidGenerator = new TestUuidGenerator();

  const searchImmersion = new SearchImmersion(
    new InMemoryUowPerformer(uow),
    laBonneBoiteAPI,
    uuidGenerator,
  );

  const establishment = new EstablishmentEntityBuilder()
    .withSiret(siretOfFormCompany)
    .withAddress({
      streetNumberAndAddress: "55 Rue du Faubourg Saint-Honoré",
      postcode: "75001",
      city: "Paris",
      departmentCode: "75",
    })
    .withNumberOfEmployeeRange("20-49")
    .withWebsite("www.website.com")
    .build();

  const secretariatImmersionOffer = new ImmersionOfferEntityV2Builder()
    .withRomeCode(secretariatRome)
    .withAppellationLabel("Secrétaire")
    .withAppellationCode("19364")
    .build();

  const boulangerImmersionOffer = new ImmersionOfferEntityV2Builder()
    .withRomeCode(boulangerRome)
    .withAppellationLabel("Boulanger / Boulangère")
    .withAppellationCode("11573")
    .build();

  const contact = new ContactEntityBuilder().withContactMethod("EMAIL").build();

  const establishmentAggregateInMetzForSecretariat =
    new EstablishmentAggregateBuilder()
      .withEstablishment(establishment)
      .withContact(contact)
      .withImmersionOffers([secretariatImmersionOffer])
      .build();

  const establishmentAggregateInMetzForBoulanger =
    new EstablishmentAggregateBuilder()
      .withEstablishment(establishment)
      .withContact(contact)
      .withImmersionOffers([boulangerImmersionOffer])
      .build();

  await establishmentAggregateRepository.insertEstablishmentAggregates([
    establishmentAggregateInMetzForSecretariat,
    establishmentAggregateInMetzForBoulanger,
  ]);

  return {
    searchImmersion,
    searchMadeRepository,
    establishmentAggregateRepository,
    uuidGenerator,
    laBonneBoiteAPI,
    boulangerImmersionOffer,
    secretariatImmersionOffer,
  };
};

const searchSecretariatInMetzRequestDto: SearchImmersionParamsDto = {
  rome: secretariatRome,
  ...searchInMetzParams,
  sortedBy: "distance",
};

const authenticatedApiConsumerPayload: ApiConsumer = {
  id: "my-valid-apikey-id",
  consumer: "passeEmploi",
  createdAt: new Date("2021-12-20"),
  expirationDate: new Date("2022-01-01"),
  isAuthorized: true,
};

describe("SearchImmersionUseCase", () => {
  it("stores searches made", async () => {
    const { searchImmersion, searchMadeRepository, uuidGenerator } =
      await prepareSearchableData();
    uuidGenerator.setNextUuid("searchMadeUuid");
    await searchImmersion.execute(searchSecretariatInMetzRequestDto);

    expectSearchesStoredToEqual(searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        rome: secretariatRome,
        lon: searchInMetzParams.longitude,
        lat: searchInMetzParams.latitude,
        distance_km: searchInMetzParams.distanceKm,
        needsToBeSearched: true,
        sortedBy: "distance",
      },
    ]);
  });

  it("gets all results around if no rome is provided", async () => {
    const { searchImmersion } = await prepareSearchableData();

    const response = await searchImmersion.execute(searchInMetzParams);

    expect(response).toHaveLength(2);
    expectSearchImmersionResultDto(response[0], {
      rome: "M1607",
      naf: defaultNafCode,
      siret: "78000403200019",
      name: "Company inside repository",
      voluntaryToImmersion: true,
      position: TEST_POSITION,
      address: rueSaintHonore,
      contactMode: "EMAIL",
      distance_m: 606885,
      nafLabel: TEST_NAF_LABEL,
      romeLabel: TEST_ROME_LABEL,
      website: "www.website.com",
    });
  });

  it("gets both form and LBB establishments if voluntaryToImmersion is not provided", async () => {
    const { searchImmersion, secretariatImmersionOffer } =
      await prepareSearchableData();

    const response = await searchImmersion.execute({
      ...searchInMetzParams,
      sortedBy: "distance",
      rome: secretariatRome,
    });

    expect(response).toHaveLength(2);

    expectArraysToEqualIgnoringOrder(response, [
      {
        additionalInformation: "",
        address: {
          city: "Paris",
          departmentCode: "75",
          postcode: "75001",
          streetNumberAndAddress: "55 Rue du Faubourg Saint-Honoré",
        },
        appellations: [
          {
            appellationLabel: secretariatImmersionOffer.appellationLabel,
            appellationCode: secretariatImmersionOffer.appellationCode,
          },
        ],
        contactMode: "EMAIL",
        customizedName: undefined,
        distance_m: 606885,
        naf: "7820Z",
        nafLabel: "test_naf_label",
        name: "Company inside repository",
        numberOfEmployeeRange: "20-49",
        position: { lat: 43.8666, lon: 8.3333 },
        rome: "M1607",
        romeLabel: "test_rome_label",
        siret: "78000403200019",
        voluntaryToImmersion: true,
        website: "www.website.com",
      },
      {
        additionalInformation: "",
        address: {
          city: "SEREMANGE-ERZANGE",
          departmentCode: "57",
          postcode: "57290",
          streetNumberAndAddress:
            "Service des ressources humaines,  IMPASSE FENDERIE",
        },
        appellations: [],
        customizedName: "",
        distance_m: 1000,
        fitForDisabledWorkers: false,
        naf: "8810C",
        nafLabel: "",
        name: "BLANCHISSERIE LA FENSCH",
        numberOfEmployeeRange: "",
        position: { lat: 49.3225, lon: 6.08067 },
        rome: "M1607",
        romeLabel: "Some label",
        siret: "11114444222233",
        urlOfPartner: "",
        voluntaryToImmersion: false,
        website: "",
      },
    ]);
  });

  it("gets only form establishments if voluntaryToImmersion is true", async () => {
    const { searchImmersion } = await prepareSearchableData();

    const response = await searchImmersion.execute({
      ...searchInMetzParams,
      voluntaryToImmersion: true,
      sortedBy: "distance",
    });

    expect(response).toHaveLength(2);
    expect(response[0].voluntaryToImmersion).toBe(true);
    expect(response[1].voluntaryToImmersion).toBe(true);
  });

  it("gets only the closest LBB establishments if voluntaryToImmersion is false, and do not query results from DB", async () => {
    const { searchImmersion, laBonneBoiteAPI } = await prepareSearchableData();

    const range = 10;
    const companyInRange = new LaBonneBoiteCompanyVOBuilder()
      .withSiret("22220000000022")
      .withRome(secretariatRome)
      .withDistance(range - 5)
      .build();
    const companyJustInRange = new LaBonneBoiteCompanyVOBuilder()
      .withSiret("33330000000033")
      .withRome(secretariatRome)
      .withDistance(range)
      .build();
    const companyJustOutOfRange = new LaBonneBoiteCompanyVOBuilder()
      .withSiret("44440000000044")
      .withRome(secretariatRome)
      .withDistance(range + 1)
      .build();
    const companyFarAway = new LaBonneBoiteCompanyVOBuilder()
      .withSiret("55550000000055")
      .withRome(secretariatRome)
      .withDistance(range + 80)
      .build();

    laBonneBoiteAPI.setNextResults([
      companyInRange,
      companyJustInRange,
      companyJustOutOfRange,
      companyFarAway,
    ]);

    const response = await searchImmersion.execute({
      ...searchInMetzParams,
      rome: secretariatRome,
      sortedBy: "distance",
      voluntaryToImmersion: false,
      distanceKm: range,
    });

    expect(response).toHaveLength(2);
    expectArraysToMatch(
      response.map(({ siret }) => siret),
      [companyInRange.siret, companyJustInRange.siret],
    );
  });

  it("gets only the form result if a company with same siret is also in LBB results", async () => {
    const { searchImmersion, laBonneBoiteAPI } = await prepareSearchableData();
    const lbbCompanyWithSameSiret = new LaBonneBoiteCompanyVOBuilder()
      .withSiret(siretOfFormCompany)
      .withRome(secretariatRome)
      .build();

    laBonneBoiteAPI.setNextResults([lbbCompanyWithSameSiret]);

    const response = await searchImmersion.execute({
      ...searchInMetzParams,
      rome: secretariatRome,
      sortedBy: "distance",
    });

    expect(response).toHaveLength(1);
    expect(response[0].voluntaryToImmersion).toBe(true);
  });

  describe("authenticated with api key", () => {
    it("Search immersion, and DO NOT provide contact details", async () => {
      const { searchImmersion, secretariatImmersionOffer } =
        await prepareSearchableData();

      const authenticatedResponse = await searchImmersion.execute(
        { ...searchSecretariatInMetzRequestDto, voluntaryToImmersion: true },
        authenticatedApiConsumerPayload,
      );

      expectSearchResponseToMatch(authenticatedResponse, [
        {
          rome: secretariatRome,
          naf: defaultNafCode,
          siret: "78000403200019",
          name: "Company inside repository",
          voluntaryToImmersion: true,
          position: TEST_POSITION,
          address: rueSaintHonore,
          contactMode: "EMAIL",
          distance_m: 606885,
          nafLabel: TEST_NAF_LABEL,
          romeLabel: TEST_ROME_LABEL,
          appellations: [
            {
              appellationLabel: secretariatImmersionOffer.appellationLabel,
              appellationCode: secretariatImmersionOffer.appellationCode,
            },
          ],
          numberOfEmployeeRange: "20-49",
        },
      ]);
      expect(authenticatedResponse[0].contactDetails).toBeUndefined();
    });
  });

  describe("Not authenticated with api key", () => {
    it("Search immersion, and do NOT provide contact details", async () => {
      const { searchImmersion, secretariatImmersionOffer } =
        await prepareSearchableData();

      const unauthenticatedResponse = await searchImmersion.execute({
        ...searchSecretariatInMetzRequestDto,
        voluntaryToImmersion: true,
      });

      expectSearchResponseToMatch(unauthenticatedResponse, [
        {
          rome: "M1607",
          naf: defaultNafCode,
          siret: "78000403200019",
          name: "Company inside repository",
          voluntaryToImmersion: true,
          position: TEST_POSITION,
          address: rueSaintHonore,
          contactMode: "EMAIL",
          distance_m: 606885,
          nafLabel: TEST_NAF_LABEL,
          romeLabel: TEST_ROME_LABEL,
          appellations: [
            {
              appellationLabel: secretariatImmersionOffer.appellationLabel,
              appellationCode: secretariatImmersionOffer.appellationCode,
            },
          ],
        },
      ]);
      expect(unauthenticatedResponse[0].contactDetails).toBeUndefined();
    });
  });
});
const expectSearchResponseToMatch = (
  actual: SearchImmersionResultDto[],
  expected: Partial<SearchImmersionResultDto>[],
) => {
  expect(actual).toMatchObject(expected);
};

const expectSearchImmersionResultDto = (
  actual: SearchImmersionResultDto,
  expected: Partial<SearchImmersionResultDto>,
) => {
  expect(actual).toMatchObject(expected);
};

const expectSearchesStoredToEqual = (
  actual: SearchMadeEntity[],
  expected: SearchMadeEntity[],
) => {
  expect(actual).toEqual(expected);
};
