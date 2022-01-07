import { FeatureFlagsBuilder } from "../../../_testBuilders/FeatureFlagsBuilder";
import { LaBonneBoiteCompanyBuilder } from "../../../_testBuilders/LaBonneBoiteResponseBuilder";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import {
  InMemoryImmersionOfferRepository,
  TEST_CITY,
  TEST_NAF_LABEL,
  TEST_POSITION,
  TEST_ROME_LABEL,
} from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemoryLaBonneBoiteAPI } from "../../../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemorySearchesMadeRepository } from "../../../adapters/secondary/immersionOffer/InMemorySearchesMadeRepository";
import { SearchMadeEntity } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { SearchImmersion } from "../../../domain/immersionOffer/useCases/SearchImmersion";
import {
  ImmersionOfferId,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { ApiConsumer } from "../../../shared/tokens/ApiConsumer";

type PrepareSearchableDataProps = {
  withLBBSearchOnFetch?: boolean;
};

const prepareSearchableData =
  ({ withLBBSearchOnFetch }: PrepareSearchableDataProps) =>
  async () => {
    const immersionOfferRepository = new InMemoryImmersionOfferRepository();
    const searchesMadeRepository = new InMemorySearchesMadeRepository();
    const laBonneBoiteAPI = new InMemoryLaBonneBoiteAPI();
    const uuidGenerator = new TestUuidGenerator();
    const featureFlagBuilder = FeatureFlagsBuilder.allOff();
    const featureFlags = withLBBSearchOnFetch
      ? featureFlagBuilder.enableLBBFetchOnSearch().build()
      : featureFlagBuilder.build();

    const lbbCompany = new LaBonneBoiteCompanyBuilder()
      .withRome("M1607")
      .withSiret("11112222333344")
      .withNaf("8500A")
      .build();
    laBonneBoiteAPI.setNextResults([lbbCompany]);
    const generatedOfferId: ImmersionOfferId = "generated-immersion-offer-id";
    uuidGenerator.setNextUuid(generatedOfferId);

    const searchImmersion = new SearchImmersion(
      searchesMadeRepository,
      immersionOfferRepository,
      laBonneBoiteAPI,
      uuidGenerator,
      featureFlags,
    );
    const siret = "78000403200019";
    const immersionOfferId = "13df03a5-a2a5-430a-b558-ed3e2f03536d";
    const establishment = new EstablishmentEntityV2Builder()
      .withSiret(siret)
      .withContactMode("EMAIL")
      .withAddress("55 Rue du Faubourg Saint-Honoré")
      .withNaf("8539A")
      .build();
    const immersionOffer = new ImmersionOfferEntityV2Builder()
      .withId(immersionOfferId)
      .withRome("M1607")
      .build();
    const contact = new ContactEntityV2Builder().build();

    await immersionOfferRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContacts([contact])
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    return {
      searchImmersion,
      immersionOfferId,
      searchesMadeRepository,
      immersionOfferRepository,
      generatedOfferId,
      uuidGenerator,
    };
  };

const prepareSearchableDataWithFeatureFlagON = prepareSearchableData({
  withLBBSearchOnFetch: true,
});

const prepareSearchableDataWithFeatureFlagOFF = prepareSearchableData({
  withLBBSearchOnFetch: false,
});

const searchSecretariatInMetzParams = {
  rome: "M1607",
  nafDivision: "85",
  distance_km: 30,
  location: {
    lat: 49.119146,
    lon: 6.17602,
  },
};

const authenticatedApiConsumerPayload: ApiConsumer = {
  consumer: "passeEmploi",
  id: "my-valid-apikey-id",
  exp: new Date("2022-01-01").getTime(),
  iat: new Date("2021-12-20").getTime(),
};

describe("SearchImmersionUseCase", () => {
  it("stores searches made", async () => {
    const { searchImmersion, searchesMadeRepository, uuidGenerator } =
      await prepareSearchableDataWithFeatureFlagON();
    uuidGenerator.setNextUuid("searchMadeUuid");
    await searchImmersion.execute(searchSecretariatInMetzParams);

    expectSearchesStoredToEqual(searchesMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        rome: "M1607",
        nafDivision: "85",
        lat: 49.119146,
        lon: 6.17602,
        distance_km: 30,
      },
    ]);
  });

  describe("With feature flag ON", () => {
    test("when more than 15 results, return unmutated object", async () => {
      const { searchImmersion, immersionOfferRepository } =
        await prepareSearchableDataWithFeatureFlagON();

      const fakeSearchResponse = Array(16).fill({} as SearchImmersionResultDto);

      immersionOfferRepository.getFromSearch = async () => fakeSearchResponse;

      const authenticatedResponse = await searchImmersion.execute(
        searchSecretariatInMetzParams,
        authenticatedApiConsumerPayload,
      );

      expect(authenticatedResponse).toBe(fakeSearchResponse);
    });

    describe("authenticated with api key", () => {
      test("Search immersion, and provide contact details", async () => {
        const { searchImmersion, immersionOfferId, generatedOfferId } =
          await prepareSearchableDataWithFeatureFlagON();

        const authenticatedResponse = await searchImmersion.execute(
          searchSecretariatInMetzParams,
          authenticatedApiConsumerPayload,
        );

        expectSearchResponseToMatch(authenticatedResponse, [
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
            contactDetails: {
              id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
              firstName: "Alain",
              lastName: "Prost",
              email: "alain.prost@email.fr",
              role: "le big boss",
              phone: "0612345678",
            },
          },
          {
            id: generatedOfferId,
            rome: "M1607",
            siret: "11112222333344",
          },
        ]);
        expect(authenticatedResponse[1].contactDetails).toBeUndefined();
      });
    });

    describe("Not authenticated with api key", () => {
      test("Search immersion, and do NOT provide contact details", async () => {
        const { searchImmersion, immersionOfferId, generatedOfferId } =
          await prepareSearchableDataWithFeatureFlagON();

        const unauthenticatedResponse = await searchImmersion.execute(
          searchSecretariatInMetzParams,
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
          {
            id: generatedOfferId,
            rome: "M1607",
            siret: "11112222333344",
          },
        ]);
        expect(unauthenticatedResponse[1].contactDetails).toBeUndefined();
      });
    });
  });

  describe("With feature flag OFF", () => {
    describe("authenticated with api key", () => {
      test("Search immersion, and provide contact details", async () => {
        const { searchImmersion, immersionOfferId } =
          await prepareSearchableDataWithFeatureFlagOFF();

        const authenticatedResponse = await searchImmersion.execute(
          searchSecretariatInMetzParams,
          authenticatedApiConsumerPayload,
        );

        expectSearchResponseToMatch(authenticatedResponse, [
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
            contactDetails: {
              id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
              firstName: "Alain",
              lastName: "Prost",
              email: "alain.prost@email.fr",
              role: "le big boss",
              phone: "0612345678",
            },
          },
        ]);
      });
    });

    describe("Not authenticated with api key", () => {
      test("Search immersion, and do NOT provide contact details", async () => {
        const { searchImmersion, immersionOfferId } =
          await prepareSearchableDataWithFeatureFlagOFF();

        const unauthenticatedResponse = await searchImmersion.execute(
          searchSecretariatInMetzParams,
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
});

const expectSearchResponseToMatch = (
  actual: SearchImmersionResultDto[],
  expected: Partial<SearchImmersionResultDto>[],
) => {
  expect(actual).toMatchObject(expected);
};

const expectSearchesStoredToEqual = (
  actual: SearchMadeEntity[],
  expected: SearchMadeEntity[],
) => {
  expect(actual).toEqual(expected);
};
