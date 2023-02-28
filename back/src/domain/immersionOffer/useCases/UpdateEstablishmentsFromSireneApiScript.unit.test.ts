import { AddressDto, pathEq } from "shared";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { SireneEstablishmentVOBuilder } from "../../../_testBuilders/SireneEstablishmentVOBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryAddressGateway } from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";
import { UpdateEstablishmentsFromSireneApiScript } from "./UpdateEstablishmentsFromSireneApiScript";
import { InMemorySireneGateway } from "../../../adapters/secondary/sirene/InMemorySireneGateway";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";

const prepareUseCase = () => {
  const sireneRepo = new InMemorySireneGateway();
  const uow = createInMemoryUow();
  const establishmentAggregateRepository = uow.establishmentAggregateRepository;
  const timeGateway = new CustomTimeGateway();
  const addressAPI = new InMemoryAddressGateway();
  const useCase = new UpdateEstablishmentsFromSireneApiScript(
    establishmentAggregateRepository,
    sireneRepo,
    addressAPI,
    timeGateway,
  );

  return {
    sireneRepo,
    establishmentAggregateRepository,
    addressAPI,
    timeGateway,
    useCase,
  };
};

const makeEstablishmentWithUpdatedAt = (siret: string, updatedAt: Date) =>
  new EstablishmentAggregateBuilder()
    .withEstablishment(
      new EstablishmentEntityBuilder()
        .withSiret(siret)
        .withUpdatedAt(updatedAt)
        .build(),
    )
    .build();

const findEstablishmentEntityGivenSiret = (
  establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository,
  siret: string,
): EstablishmentEntity | undefined =>
  establishmentAggregateRepository.establishmentAggregates.find(
    pathEq("establishment.siret", siret),
  )?.establishment;

describe("Update establishments from Sirene API", () => {
  const now = new Date("2020-01-13T00:00:00");
  const lessThanAWeekAgo = new Date("2020-01-07T00:00:00");
  const moreThanAWeekAgo = new Date("2020-01-06T00:00:00");

  it("Should update modification date of establishments that have not been modified since one week", async () => {
    const {
      timeGateway,
      sireneRepo,
      establishmentAggregateRepository,
      useCase,
    } = prepareUseCase();
    // Prepare
    establishmentAggregateRepository.establishmentAggregates = [
      makeEstablishmentWithUpdatedAt("oldSiret", moreThanAWeekAgo),
      makeEstablishmentWithUpdatedAt("recentSiret", lessThanAWeekAgo),
    ];
    sireneRepo.setEstablishment(
      new SireneEstablishmentVOBuilder().withSiret("recentSiret").build(),
    );
    timeGateway.setNextDate(now);

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
    const { timeGateway, establishmentAggregateRepository, useCase } =
      prepareUseCase();
    establishmentAggregateRepository.establishmentAggregates = [
      makeEstablishmentWithUpdatedAt(
        "closedEstablishmentSiret", // This siret is not referenced in sireneRepo
        moreThanAWeekAgo,
      ),
    ];
    timeGateway.setNextDate(now);

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
    const {
      timeGateway,
      sireneRepo,
      establishmentAggregateRepository,
      useCase,
    } = prepareUseCase();
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

    timeGateway.setNextDate(now);

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
    it("When address API succeeds, it should update address and coordinates", async () => {
      // Prepare
      const {
        timeGateway,
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
            numeroVoieEtablissement: "25",
            typeVoieEtablissement: "rue",
            libelleVoieEtablissement: "du Premier Film",
            codePostalEtablissement: "69008",
            libelleCommuneEtablissement: "Lyon",
          })
          .build(),
      );
      const newEstablishmentPosition = { lon: 2.2931917, lat: 48.8840654 };

      const newAddressFromSirenApi: AddressDto = {
        streetNumberAndAddress: "25 Rue du Premier Film",
        city: "Lyon",
        departmentCode: "69",
        postcode: "69008",
      };

      addressAPI.setAddressAndPosition([
        {
          address: newAddressFromSirenApi,
          position: newEstablishmentPosition,
        },
      ]);

      timeGateway.setNextDate(now);

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
          address: newAddressFromSirenApi,
          position: newEstablishmentPosition,
        },
      );
    });

    it("When api succeeds but establishment as already been updated and new address is in the same city, it should not update", async () => {
      // Prepare
      const {
        timeGateway,
        sireneRepo,
        establishmentAggregateRepository,
        addressAPI,
        useCase,
      } = prepareUseCase();
      const initialEstablishmentAggregate = makeEstablishmentWithUpdatedAt(
        "establishmentToUpdate",
        moreThanAWeekAgo,
      );
      establishmentAggregateRepository.establishmentAggregates = [
        initialEstablishmentAggregate,
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

      const newAddressFromSirenApi: AddressDto = {
        streetNumberAndAddress: "7 RUE GUILLAUME TELL",
        city: "PARIS",
        departmentCode: "75",
        postcode: "75017",
      };

      addressAPI.setAddressAndPosition([
        {
          address: newAddressFromSirenApi,
          position: newEstablishmentPosition,
        },
      ]);

      timeGateway.setNextDate(now);

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
          address: initialEstablishmentAggregate.establishment.address,
          position: initialEstablishmentAggregate.establishment.position,
        },
      );
    });

    it("If adresse API fails, it should not change the address and position", async () => {
      // Prepare
      const {
        timeGateway,
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
      timeGateway.setNextDate(now);

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
  actualEstablishment: undefined | EstablishmentEntity,
  expected: Partial<EstablishmentEntity>,
) => expect(actualEstablishment).toMatchObject(expected);
