import { createInMemoryUow } from "../../../adapters/primary/config";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAdresseAPI } from "../../../adapters/secondary/immersionOffer/InMemoryAdresseAPI";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { EstablishmentEntityV2 } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { UpdateEstablishmentAggregateFromForm } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentAggregateFromFormEstablishement";
import {
  SireneEstablishmentProps,
  SireneEstablishmentVO,
} from "../../../domain/sirene/ports/SireneRepository";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { FormEstablishmentDtoBuilder } from "../../../_testBuilders/FormEstablishmentDtoBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { expectPromiseToFailWith } from "../../../_testBuilders/test.helpers";

const prepareSireneRepo = (
  sireneRepo: InMemorySireneRepository,
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
  let sireneRepo: InMemorySireneRepository;
  let establishmentAggregateRepo: InMemoryEstablishmentAggregateRepository;
  let addresseAPI: InMemoryAdresseAPI;
  let useCase: UpdateEstablishmentAggregateFromForm;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    sireneRepo = new InMemorySireneRepository();
    establishmentAggregateRepo = new InMemoryEstablishmentAggregateRepository();
    addresseAPI = new InMemoryAdresseAPI();
    uuidGenerator = new TestUuidGenerator();

    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      establishmentAggregateRepo,
    });

    useCase = new UpdateEstablishmentAggregateFromForm(
      uowPerformer,
      sireneRepo,
      addresseAPI,
      uuidGenerator,
      new CustomClock(),
    );
  });

  it("Fails if establishment does not exists amongst establishments from form", async () => {
    await expectPromiseToFailWith(
      useCase.execute(FormEstablishmentDtoBuilder.valid().build()),
      "Cannot update establishment from form that does not exist.",
    );
  });
  it("Replaces establishment and offers with same siret", async () => {
    const siret = "12345678911234";
    prepareSireneRepo(sireneRepo, siret);
    addresseAPI.setNextPosition({ lon: 1, lat: 2 });
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
      .withBusinessContact(
        new ContactEntityV2Builder().withEmail("new.contact@gmail.com").build(),
      )
      .build();

    // Act : execute use-case with same siret
    await useCase.execute(formEstablishment);

    // Assert
    // One aggregate only
    expect(establishmentAggregateRepo.establishmentAggregates).toHaveLength(1);

    // Establishment matches update from form
    const partialExpectedEstablishment: Partial<EstablishmentEntityV2> = {
      siret,
      address: formEstablishment.businessAddress,
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
