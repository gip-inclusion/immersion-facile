import { FormEstablishmentDtoBuilder } from "shared/src/formEstablishment/FormEstablishmentDtoBuilder";
import { addressDtoToString } from "shared/src/utils/address";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryAddressGateway } from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemorySireneGateway } from "../../../adapters/secondary/InMemorySireneGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { EstablishmentEntityV2 } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { UpdateEstablishmentAggregateFromForm } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentAggregateFromFormEstablishement";
import {
  SireneEstablishmentProps,
  SireneEstablishmentVO,
} from "../../../domain/sirene/valueObjects/SireneEstablishmentVO";
import { rueGuillaumeTellDto } from "../../../_testBuilders/addressDtos";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { expectPromiseToFailWith } from "../../../_testBuilders/test.helpers";

const prepareSireneRepo = (
  sireneRepo: InMemorySireneGateway,
  siret: string,
) => {
  const sireneEstablishmentFromAPI = new SireneEstablishmentVO({
    siret,
    uniteLegale: {
      activitePrincipaleUniteLegale: "85.59A",
      trancheEffectifsUniteLegale: "01",
      nomenclatureActivitePrincipaleUniteLegale: "nomencl",
    },
  } as SireneEstablishmentProps);

  sireneRepo.setEstablishment(sireneEstablishmentFromAPI);
};

describe("Update Establishment aggregate from form data", () => {
  let sireneRepo: InMemorySireneGateway;
  let establishmentAggregateRepo: InMemoryEstablishmentAggregateRepository;
  let addressAPI: InMemoryAddressGateway;
  let updateEstablishmentAggregateFromFormUseCase: UpdateEstablishmentAggregateFromForm;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    sireneRepo = new InMemorySireneGateway();
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
        sireneRepo,
        addressAPI,
        uuidGenerator,
        new CustomClock(),
      );
  });

  it("Fails if establishment does not exists amongst establishments from form", async () => {
    await expectPromiseToFailWith(
      updateEstablishmentAggregateFromFormUseCase.execute(
        FormEstablishmentDtoBuilder.valid().build(),
      ),
      "Cannot update establishment from form that does not exist.",
    );
  });

  // TODO This test is very fragile due to the implementation of the InMemoryAddressApi
  /* eslint-disable-next-line  jest/no-disabled-tests */
  it.skip("Replaces establishment and offers with same siret", async () => {
    const siret = "12345678911234";
    const newPosition = { lon: 1, lat: 2 };
    const newAddress = rueGuillaumeTellDto;
    prepareSireneRepo(sireneRepo, siret);

    addressAPI.setNextPosition(newPosition);
    addressAPI.setNextAddress(newAddress);

    // Prepare : insert an establishment aggregate from LBB with siret
    const previousContact = new ContactEntityV2Builder()
      .withEmail("previous.contact@gmail.com")
      .build();

    const previousEstablishment = new EstablishmentEntityV2Builder()
      .withSiret(siret)
      .withDataSource("form")
      .build();

    const previousAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(previousEstablishment)
      .withImmersionOffers([
        new ImmersionOfferEntityV2Builder().build(),
        new ImmersionOfferEntityV2Builder().build(),
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
        new ContactEntityV2Builder().withEmail("new.contact@gmail.com").build(),
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
    const partialExpectedEstablishment: Partial<EstablishmentEntityV2> = {
      siret,
      address: newAddress,
      position: newPosition,
      dataSource: "form",
      isActive: true,
      name: formEstablishment.businessName,
    };
    expect(
      establishmentAggregateRepo.establishmentAggregates[0].establishment,
    ).toMatchObject(partialExpectedEstablishment);

    // Offers match update from form
    expect(
      establishmentAggregateRepo.establishmentAggregates[0].immersionOffers,
    ).toHaveLength(1);
    expect(
      establishmentAggregateRepo.establishmentAggregates[0].immersionOffers[0]
        .romeCode,
    ).toEqual(newRomeCode);

    // Contact match update from form
    expect(
      establishmentAggregateRepo.establishmentAggregates[0].contact?.email,
    ).toBe("new.contact@gmail.com");
  });
});
