import {
  AppellationAndRomeDto,
  FormEstablishmentDtoBuilder,
  GeoPositionDto,
  NafDto,
  NumberEmployeesRange,
  SiretEstablishmentDto,
  WithAcquisition,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  InMemoryAddressGateway,
  avenueChampsElyseesDto,
  rueGuillaumeTellDto,
} from "../../core/address/adapters/InMemoryAddressGateway";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import {
  InMemorySiretGateway,
  TEST_OPEN_ESTABLISHMENT_1,
} from "../../core/sirene/adapters/InMemorySiretGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import { InsertEstablishmentAggregateFromForm } from "./InsertEstablishmentAggregateFromFormEstablishement";

const fakeSiret = "90040893100013";
const fakePosition: GeoPositionDto = { lat: 49.119146, lon: 6.17602 };
const fakeAddress = avenueChampsElyseesDto;
const fakeLocation = {
  position: fakePosition,
  address: fakeAddress,
  id: "11111111-2222-4444-3333-111111111111",
};
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
    const withAcquisition = {
      acquisitionKeyword: "yolo",
      acquisitionCampaign: "my campaign",
    } satisfies WithAcquisition;
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
      .withAcquisition(withAcquisition)
      .withBusinessAddresses([
        {
          id: fakeLocation.id,
          rawAddress: "102 rue du fake, 75001 Paris",
        },
      ])
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
              .withLocations([fakeLocation])
              .withWebsite(formEstablishment.website)
              .withNextAvailabilityDate(nextAvailabilityDate)
              .withAcquisition(withAcquisition)
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

  it("Throws if establishment and offers with same siret already exists", async () => {
    const siret = "12345678911234";
    // Prepare : insert an establishment aggregate from LBB with siret
    const previousContact = new ContactEntityBuilder()
      .withEmail("previous.contact@gmail.com")
      .build();
    const previousEstablishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .withName("Previous name")
      .build();

    const aggregateInRepo = new EstablishmentAggregateBuilder()
      .withEstablishment(previousEstablishment)
      .withOffers([
        new OfferEntityBuilder().build(),
        new OfferEntityBuilder().build(),
      ])
      .withContact(previousContact)
      .build();

    uow.establishmentAggregateRepository.establishmentAggregates = [
      aggregateInRepo,
    ];

    const newRomeCode = "A1101";
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(siret)
      .withBusinessAddresses([
        {
          rawAddress: "102 rue du fake, 75001 Paris",
          id: fakeLocation.id,
        },
      ])
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

    await expectPromiseToFailWithError(
      useCase.execute({ formEstablishment }),
      errors.establishment.conflictError({ siret }),
    );

    expectToEqual(
      uow.establishmentAggregateRepository.establishmentAggregates,
      [aggregateInRepo],
    );
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
      triggeredBy: null,
    });
  });
});
