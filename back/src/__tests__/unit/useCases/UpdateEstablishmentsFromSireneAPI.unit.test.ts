import { pathEq } from "shared/src/ramdaExtensions/path";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryAddressGateway } from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemorySireneGateway } from "../../../adapters/secondary/InMemorySireneGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { EstablishmentEntityV2 } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { UpdateEstablishmentsFromSireneAPI } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsFromSireneAPI";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { SireneEstablishmentVOBuilder } from "../../../_testBuilders/SireneEstablishmentVOBuilder";

const prepareUseCase = () => {
  const sireneRepo = new InMemorySireneGateway();
  const uow = createInMemoryUow();
  const establishmentAggregateRepository = uow.establishmentAggregateRepository;
  const clock = new CustomClock();
  const addressAPI = new InMemoryAddressGateway();
  const useCase = new UpdateEstablishmentsFromSireneAPI(
    new InMemoryUowPerformer(uow),
    sireneRepo,
    addressAPI,
    clock,
  );

  return {
    sireneRepo,
    establishmentAggregateRepository,
    addressAPI,
    clock,
    useCase,
  };
};

const makeEstablishmentWithUpdatedAt = (siret: string, updatedAt: Date) =>
  new EstablishmentAggregateBuilder()
    .withEstablishment(
      new EstablishmentEntityV2Builder()
        .withSiret(siret)
        .withUpdatedAt(updatedAt)
        .build(),
    )
    .build();

const findEstablishmentEntityGivenSiret = (
  establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository,
  siret: string,
): EstablishmentEntityV2 | undefined =>
  establishmentAggregateRepository.establishmentAggregates.find(
    pathEq("establishment.siret", siret),
  )?.establishment;

