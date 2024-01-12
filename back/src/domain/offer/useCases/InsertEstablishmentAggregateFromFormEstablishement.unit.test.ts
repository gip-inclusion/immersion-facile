import {
  AppellationAndRomeDto,
  expectToEqual,
  FormEstablishmentDtoBuilder,
  GeoPositionDto,
  NafDto,
  NumberEmployeesRange,
  SiretEstablishmentDto,
} from "shared";
import {
  avenueChampsElyseesDto,
  rueGuillaumeTellDto,
} from "../../../_testBuilders/addressDtos";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { OfferEntityBuilder } from "../../../_testBuilders/OfferEntityBuilder";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { InMemoryAddressGateway } from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  InMemorySiretGateway,
  TEST_OPEN_ESTABLISHMENT_1,
} from "../../../adapters/secondary/siret/InMemorySiretGateway";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";
import { InsertEstablishmentAggregateFromForm } from "./InsertEstablishmentAggregateFromFormEstablishement";

const fakeSiret = "90040893100013";
const fakePosition: GeoPositionDto = { lat: 49.119146, lon: 6.17602 };
const fakeAddress = avenueChampsElyseesDto;
const fakeBusinessContact = new ContactEntityBuilder().build();
const expectedNafDto: NafDto = { code: "8559A", nomenclature: "nomencl" };
const numberEmployeesRanges: NumberEmployeesRange = "6-9";

const prepareSirenGateway = (
  siretGateway: InMemorySiretGateway,
  siret: string,
  numberEmployeesRange: NumberEmployeesRange = "",
) => {
  const siretEstablishmentFromAPI: SiretEstablishmentDto = {
    ...TEST_OPEN_ESTABLISHMENT_1,
    siret,
    nafDto: {
      code: "8559A",
      nomenclature: "nomencl",
    },
    numberEmployeesRange,
  };

  siretGateway.setSirenEstablishment(siretEstablishmentFromAPI);
};

