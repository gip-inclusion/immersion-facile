import { AddressDto, pathEq } from "shared";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { SirenEstablishmentDtoBuilder } from "../../../_testBuilders/SirenEstablishmentDtoBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryAddressGateway } from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemorySiretGateway } from "../../../adapters/secondary/siret/InMemorySiretGateway";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";
import { UpdateEstablishmentsFromSirenApiScript } from "./UpdateEstablishmentsFromSirenApiScript";

const prepareUseCase = () => {
  const siretGateway = new InMemorySiretGateway();
  const uow = createInMemoryUow();
  const establishmentAggregateRepository = uow.establishmentAggregateRepository;
  const timeGateway = new CustomTimeGateway();
  const addressAPI = new InMemoryAddressGateway();
  const useCase = new UpdateEstablishmentsFromSirenApiScript(
    establishmentAggregateRepository,
    siretGateway,
    addressAPI,
    timeGateway,
  );

  return {
    siretGateway,
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

// This use case is kept as inspiration for when we'll need to update establishments from SIREN API (ours not LBB)
describe.skip("Update establishments from Sirene API", () => {
  const now = new Date("2020-01-13T00:00:00");
  const lessThanAWeekAgo = new Date("2020-01-07T00:00:00");
  const moreThanAWeekAgo = new Date("2020-01-06T00:00:00");

  it("Should update modification date of establishments that have not been modified since one week", async () => {
    const {
      timeGateway,
      siretGateway,
      establishmentAggregateRepository,
      useCase,
    } = prepareUseCase();
    // Prepare
    establishmentAggregateRepository.establishmentAggregates = [
      makeEstablishmentWithUpdatedAt("oldSiret", moreThanAWeekAgo),
      makeEstablishmentWithUpdatedAt("recentSiret", lessThanAWeekAgo),
    ];
    siretGateway.setSirenEstablishment(
      new SirenEstablishmentDtoBuilder().withSiret("recentSiret").build(),
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
        "closedEstablishmentSiret", // This siret is not referenced in siretGateway
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
      siretGateway,
      establishmentAggregateRepository,
      useCase,
    } = prepareUseCase();
    establishmentAggregateRepository.establishmentAggregates = [
      makeEstablishmentWithUpdatedAt("establishmentToUpdate", moreThanAWeekAgo),
    ];
    siretGateway.setSirenEstablishment(
      new SirenEstablishmentDtoBuilder()
        .withSiret("establishmentToUpdate")
        .withNafDto({ code: "8559A", nomenclature: "nafNom" })
        .withNumberEmployeesRange("1-2")
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
        siretGateway,
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
      siretGateway.setSirenEstablishment(
        new SirenEstablishmentDtoBuilder()
          .withSiret("establishmentToUpdate")
          .withBusinessAddress("25 rue du Premier Film 69008 Lyon")
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
        siretGateway,
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
      siretGateway.setSirenEstablishment(
        new SirenEstablishmentDtoBuilder()
          .withSiret("establishmentToUpdate")
          .withBusinessAddress("7 rue Guillaume Tell 75017 Paris")
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
        siretGateway,
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
      siretGateway.setSirenEstablishment(
        new SirenEstablishmentDtoBuilder()
          .withSiret("establishmentToUpdate")
          .withBusinessAddress("75007 PARIS")
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