describe("Update establishments from Sirene API", () => {
  const now = new Date("2020-01-13T00:00:00");
  const lessThanAWeekAgo = new Date("2020-01-07T00:00:00");
  const moreThanAWeekAgo = new Date("2020-01-06T00:00:00");

  it("Should update modification date of establishments that have not been modified since one week", async () => {
    const { clock, sireneRepo, establishmentAggregateRepository, useCase } =
      prepareUseCase();
    // Prepare
    establishmentAggregateRepository.establishmentAggregates = [
      makeEstablishmentWithUpdatedAt("oldSiret", moreThanAWeekAgo),
      makeEstablishmentWithUpdatedAt("recentSiret", lessThanAWeekAgo),
    ];
    sireneRepo.setEstablishment(
      new SireneEstablishmentVOBuilder().withSiret("recentSiret").build(),
    );
    clock.setNextDate(now);

    // Act
    await useCase.execute();

    // Assert old establishments only have been updated
    expect(
      findEstablishmentEntityGivenSiret(
        establishmentAggregateRepository,
        "oldSiret",
      )?.updatedAt,
    ).toEqual(now);
    expect(
      findEstablishmentEntityGivenSiret(
        establishmentAggregateRepository,
        "recentSiret",
      )?.updatedAt,
    ).toEqual(lessThanAWeekAgo);
  });

  it("Should close establishments that are not longer referenced in Sirene API", async () => {
    // Prepare
    const { clock, establishmentAggregateRepository, useCase } =
      prepareUseCase();
    establishmentAggregateRepository.establishmentAggregates = [
      makeEstablishmentWithUpdatedAt(
        "closedEstablishmentSiret", // This siret is not referenced in sireneRepo
        moreThanAWeekAgo,
      ),
    ];
    clock.setNextDate(now);

    // Act
    await useCase.execute();

    // Assert
    expectEstablishmentToMatch(
      findEstablishmentEntityGivenSiret(
        establishmentAggregateRepository,
        "closedEstablishmentSiret",
      ),
      { isActive: false, updatedAt: now },
    );
  });
  it("Should update naf code and number of employee range of establishment based on Sirene answer", async () => {
    // Prepare
    const { clock, sireneRepo, establishmentAggregateRepository, useCase } =
      prepareUseCase();
    establishmentAggregateRepository.establishmentAggregates = [
      makeEstablishmentWithUpdatedAt("establishmentToUpdate", moreThanAWeekAgo),
    ];
    sireneRepo.setEstablishment(
      new SireneEstablishmentVOBuilder()
        .withSiret("establishmentToUpdate")
        .withUniteLegale({
          activitePrincipaleUniteLegale: "85.59A",
          trancheEffectifsUniteLegale: "01",
          nomenclatureActivitePrincipaleUniteLegale: "nafNom",
        })
        .build(),
    );

    clock.setNextDate(now);

    // Act
    await useCase.execute();

    // Assert
    expectEstablishmentToMatch(
      findEstablishmentEntityGivenSiret(
        establishmentAggregateRepository,
        "establishmentToUpdate",
      ),
      {
        updatedAt: now,
        nafDto: { code: "8559A", nomenclature: "nafNom" },
        numberEmployeesRange: "1-2",
      },
    );
  });

  describe("Should update establishment address and position based on sirene and address API", () => {
    /* eslint-disable-next-line  jest/no-disabled-tests */
    it.skip("If address API succeeds, it should update address and coordinates", async () => {
      // Prepare
      const {
        clock,
        sireneRepo,
        establishmentAggregateRepository,
        addressAPI,
        useCase,
      } = prepareUseCase();
      establishmentAggregateRepository.establishmentAggregates = [
        makeEstablishmentWithUpdatedAt(
          "establishmentToUpdate",
          moreThanAWeekAgo,
        ),
      ];
      sireneRepo.setEstablishment(
        new SireneEstablishmentVOBuilder()
          .withSiret("establishmentToUpdate")
          .withAdresseEtablissement({
            numeroVoieEtablissement: "7",
            typeVoieEtablissement: "rue",
            libelleVoieEtablissement: "Guillaume Tell",
            codePostalEtablissement: "75017",
            libelleCommuneEtablissement: "Paris",
          })
          .build(),
      );
      const newEstablishmentPosition = { lon: 2.2931917, lat: 48.8840654 };
      addressAPI.setNextPosition(newEstablishmentPosition);
      addressAPI.setNextAddress({
        streetNumberAndAddress: "7 RUE GUILLAUME TELL",
        city: "PARIS",
        departmentCode: "75",
        postcode: "75017",
      });
      clock.setNextDate(now);

      // Act
      await useCase.execute();

      // Assert
      expectEstablishmentToMatch(
        findEstablishmentEntityGivenSiret(
          establishmentAggregateRepository,
          "establishmentToUpdate",
        ),
        {
          updatedAt: now,
          address: {
            streetNumberAndAddress: "7 RUE GUILLAUME TELL",
            city: "PARIS",
            departmentCode: "75",
            postcode: "75017",
          },
          position: newEstablishmentPosition,
        },
      );
    });
    it("If adresse API fails, it should not change the address and position", async () => {
      // Prepare
      const {
        clock,
        sireneRepo,
        establishmentAggregateRepository,
        addressAPI,
        useCase,
      } = prepareUseCase();
      const establishmentToUpdate = makeEstablishmentWithUpdatedAt(
        "establishmentToUpdate",
        moreThanAWeekAgo,
      );
      establishmentAggregateRepository.establishmentAggregates = [
        establishmentToUpdate,
      ];
      sireneRepo.setEstablishment(
        new SireneEstablishmentVOBuilder()
          .withSiret("establishmentToUpdate")
          .withAdresseEtablissement({ libelleVoieEtablissement: "" })
          .build(),
      );
      addressAPI.setNextPosition(undefined);
      clock.setNextDate(now);

      // Act
      await useCase.execute();

      // Assert
      expectEstablishmentToMatch(
        findEstablishmentEntityGivenSiret(
          establishmentAggregateRepository,
          "establishmentToUpdate",
        ),
        {
          updatedAt: now, // still, updated !
          address: establishmentToUpdate.establishment.address, // unchanged
          position: establishmentToUpdate.establishment.position, // unchanged
        },
      );
    });
  });
});

const expectEstablishmentToMatch = (
  actualEstablishment: undefined | EstablishmentEntityV2,
  expected: Partial<EstablishmentEntityV2>,
) => expect(actualEstablishment).toMatchObject(expected);
