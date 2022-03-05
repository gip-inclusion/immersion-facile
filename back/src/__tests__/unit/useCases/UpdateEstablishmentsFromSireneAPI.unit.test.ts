import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryAdresseAPI } from "../../../adapters/secondary/immersionOffer/InMemoryAdresseAPI";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { EstablishmentEntityV2 } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { UpdateEstablishmentsFromSireneAPI } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsFromSireneAPI";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { SireneEstablishmentVOBuilder } from "../../../_testBuilders/SireneEstablishmentBuilder";
import { pathEq } from "../../../shared/ramdaExtensions/path";

const prepareUseCase = () => {
  const sireneRepo = new InMemorySireneRepository();
  const immersionRepo = new InMemoryImmersionOfferRepository();
  const clock = new CustomClock();
  const adresseAPI = new InMemoryAdresseAPI();
  const useCase = new UpdateEstablishmentsFromSireneAPI(
    sireneRepo,
    immersionRepo,
    adresseAPI,
    clock,
  );

  return { sireneRepo, immersionRepo, adresseAPI, clock, useCase };
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
  immersionRepo: InMemoryImmersionOfferRepository,
  siret: string,
): EstablishmentEntityV2 | undefined =>
  immersionRepo.establishmentAggregates.find(
    pathEq("establishment.siret", siret),
  )?.establishment;

describe("Update establishments from Sirene API", () => {
  const now = new Date("2020-01-13T00:00:00");
  const lessThanAWeekAgo = new Date("2020-01-07T00:00:00");
  const moreThanAWeekAgo = new Date("2020-01-06T00:00:00");

  test("Should update modification date of establishments that have not been modified since one week", async () => {
    const { clock, sireneRepo, immersionRepo, useCase } = prepareUseCase();
    // Prepare
    immersionRepo.establishmentAggregates = [
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
      findEstablishmentEntityGivenSiret(immersionRepo, "oldSiret")?.updatedAt,
    ).toEqual(now);
    expect(
      findEstablishmentEntityGivenSiret(immersionRepo, "recentSiret")
        ?.updatedAt,
    ).toEqual(lessThanAWeekAgo);
  });

  test("Should close establishments that are not longer referenced in Sirene API", async () => {
    // Prepare
    const { clock, immersionRepo, useCase } = prepareUseCase();
    immersionRepo.establishmentAggregates = [
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
        immersionRepo,
        "closedEstablishmentSiret",
      ),
      { isActive: false, updatedAt: now },
    );
  });
  test("Should update naf code and number of employee range of establishment based on Sirene answer", async () => {
    // Prepare
    const { clock, sireneRepo, immersionRepo, useCase } = prepareUseCase();
    immersionRepo.establishmentAggregates = [
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
      findEstablishmentEntityGivenSiret(immersionRepo, "establishmentToUpdate"),
      {
        updatedAt: now,
        nafDto: { code: "8559A", nomenclature: "nafNom" },
        numberEmployeesRange: 1,
      },
    );
  });

  describe("Should update establishment address and position based on sirene and address API", () => {
    test("If adresse API succeeds, it should update adresse and coordinates ", async () => {
      // Prepare
      const { clock, sireneRepo, immersionRepo, adresseAPI, useCase } =
        prepareUseCase();
      immersionRepo.establishmentAggregates = [
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
      adresseAPI.setNextPosition(newEstablishmentPosition);
      clock.setNextDate(now);

      // Act
      await useCase.execute();

      // Assert
      expectEstablishmentToMatch(
        findEstablishmentEntityGivenSiret(
          immersionRepo,
          "establishmentToUpdate",
        ),
        {
          updatedAt: now,
          address: "7 rue Guillaume Tell 75017 Paris",
          position: newEstablishmentPosition,
        },
      );
    });
    test("If adresse API fails, it should not change the address and position", async () => {
      // Prepare
      const { clock, sireneRepo, immersionRepo, adresseAPI, useCase } =
        prepareUseCase();
      const establishmentToUpdate = makeEstablishmentWithUpdatedAt(
        "establishmentToUpdate",
        moreThanAWeekAgo,
      );
      immersionRepo.establishmentAggregates = [establishmentToUpdate];
      sireneRepo.setEstablishment(
        new SireneEstablishmentVOBuilder()
          .withSiret("establishmentToUpdate")
          .withAdresseEtablissement({ libelleVoieEtablissement: "" })
          .build(),
      );
      adresseAPI.setNextPosition(undefined);
      clock.setNextDate(now);

      // Act
      await useCase.execute();

      // Assert
      expectEstablishmentToMatch(
        findEstablishmentEntityGivenSiret(
          immersionRepo,
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
