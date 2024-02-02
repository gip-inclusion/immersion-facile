import {
  AppellationAndRomeDto,
  FormEstablishmentDtoBuilder,
  SiretDto,
  addressDtoToString,
  expectPromiseToFailWith,
  expectToEqual,
} from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  InMemoryAddressGateway,
  rueGuillaumeTellDto,
} from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../../../adapters/secondary/offer/InMemoryEstablishmentAggregateRepository";
import { InMemorySiretGateway } from "../../../adapters/secondary/siret/InMemorySiretGateway";
import { UpdateEstablishmentAggregateFromForm } from "./UpdateEstablishmentAggregateFromFormEstablishement";

describe("Update Establishment aggregate from form data", () => {
  let siretGateway: InMemorySiretGateway;
  let addressGateway: InMemoryAddressGateway;
  let uuidGenerator: TestUuidGenerator;
  let timeGateway: CustomTimeGateway;
  let uow: InMemoryUnitOfWork;
  let updateEstablishmentAggregateFromFormUseCase: UpdateEstablishmentAggregateFromForm;

  beforeEach(() => {
    siretGateway = new InMemorySiretGateway();
    addressGateway = new InMemoryAddressGateway();
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    timeGateway = new CustomTimeGateway();
    updateEstablishmentAggregateFromFormUseCase =
      new UpdateEstablishmentAggregateFromForm(
        new InMemoryUowPerformer(uow),
        addressGateway,
        uuidGenerator,
        timeGateway,
      );
  });

  it("Fails if establishment does not exists amongst establishments from form", async () => {
    await expectPromiseToFailWith(
      updateEstablishmentAggregateFromFormUseCase.execute({
        formEstablishment: FormEstablishmentDtoBuilder.valid().build(),
      }),
      "Cannot update establishment that does not exist.",
    );
  });

  it("Replaces establishment and offers with same siret", async () => {
    // Prepare : insert an establishment aggregate from LBB with siret

    const siret: SiretDto = "12345678911234";

    siretGateway.setSirenEstablishment({
      siret,
      businessAddress: "1 rue Guillaume Tell, 75017 Paris",
      businessName: "My establishment",
      nafDto: { code: "1234Z", nomenclature: "Ref2" },
      isOpen: true,
      numberEmployeesRange: "10-19",
    });

    addressGateway.setAddressAndPosition([
      {
        address: rueGuillaumeTellDto,
        position: { lon: 1, lat: 2 },
      },
    ]);

    const contact = new ContactEntityBuilder()
      .withEmail("previous.contact@gmail.com")
      .build();
    const previousAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(
        new EstablishmentEntityBuilder().withSiret(siret).build(),
      )
      .withOffers([
        new OfferEntityBuilder().build(),
        new OfferEntityBuilder().build(),
      ])
      .withContact(contact)
      .build();

    uow.establishmentAggregateRepository.establishmentAggregates = [
      previousAggregate,
    ];
    uuidGenerator.setNextUuid(contact.id);

    const newRomeCode = "A1101";
    const updatedContact = new ContactEntityBuilder()
      .withEmail("new.contact@gmail.com")
      .build();
    const updatedAppelation: AppellationAndRomeDto = {
      romeLabel: "Boulangerie",
      appellationLabel: "Boulanger",
      romeCode: newRomeCode,
      appellationCode: "22222",
    };
    const nextAvailabilityDate = new Date();
    const updatedFormEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(siret)
      .withAppellations([updatedAppelation])
      .withBusinessAddress(addressDtoToString(rueGuillaumeTellDto))
      .withBusinessContact(updatedContact)
      .withNextAvailabilityDate(nextAvailabilityDate)
      .build();

    // Act : execute use-case with same siret
    await updateEstablishmentAggregateFromFormUseCase.execute({
      formEstablishment: updatedFormEstablishment,
    });

    // Assert
    // One aggregate only
    expectToEqual(
      uow.establishmentAggregateRepository.establishmentAggregates,
      [
        new EstablishmentAggregateBuilder(previousAggregate)
          .withEstablishment(
            new EstablishmentEntityBuilder(previousAggregate.establishment)
              .withAddress(rueGuillaumeTellDto)
              .withCreatedAt(timeGateway.now())
              .withCustomizedName(
                updatedFormEstablishment.businessNameCustomized,
              )
              .withFitForDisabledWorkers(
                updatedFormEstablishment.fitForDisabledWorkers,
              )
              .withIsCommited(updatedFormEstablishment.isEngagedEnterprise)
              .withIsOpen(true)
              .withName(updatedFormEstablishment.businessName)
              .withPosition({ lon: 1, lat: 2 })
              .withUpdatedAt(timeGateway.now())
              .withWebsite(updatedFormEstablishment.website)
              .withNextAvailabilityDate(nextAvailabilityDate)
              .build(),
          )
          .withOffers([
            new OfferEntityBuilder()
              .withRomeLabel(updatedAppelation.romeLabel)
              .withRomeCode(updatedAppelation.romeCode)
              .withAppellationCode(updatedAppelation.appellationCode)
              .withAppellationLabel(updatedAppelation.appellationLabel)
              .withCreatedAt(timeGateway.now())
              .withScore(10)
              .build(),
          ])
          .withContact(updatedContact)
          .build(),
      ],
    );
  });
});
