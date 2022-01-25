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
import { InMemorySearchMadeRepository } from "../../../adapters/secondary/immersionOffer/InMemorySearchMadeRepository";
import { SearchMadeEntity } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { SearchImmersion } from "../../../domain/immersionOffer/useCases/SearchImmersion";
import {
  ImmersionOfferId,
  SearchImmersionRequestDto,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { ApiConsumer } from "../../../shared/tokens/ApiConsumer";
import { InMemoryLaBonneBoiteRequestRepository } from "../../../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteRequestRepository";
import { LaBonneBoiteRequestEntity } from "../../../domain/immersionOffer/entities/LaBonneBoiteRequestEntity";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import {
  LaBonneBoiteCompanyProps,
  LaBonneBoiteCompanyVO,
} from "../../../domain/immersionOffer/valueObjects/LaBonneBoiteCompanyVO";

type PrepareParams = {
  storedEstablishmentNaf?: string;
};

const prepareSearchableData = async (params: PrepareParams | void) => {
  const immersionOfferRepository = new InMemoryImmersionOfferRepository();
  const searchMadeRepository = new InMemorySearchMadeRepository();
  const laBonneBoiteRequestRepository =
    new InMemoryLaBonneBoiteRequestRepository();

  const laBonneBoiteAPI = new InMemoryLaBonneBoiteAPI();
  const uuidGenerator = new TestUuidGenerator();
  const clock = new CustomClock();

  const lbbCompany = new LaBonneBoiteCompanyBuilder()
    .withRome("M1607")
    .withSiret("11112222333344")
    .withNaf("8500A")
    .build();
  laBonneBoiteAPI.setNextResults([lbbCompany]);

  const searchImmersion = new SearchImmersion(
    searchMadeRepository,
    immersionOfferRepository,
    laBonneBoiteRequestRepository,
    laBonneBoiteAPI,
    uuidGenerator,
    clock,
  );
  const siret = "78000403200019";
  const immersionOfferId = "13df03a5-a2a5-430a-b558-ed3e2f03536d";
  const establishment = new EstablishmentEntityV2Builder()
    .withSiret(siret)
    .withContactMode("EMAIL")
    .withAddress("55 Rue du Faubourg Saint-Honoré")
    .withNaf(params?.storedEstablishmentNaf ?? "8539A")
    .withNumberOfEmployeeRange(12)
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
    searchMadeRepository,
    immersionOfferRepository,
    laBonneBoiteRequestRepository,
    laBonneBoiteAPI,
    uuidGenerator,
    clock,
  };
};

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
    const { searchImmersion, searchMadeRepository, uuidGenerator } =
      await prepareSearchableData();
    uuidGenerator.setNextUuid("searchMadeUuid");
    await searchImmersion.execute(searchSecretariatInMetzParams);

    expectSearchesStoredToEqual(searchMadeRepository.searchesMade, [
      {
        id: "searchMadeUuid",
        rome: "M1607",
        nafDivision: "85",
        lat: 49.119146,
        lon: 6.17602,
        distance_km: 30,
        needsToBeSearched: true,
      },
    ]);
  });

  describe("authenticated with api key", () => {
    test("Search immersion, and provide contact details", async () => {
      const { searchImmersion, immersionOfferId, uuidGenerator } =
        await prepareSearchableData();
      const generatedOfferId: ImmersionOfferId = "generated-immersion-offer-id";
      uuidGenerator.setNextUuids(["searchMadeUuid", generatedOfferId]);

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
          numberOfEmployeeRange: "20-49",
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
      const { searchImmersion, immersionOfferId, uuidGenerator } =
        await prepareSearchableData();
      const generatedOfferId: ImmersionOfferId = "generated-immersion-offer-id";
      uuidGenerator.setNextUuids(["searchMadeUuid", generatedOfferId]);
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

    test("Search immersion, and ignore irrelevant companies", async () => {
      // Prepare
      const {
        searchImmersion,
        immersionOfferId,
        uuidGenerator,
        laBonneBoiteAPI,
      } = await prepareSearchableData({
        storedEstablishmentNaf: "78201",
      });
      const generatedOfferId: ImmersionOfferId = "generated-immersion-offer-id";
      const irrelevantLbbCompanyId: ImmersionOfferId =
        "irrelevant-immersion-offer-id";
      uuidGenerator.setNextUuids([
        "searchMadeUuid",
        generatedOfferId,
        irrelevantLbbCompanyId,
      ]);

      const lbbCompany = new LaBonneBoiteCompanyBuilder()
        .withRome("M1607")
        .withSiret("11112222333344")
        .withNaf("78200")
        .build();
      const irrelevantLbbCompany = new LaBonneBoiteCompanyBuilder()
        .withRome("M1607")
        .withSiret("11112222333355")
        .withNaf("7820Z") // "this is interim Naf, which should be ignored"
        .build();
      laBonneBoiteAPI.setNextResults([lbbCompany, irrelevantLbbCompany]);

      // Act
      const unauthenticatedResponse = await searchImmersion.execute({
        ...searchSecretariatInMetzParams,
        nafDivision: "78",
      });

      // Assert
      expect(unauthenticatedResponse).toHaveLength(2);
      expectSearchResponseToMatch(unauthenticatedResponse, [
        {
          id: immersionOfferId,
          rome: "M1607",
          naf: "78201",
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
    });
  });

  describe("Eventually requests LBB and adds offers and partial establishments in repositories", () => {
    describe("LBB has not been requested for this rome code", () => {
      const searchImmersionDto: SearchImmersionRequestDto = {
        rome: "M1607",
        location: { lon: 10, lat: 9 },
        distance_km: 30,
      };

      const nextDate = new Date("2022-01-01");

      test("Should add the request entity to the repository", async () => {
        // Prepare
        const {
          searchImmersion,
          laBonneBoiteRequestRepository,
          laBonneBoiteAPI,
          clock,
        } = await prepareSearchableData();

        clock.setNextDate(nextDate);
        laBonneBoiteAPI.setNextResults([]);

        // Act
        await searchImmersion.execute(searchImmersionDto);

        // Assert
        expect(laBonneBoiteRequestRepository.laBonneBoiteRequests).toHaveLength(
          1,
        );

        const expectedRequestEntity: LaBonneBoiteRequestEntity = {
          params: {
            rome: searchImmersionDto.rome,
            lon: searchImmersionDto.location.lon,
            lat: searchImmersionDto.location.lat,
            distance_km: 50, // LBB_DISTANCE_KM_REQUEST_PARAM
          },
          result: {
            error: null,
            number0fEstablishments: 0,
            numberOfRelevantEstablishments: 0,
          },
          requestedAt: nextDate,
        };

        expect(laBonneBoiteRequestRepository.laBonneBoiteRequests[0]).toEqual(
          expectedRequestEntity,
        );
      });
      test("Should insert as many 'relevant' establishment and offers in repositories as LBB responded", async () => {
        // Prepare
        const { searchImmersion, laBonneBoiteAPI, immersionOfferRepository } =
          await prepareSearchableData();
        immersionOfferRepository.establishmentAggregates = [];

        const ignoredNafRomeCombination = {
          matched_rome_code: "D1202",
          naf: "8411",
        };
        laBonneBoiteAPI.setNextResults([
          new LaBonneBoiteCompanyVO({
            matched_rome_code: "AAAAA",
            naf: "",
          } as LaBonneBoiteCompanyProps),
          new LaBonneBoiteCompanyVO({
            matched_rome_code: "BBBBB",
            naf: "",
          } as LaBonneBoiteCompanyProps),
          new LaBonneBoiteCompanyVO(
            ignoredNafRomeCombination as LaBonneBoiteCompanyProps,
          ),
        ]);

        // Act
        await searchImmersion.execute(searchImmersionDto);

        // Assert
        expect(immersionOfferRepository.establishmentAggregates).toHaveLength(
          2,
        );
      });
    }),
      describe("LBB has been requested for this rome code and this geographic area", () => {
        const userSearchedRome = "M1234";
        const userSearchedLocationInParis17 = {
          lat: 48.862725, // 7 rue guillaume Tell, 75017 Paris
          lon: 2.287592,
        };
        const previouslySearchedLocationInParis10 = {
          lat: 48.8841446, // 169 Bd de la Villette, 75010 Paris
          lon: 2.3651789,
        };

        const previousSimilarRequestEntity = {
          params: {
            rome: userSearchedRome,
            lat: previouslySearchedLocationInParis10.lat,
            lon: previouslySearchedLocationInParis10.lon,
            distance_km: 50,
          },
          requestedAt: new Date("2021-01-01"),
        } as LaBonneBoiteRequestEntity;

        test("Should not request LBB if the request has been made in the last 7 days", async () => {
          // Prepare
          const { searchImmersion, laBonneBoiteRequestRepository, clock } =
            await prepareSearchableData();

          laBonneBoiteRequestRepository.laBonneBoiteRequests = [
            previousSimilarRequestEntity,
          ];
          clock.setNextDate(new Date("2021-01-08"));

          // Act
          await searchImmersion.execute({
            rome: userSearchedRome,
            location: userSearchedLocationInParis17,
            distance_km: 10,
          });

          // Assert
          expect(
            laBonneBoiteRequestRepository.laBonneBoiteRequests,
          ).toHaveLength(1);
        });

        test("Should request LBB if the request was made more than 7 days ago", async () => {
          // Prepare
          const { searchImmersion, laBonneBoiteRequestRepository, clock } =
            await prepareSearchableData();

          laBonneBoiteRequestRepository.laBonneBoiteRequests = [
            previousSimilarRequestEntity,
          ];
          clock.setNextDate(new Date("2021-01-09"));

          // Act
          await searchImmersion.execute({
            rome: userSearchedRome,
            location: userSearchedLocationInParis17,
            distance_km: 10,
          });

          // Assert
          expect(
            laBonneBoiteRequestRepository.laBonneBoiteRequests,
          ).toHaveLength(2);
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
