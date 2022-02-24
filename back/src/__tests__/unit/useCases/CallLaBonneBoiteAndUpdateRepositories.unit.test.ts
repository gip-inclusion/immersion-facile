import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersionOfferRepository";
import { InMemoryLaBonneBoiteAPI } from "../../../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemoryLaBonneBoiteRequestRepository } from "../../../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteRequestRepository";
import { LaBonneBoiteRequestEntity } from "../../../domain/immersionOffer/entities/LaBonneBoiteRequestEntity";
import { CallLaBonneBoiteAndUpdateRepositories } from "../../../domain/immersionOffer/useCases/CallLaBonneBoiteAndUpdateRepositories";
import {
  LaBonneBoiteCompanyProps,
  LaBonneBoiteCompanyVO,
} from "../../../domain/immersionOffer/valueObjects/LaBonneBoiteCompanyVO";
import { SearchImmersionRequestDto } from "../../../shared/SearchImmersionDto";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { LaBonneBoiteCompanyBuilder } from "../../../_testBuilders/LaBonneBoiteResponseBuilder";

const prepareUseCase = async () => {
  const immersionOfferRepository = new InMemoryImmersionOfferRepository();
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

  const useCase = new CallLaBonneBoiteAndUpdateRepositories(
    immersionOfferRepository,
    laBonneBoiteRequestRepository,
    laBonneBoiteAPI,
    uuidGenerator,
    clock,
  );

  return {
    useCase,
    immersionOfferRepository,
    laBonneBoiteRequestRepository,
    laBonneBoiteAPI,
    uuidGenerator,
    clock,
  };
};

describe("Eventually requests LBB and adds offers and partial establishments in repositories", () => {
  it("Should not request LBB if no rome code is provided", async () => {
    // Prepare
    const { useCase, laBonneBoiteRequestRepository, laBonneBoiteAPI } =
      await prepareUseCase();

    // Act
    await useCase.execute({
      rome: undefined,
      location: { lon: 10, lat: 10 },
      distance_km: 10,
    });

    // Assert
    expect(laBonneBoiteAPI.nbOfCalls).toEqual(0);
    expect(laBonneBoiteRequestRepository.laBonneBoiteRequests).toHaveLength(0);
  });

  describe("LBB has not been requested for this rome code", () => {
    const dto: SearchImmersionRequestDto = {
      rome: "M1607",
      location: { lon: 10, lat: 9 },
      distance_km: 30,
    };

    const nextDate = new Date("2022-01-01");

    it("Should add the request entity to the repository", async () => {
      // Prepare
      const { useCase, laBonneBoiteRequestRepository, laBonneBoiteAPI, clock } =
        await prepareUseCase();

      clock.setNextDate(nextDate);
      laBonneBoiteAPI.setNextResults([]);

      // Act
      await useCase.execute(dto);

      // Assert
      expect(laBonneBoiteRequestRepository.laBonneBoiteRequests).toHaveLength(
        1,
      );

      const expectedRequestEntity: LaBonneBoiteRequestEntity = {
        params: {
          rome: dto.rome!,
          ...dto.location,
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
    it("Should insert as many 'relevant' establishments and offers in repositories as LBB responded with undefined field `updatedAt`", async () => {
      // Prepare
      const { useCase, laBonneBoiteAPI, immersionOfferRepository } =
        await prepareUseCase();
      immersionOfferRepository.establishmentAggregates = [];

      const ignoredNafRomeCombination = {
        matched_rome_code: "D1202",
        naf: "8411",
      };
      laBonneBoiteAPI.setNextResults([
        new LaBonneBoiteCompanyVO({
          matched_rome_code: "A1101",
          naf: "8500A",
        } as LaBonneBoiteCompanyProps),
        new LaBonneBoiteCompanyVO({
          matched_rome_code: "A1201",
          naf: "8500B",
        } as LaBonneBoiteCompanyProps),
        new LaBonneBoiteCompanyVO(
          ignoredNafRomeCombination as LaBonneBoiteCompanyProps,
        ),
      ]);

      // Act
      await useCase.execute(dto);

      // Assert
      expect(immersionOfferRepository.establishmentAggregates).toHaveLength(2);
      expect(
        immersionOfferRepository.establishmentAggregates[0].establishment
          .updatedAt,
      ).not.toBeDefined();
    });
    it("Should ignore establishments that have been inserted with `form` dataSource", async () => {
      const conflictSiret = "12345678901234";
      // Prepare : an establishment already inserted from form
      const { useCase, laBonneBoiteAPI, immersionOfferRepository } =
        await prepareUseCase();
      const alreadyExistingAggregateFromForm =
        new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityV2Builder()
              .withSiret(conflictSiret)
              .withDataSource("form")
              .build(),
          )
          .build();

      immersionOfferRepository.establishmentAggregates = [
        alreadyExistingAggregateFromForm,
      ];

      laBonneBoiteAPI.setNextResults([
        new LaBonneBoiteCompanyBuilder().withSiret(conflictSiret).build(),
      ]);

      // Act : this establishment is referenced in LBB
      await useCase.execute(dto);

      // Assert : Should have skiped this establishment
      expect(immersionOfferRepository.establishmentAggregates).toEqual([
        alreadyExistingAggregateFromForm,
      ]);
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

      it("Should not request LBB if the request has been made in the last month", async () => {
        // Prepare
        const {
          useCase,
          laBonneBoiteRequestRepository,
          laBonneBoiteAPI,
          clock,
        } = await prepareUseCase();

        laBonneBoiteRequestRepository.laBonneBoiteRequests = [
          previousSimilarRequestEntity,
        ];
        clock.setNextDate(new Date("2021-01-30"));

        // Act
        await useCase.execute({
          rome: userSearchedRome,
          location: userSearchedLocationInParis17,
          distance_km: 10,
        });

        // Assert
        expect(laBonneBoiteAPI.nbOfCalls).toEqual(0);
        expect(laBonneBoiteRequestRepository.laBonneBoiteRequests).toHaveLength(
          1,
        );
      });

      it("Should request LBB if the request was made more than a month ago", async () => {
        // Prepare
        const { useCase, laBonneBoiteRequestRepository, clock } =
          await prepareUseCase();

        laBonneBoiteRequestRepository.laBonneBoiteRequests = [
          previousSimilarRequestEntity,
        ];
        clock.setNextDate(new Date("2021-02-01"));

        // Act
        await useCase.execute({
          rome: userSearchedRome,
          location: userSearchedLocationInParis17,
          distance_km: 10,
        });

        // Assert
        expect(laBonneBoiteRequestRepository.laBonneBoiteRequests).toHaveLength(
          2,
        );
      });
    });
});
