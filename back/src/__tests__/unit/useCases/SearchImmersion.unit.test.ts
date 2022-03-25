import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import {
  InMemoryEstablishmentAggregateRepository,
  TEST_CITY,
  TEST_NAF_LABEL,
  TEST_POSITION,
  TEST_ROME_LABEL,
} from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemorySearchMadeRepository } from "../../../adapters/secondary/immersionOffer/InMemorySearchMadeRepository";
import { ApiConsumer } from "../../../domain/core/valueObjects/ApiConsumer";
import { ImmersionOfferId } from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchMadeEntity } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { SearchImmersion } from "../../../domain/immersionOffer/useCases/SearchImmersion";
import { SearchImmersionRequestDto } from "../../../shared/searchImmersion/SearchImmersionRequest.dto";
import { SearchImmersionResultDto } from "../../../shared/searchImmersion/SearchImmersionResult.dto";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";

const secretariatRome = "M1607";
const boulangerRome = "D1102";

const searchInMetzParams = {
  distance_km: 30,
  location: {
    lat: 49.119146,
    lon: 6.17602,
  },
};

const prepareSearchableData = async () => {
  const establishmentAggregateRepository =
    new InMemoryEstablishmentAggregateRepository();
  const searchMadeRepository = new InMemorySearchMadeRepository();

  const uuidGenerator = new TestUuidGenerator();

  const searchImmersion = new SearchImmersion(
    searchMadeRepository,
    establishmentAggregateRepository,
    uuidGenerator,
  );
  const siret = "78000403200019";
  const secretariatInMetzOfferId = "13df03a5-a2a5-430a-b558-ed3e2f03536d";
  const boulangerInMetzOfferId = "16df03a5-a2a5-430a-b558-ed3e2f03536d";

  const establishment = new EstablishmentEntityV2Builder()
    .withSiret(siret)
    .withAddress("55 Rue du Faubourg Saint-Honoré")
    .withDataSource("api_labonneboite")
    .withNumberOfEmployeeRange(12)
    .build();

  const secretariatImmersionOffer = new ImmersionOfferEntityV2Builder()
    .withId(secretariatInMetzOfferId)
    .withRomeCode(secretariatRome)
    .build();

  const boulangerInMetzImmersionOffer = new ImmersionOfferEntityV2Builder()
    .withId(boulangerInMetzOfferId)
    .withRomeCode(boulangerRome)
    .build();

  const contact = new ContactEntityV2Builder()
    .withContactMethod("EMAIL")
    .build();

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
    immersionOfferId: secretariatInMetzOfferId,
    searchMadeRepository,
    establishmentAggregateRepository,
    uuidGenerator,
  };
};

const searchSecretariatInMetzRequestDto: SearchImmersionRequestDto = {
  rome: secretariatRome,
  ...searchInMetzParams,
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
        ...searchInMetzParams.location,
        distance_km: searchInMetzParams.distance_km,
        needsToBeSearched: true,
      },
    ]);
  });

  it("gets all results around if no rome is provided", async () => {
    const { searchImmersion, immersionOfferId } = await prepareSearchableData();

    const response = await searchImmersion.execute(searchInMetzParams);

    expect(response).toHaveLength(2);
    expectSearchImmersionResultDto(response[0], {
      id: immersionOfferId,
      rome: "M1607",
      naf: "8539A",
      siret: "78000403200019",
      name: "Company inside repository",
      voluntaryToImmersion: false,
      location: TEST_POSITION,
      address: "55 Rue du Faubourg Saint-Honoré",
      contactMode: "EMAIL",
      distance_m: 606885,
      city: TEST_CITY,
      nafLabel: TEST_NAF_LABEL,
      romeLabel: TEST_ROME_LABEL,
    });
  });

  describe("authenticated with api key", () => {
    it("Search immersion, and provide contact details", async () => {
      const { searchImmersion, immersionOfferId, uuidGenerator } =
        await prepareSearchableData();
      const generatedOfferId: ImmersionOfferId = "generated-immersion-offer-id";
      uuidGenerator.setNextUuids(["searchMadeUuid", generatedOfferId]);

      const authenticatedResponse = await searchImmersion.execute(
        searchSecretariatInMetzRequestDto,
        authenticatedApiConsumerPayload,
      );

      expectSearchResponseToMatch(authenticatedResponse, [
        {
          id: immersionOfferId,
          rome: secretariatRome,
          naf: "8539A",
          siret: "78000403200019",
          name: "Company inside repository",
          voluntaryToImmersion: false,
          location: TEST_POSITION,
          address: "55 Rue du Faubourg Saint-Honoré",
          contactMode: "EMAIL",
          distance_m: 606885,
          city: TEST_CITY,
          nafLabel: TEST_NAF_LABEL,
          romeLabel: TEST_ROME_LABEL,
          contactDetails: {
            id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
            firstName: "Alain",
            lastName: "Prost",
            email: "alain.prost@email.fr",
            role: "le big boss",
            phone: "0612345678",
          },
          numberOfEmployeeRange: "20-49",
        },
      ]);
    });
  });

  describe("Not authenticated with api key", () => {
    it("Search immersion, and do NOT provide contact details", async () => {
      const { searchImmersion, immersionOfferId, uuidGenerator } =
        await prepareSearchableData();

      const generatedOfferId: ImmersionOfferId = "generated-immersion-offer-id";
      uuidGenerator.setNextUuids(["searchMadeUuid", generatedOfferId]);
      const unauthenticatedResponse = await searchImmersion.execute(
        searchSecretariatInMetzRequestDto,
      );

      expectSearchResponseToMatch(unauthenticatedResponse, [
        {
          id: immersionOfferId,
          rome: "M1607",
          naf: "8539A",
          siret: "78000403200019",
          name: "Company inside repository",
          voluntaryToImmersion: false,
          location: TEST_POSITION,
          address: "55 Rue du Faubourg Saint-Honoré",
          contactMode: "EMAIL",
          distance_m: 606885,
          city: TEST_CITY,
          nafLabel: TEST_NAF_LABEL,
          romeLabel: TEST_ROME_LABEL,
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
