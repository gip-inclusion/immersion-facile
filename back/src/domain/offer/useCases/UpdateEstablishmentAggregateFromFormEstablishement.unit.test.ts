import {
  addressDtoToString,
  expectPromiseToFailWith,
  FormEstablishmentDtoBuilder,
  SiretEstablishmentDto,
} from "shared";
import { rueGuillaumeTellDto } from "../../../_testBuilders/addressDtos";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { OfferEntityBuilder } from "../../../_testBuilders/OfferEntityBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryAddressGateway } from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/offer/InMemoryEstablishmentAggregateRepository";
import { InMemorySiretGateway } from "../../../adapters/secondary/siret/InMemorySiretGateway";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";
import { UpdateEstablishmentAggregateFromForm } from "./UpdateEstablishmentAggregateFromFormEstablishement";

const prepareSirenGateway = (
  siretGateway: InMemorySiretGateway,
  siret: string,
) => {
  const siretEstablishmentFromAPI: SiretEstablishmentDto = {
    siret,
    businessAddress: "1 rue Guillaume Tell, 75017 Paris",
    businessName: "My establishment",
    nafDto: { code: "1234Z", nomenclature: "Ref2" },
    isOpen: true,
    numberEmployeesRange: "10-19",
  };

  siretGateway.setSirenEstablishment(siretEstablishmentFromAPI);
};

describe("Update Establishment aggregate from form data", () => {
  let siretGateway: InMemorySiretGateway;
  let establishmentAggregateRepo: InMemoryEstablishmentAggregateRepository;
  let addressAPI: InMemoryAddressGateway;
  let updateEstablishmentAggregateFromFormUseCase: UpdateEstablishmentAggregateFromForm;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    siretGateway = new InMemorySiretGateway();
    establishmentAggregateRepo = new InMemoryEstablishmentAggregateRepository();
    addressAPI = new InMemoryAddressGateway();
    uuidGenerator = new TestUuidGenerator();

    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      establishmentAggregateRepository: establishmentAggregateRepo,
    });

    updateEstablishmentAggregateFromFormUseCase =
      new UpdateEstablishmentAggregateFromForm(
        uowPerformer,
        addressAPI,
        uuidGenerator,
        new CustomTimeGateway(),
      );
  });

  it("Fails if establishment does not exists amongst establishments from form", async () => {
    await expectPromiseToFailWith(
      updateEstablishmentAggregateFromFormUseCase.execute(
        FormEstablishmentDtoBuilder.valid().build(),
      ),
      "Cannot update establishment that does not exist.",
    );
  });

  it("Replaces establishment and offers with same siret", async () => {
    const siret = "12345678911234";
    const newPosition = { lon: 1, lat: 2 };
    const newAddress = rueGuillaumeTellDto;
    prepareSirenGateway(siretGateway, siret);

    addressAPI.setAddressAndPosition([
      {
        address: newAddress,
        position: newPosition,
      },
    ]);

    // Prepare : insert an establishment aggregate from LBB with siret
    const previousContact = new ContactEntityBuilder()
      .withEmail("previous.contact@gmail.com")
      .build();

    const previousEstablishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .build();

    const previousAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(previousEstablishment)
      .withOffers([
        new OfferEntityBuilder().build(),
        new OfferEntityBuilder().build(),
      ])
      .withContact(previousContact)
      .build();

    establishmentAggregateRepo.establishmentAggregates = [previousAggregate];

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
      .withBusinessAddress(addressDtoToString(rueGuillaumeTellDto))
      .withBusinessContact(
        new ContactEntityBuilder().withEmail("new.contact@gmail.com").build(),
      )
      .build();

    // Act : execute use-case with same siret
    await updateEstablishmentAggregateFromFormUseCase.execute(
      formEstablishment,
    );

    // Assert
    // One aggregate only
    expect(establishmentAggregateRepo.establishmentAggregates).toHaveLength(1);

    // Establishment matches update from form
    const partialExpectedEstablishment: Partial<EstablishmentEntity> = {
      siret,
      address: newAddress,
      position: newPosition,
      isOpen: true,
      name: formEstablishment.businessName,
    };
    expect(
      establishmentAggregateRepo.establishmentAggregates[0].establishment,
    ).toMatchObject(partialExpectedEstablishment);

    // Offers match update from form
    expect(
      establishmentAggregateRepo.establishmentAggregates[0].offers,
    ).toHaveLength(1);
    expect(
      establishmentAggregateRepo.establishmentAggregates[0].offers[0].romeCode,
    ).toEqual(newRomeCode);

    // Contact match update from form
    expect(
      establishmentAggregateRepo.establishmentAggregates[0].contact?.email,
    ).toBe("new.contact@gmail.com");
  });
});