describe("Insert Establishment aggregate from form data", () => {
  let siretGateway: InMemorySiretGateway;
  let addressAPI: InMemoryAddressGateway;
  let uuidGenerator: TestUuidGenerator;
  let timeGateway: CustomTimeGateway;
  let uow: InMemoryUnitOfWork;
  let useCase: InsertEstablishmentAggregateFromForm;

  beforeEach(() => {
    siretGateway = new InMemorySiretGateway();
    addressAPI = new InMemoryAddressGateway();
    uuidGenerator = new TestUuidGenerator();
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();

    useCase = new InsertEstablishmentAggregateFromForm(
      new InMemoryUowPerformer(uow),
      siretGateway,
      addressAPI,
      uuidGenerator,
      timeGateway,
      makeCreateNewEvent({ timeGateway, uuidGenerator }),
    );

    uuidGenerator.setNextUuid(fakeBusinessContact.id);
    addressAPI.setAddressAndPosition([
      {
        address: fakeAddress,
        position: fakePosition,
      },
    ]);
  });

  it("Converts Form Establishment in search format", async () => {
    // Prepare
    const professions: AppellationAndRomeDto[] = [
      {
        romeCode: "A1101",
        appellationCode: "11717",
        romeLabel: "métier A",
        appellationLabel: "métier A.1",
      },
      {
        romeCode: "A1102",
        appellationCode: "11717",
        romeLabel: "métier B",
        appellationLabel: "métier B.1",
      },
    ];
    const nextAvailabilityDate = new Date();
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withFitForDisabledWorkers(true)
      .withSiret(fakeSiret)
      .withAppellations(professions)
      .withBusinessContact(fakeBusinessContact)
      .withNextAvailabilityDate(nextAvailabilityDate)
      .build();

    prepareSirenGateway(siretGateway, fakeSiret, numberEmployeesRanges);

    // Act
    await useCase.execute({ formEstablishment });

    // Assert
    expectToEqual(
      uow.establishmentAggregateRepository.establishmentAggregates,
      [
        new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withSiret(formEstablishment.siret)
              .withCustomizedName(formEstablishment.businessNameCustomized)
              .withNafDto(expectedNafDto)
              .withCreatedAt(timeGateway.now())
              .withUpdatedAt(timeGateway.now())
              .withIsCommited(false)
              .withName(formEstablishment.businessName)
              .withNumberOfEmployeeRange(numberEmployeesRanges)
              .withPosition(fakePosition)
              .withWebsite(formEstablishment.website)
              .withNextAvailabilityDate(nextAvailabilityDate)
              .build(),
          )
          .withFitForDisabledWorkers(true)
          .withOffers(
            professions.map((prof) =>
              new OfferEntityBuilder({
                ...prof,
                createdAt: timeGateway.now(),
                score: 10,
              }).build(),
            ),
          )
          .withContact(fakeBusinessContact)
          .build(),
      ],
    );
  });

  it("Correctly converts establishment with a 'tranche d'effectif salarié' of 00", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(fakeSiret)
      .build();

    prepareSirenGateway(siretGateway, fakeSiret, "0");

    await useCase.execute({ formEstablishment });

    const establishmentAggregate =
      uow.establishmentAggregateRepository.establishmentAggregates[0];
    expect(establishmentAggregate).toBeDefined();
    expect(establishmentAggregate.establishment.siret).toEqual(
      formEstablishment.siret,
    );
    expect(establishmentAggregate.establishment.numberEmployeesRange).toBe("0");
  });

  it("Removes (and replaces) establishment and offers with same siret if exists", async () => {
    const siret = "12345678911234";
    // Prepare : insert an establishment aggregate from LBB with siret
    const previousContact = new ContactEntityBuilder()
      .withEmail("previous.contact@gmail.com")
      .build();
    const previousEstablishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .withName("Previous name")
      .build();

    const previousAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(previousEstablishment)
      .withOffers([
        new OfferEntityBuilder().build(),
        new OfferEntityBuilder().build(),
      ])
      .withContact(previousContact)
      .build();

    uow.establishmentAggregateRepository.establishmentAggregates = [
      previousAggregate,
    ];

    const newRomeCode = "A1101";
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(siret)
      .withAppellations([
        {
          romeLabel: "Boulangerie",
          appellationLabel: "Boulanger",
          romeCode: newRomeCode,
          appellationCode: "22222",
        },
      ])
      .withBusinessContact(
        new ContactEntityBuilder().withEmail("new.contact@gmail.com").build(),
      )
      .build();

    const numberEmployeesRanges: NumberEmployeesRange = "6-9";

    prepareSirenGateway(siretGateway, siret, numberEmployeesRanges);

    addressAPI.setAddressAndPosition([
      {
        address: rueGuillaumeTellDto,
        position: { lat: 1, lon: 1 },
      },
    ]);

    // Act : execute use-case with same siret
    await useCase.execute({ formEstablishment });

    // Assert
    // One aggregate only
    expect(
      uow.establishmentAggregateRepository.establishmentAggregates,
    ).toHaveLength(1);

    // Establishment matches update from form
    const partialExpectedEstablishment: Partial<EstablishmentEntity> = {
      siret,
      address: rueGuillaumeTellDto,
      isOpen: true,
      name: formEstablishment.businessName,
    };
    expect(
      uow.establishmentAggregateRepository.establishmentAggregates[0]
        .establishment,
    ).toMatchObject(partialExpectedEstablishment);

    // Offers match update from form
    expect(
      uow.establishmentAggregateRepository.establishmentAggregates[0].offers,
    ).toHaveLength(1);
    expect(
      uow.establishmentAggregateRepository.establishmentAggregates[0].offers[0]
        .romeCode,
    ).toEqual(newRomeCode);

    // Contact match update from form
    expect(
      uow.establishmentAggregateRepository.establishmentAggregates[0].contact
        ?.email,
    ).toBe("new.contact@gmail.com");
  });

  it("Publishes an event with the new establishment aggregate as payload", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(fakeSiret)
      .build();

    prepareSirenGateway(siretGateway, fakeSiret, "0");

    await useCase.execute({ formEstablishment });

    const establishmentAggregate =
      uow.establishmentAggregateRepository.establishmentAggregates[0];
    expect(establishmentAggregate).toBeDefined();
    expect(uow.outboxRepository.events).toHaveLength(1);
    expectToEqual(uow.outboxRepository.events[0].payload, {
      establishmentAggregate,
    });
  });
});
