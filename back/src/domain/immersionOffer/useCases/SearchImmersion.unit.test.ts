import {
  AddressDto,
  ApiConsumer,
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto,
} from "shared";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import {
  defaultNafCode,
  EstablishmentEntityBuilder,
} from "../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import {
  InMemoryEstablishmentAggregateRepository,
  TEST_APPELLATION_LABEL,
  TEST_NAF_LABEL,
  TEST_POSITION,
  TEST_ROME_LABEL,
} from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { SearchMadeEntity } from "../entities/SearchMadeEntity";
import { SearchImmersion } from "./SearchImmersion";

const secretariatRome = "M1607";
const boulangerRome = "D1102";

const searchInMetzParams: SearchImmersionQueryParamsDto = {
  distance_km: 30,
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

const insertLBBAggregate = async (
  establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository,
) =>
  establishmentAggregateRepository.insertEstablishmentAggregates([
    new EstablishmentAggregateBuilder()
      .withEstablishment(
        new EstablishmentEntityBuilder()
          .withDataSource("api_labonneboite")
          .build(),
      )
      .build(),
  ]);

const prepareSearchableData = async () => {
  const uow = createInMemoryUow();
  const establishmentAggregateRepository = uow.establishmentAggregateRepository;
  const searchMadeRepository = uow.searchMadeRepository;

  const uuidGenerator = new TestUuidGenerator();

  const searchImmersion = new SearchImmersion(
    new InMemoryUowPerformer(uow),
    uuidGenerator,
  );
  const siret = "78000403200019";

  const establishment = new EstablishmentEntityBuilder()
    .withSiret(siret)
    .withAddress({
      streetNumberAndAddress: "55 Rue du Faubourg Saint-Honoré",
      postcode: "75001",
      city: "Paris",
      departmentCode: "75",
    })
    .withDataSource("form")
    .withNumberOfEmployeeRange("20-49")
    .withWebsite("www.website.com")
    .build();

  const secretariatImmersionOffer = new ImmersionOfferEntityV2Builder()
    .withRomeCode(secretariatRome)
    .build();

  const boulangerInMetzImmersionOffer = new ImmersionOfferEntityV2Builder()
    .withRomeCode(boulangerRome)
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
      .withImmersionOffers([boulangerInMetzImmersionOffer])
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
  };
};

const searchSecretariatInMetzRequestDto: SearchImmersionQueryParamsDto = {
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
        distance_km: searchInMetzParams.distance_km,
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
  it("gets only form establishments if voluntaryToImmersion is true", async () => {
    const { searchImmersion, establishmentAggregateRepository } =
      await prepareSearchableData();
    await insertLBBAggregate(establishmentAggregateRepository);

    const response = await searchImmersion.execute({
      ...searchInMetzParams,
      voluntaryToImmersion: true,
      sortedBy: "distance",
    });

    expect(response).toHaveLength(2);
    expect(response[0].voluntaryToImmersion).toBe(true);
    expect(response[1].voluntaryToImmersion).toBe(true);
  });
  it("gets only lbb establishments if voluntarytoImmersion is false", async () => {
    const { searchImmersion, establishmentAggregateRepository } =
      await prepareSearchableData();

    await insertLBBAggregate(establishmentAggregateRepository);

    const response = await searchImmersion.execute({
      ...searchInMetzParams,
      sortedBy: "distance",
      voluntaryToImmersion: false,
    });

    expect(response).toHaveLength(1);
    expect(response[0].voluntaryToImmersion).toBe(false);
  });

  describe("authenticated with api key", () => {
    it("Search immersion, and DO NOT provide contact details", async () => {
      const { searchImmersion } = await prepareSearchableData();

      const authenticatedResponse = await searchImmersion.execute(
        searchSecretariatInMetzRequestDto,
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
          appellationLabels: [TEST_APPELLATION_LABEL],
          numberOfEmployeeRange: "20-49",
        },
      ]);
      expect(authenticatedResponse[0].contactDetails).toBeUndefined();
    });
  });

  describe("Not authenticated with api key", () => {
    it("Search immersion, and do NOT provide contact details", async () => {
      const { searchImmersion } = await prepareSearchableData();

      const unauthenticatedResponse = await searchImmersion.execute(
        searchSecretariatInMetzRequestDto,
      );

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
          appellationLabels: [TEST_APPELLATION_LABEL],
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
