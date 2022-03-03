import { createInMemoryUow } from "../../../adapters/primary/config";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAdresseAPI } from "../../../adapters/secondary/immersionOffer/InMemoryAdresseAPI";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersionOfferRepository";
import { InMemoryRomeGateway } from "../../../adapters/secondary/InMemoryRomeGateway";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { SequenceRunner } from "../../../domain/core/ports/SequenceRunner";
import { EstablishmentEntityV2 } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { UpsertEstablishmentAggregateFromForm } from "../../../domain/immersionOffer/useCases/UpsertEstablishmentAggregateFromFormEstablishement";
import { SireneEstablishmentVO } from "../../../domain/sirene/ports/SireneRepository";
import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";
import { NafDto } from "../../../shared/naf";
import { ProfessionDto } from "../../../shared/rome";
import { LatLonDto } from "../../../shared/SearchImmersionDto";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { FormEstablishmentDtoBuilder } from "../../../_testBuilders/FormEstablishmentDtoBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";

class TestSequenceRunner implements SequenceRunner {
  public run<Input, Output>(array: Input[], cb: (a: Input) => Promise<Output>) {
    return Promise.all(array.map(cb));
  }
}
const fakeSiret = "90040893100013";
const fakePosition: LatLonDto = { lat: 49.119146, lon: 6.17602 };
const fakeActivitePrincipaleUniteLegale = "85.59A";
const fakeBusinessContact = new ContactEntityV2Builder().build();

const expectedNafDto: NafDto = { code: "8559A", nomenclature: "nomencl" };

const getEstablishmentFromSireneApi = (
  formEstablishment: FormEstablishmentDto,
): SireneEstablishmentVO =>
  new SireneEstablishmentVO({
    siret: formEstablishment.siret,
    uniteLegale: {
      denominationUniteLegale: formEstablishment.businessName,
      activitePrincipaleUniteLegale: fakeActivitePrincipaleUniteLegale,
      trancheEffectifsUniteLegale: "01",
      nomenclatureActivitePrincipaleUniteLegale: "nomencl",
    },
    adresseEtablissement: {
      numeroVoieEtablissement: formEstablishment.businessAddress,
      typeVoieEtablissement: formEstablishment.businessAddress,
      libelleVoieEtablissement: formEstablishment.businessAddress,
      codePostalEtablissement: formEstablishment.businessAddress,
      libelleCommuneEtablissement: formEstablishment.businessAddress,
    },
    periodesEtablissement: [
      {
        dateFin: null,
        dateDebut: "2022-01-01",
        etatAdministratifEtablissement: "A",
      },
    ],
  });

describe("Upsert Establishment aggregate from form data", () => {
  let sireneRepo: InMemorySireneRepository;
  let immersionOfferRepo: InMemoryImmersionOfferRepository;
  let addresseAPI: InMemoryAdresseAPI;
  let useCase: UpsertEstablishmentAggregateFromForm;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    sireneRepo = new InMemorySireneRepository();
    immersionOfferRepo = new InMemoryImmersionOfferRepository();
    addresseAPI = new InMemoryAdresseAPI(fakePosition);
    uuidGenerator = new TestUuidGenerator();
    const inMemoryRomeGateway = new InMemoryRomeGateway();
    const sequencerRunner = new TestSequenceRunner();

    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      immersionOfferRepo,
    });

    useCase = new UpsertEstablishmentAggregateFromForm(
      uowPerformer,
      sireneRepo,
      addresseAPI,
      inMemoryRomeGateway,
      sequencerRunner,
      uuidGenerator,
      new CustomClock(),
    );
  });

  it("converts Form Establishment in search format", async () => {
    // Prepare
    const professions: ProfessionDto[] = [
      {
        romeCodeMetier: "A1101",
        description: "métier A",
      },
      {
        romeCodeMetier: "A1102",
        romeCodeAppellation: "11717",
        description: "métier B",
      },
    ];
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(fakeSiret)
      .withProfessions(professions)
      .withBusinessContacts([fakeBusinessContact])
      .build();

    const establishmentFromApi =
      getEstablishmentFromSireneApi(formEstablishment);
    sireneRepo.setEstablishment(establishmentFromApi);

    // Act
    await useCase.execute(formEstablishment);

    // Assert
    await expectEstablishmentAggregateInRepo({
      siret: fakeSiret,
      nafDto: expectedNafDto,
      offerRomeCodesAndAppellations: [
        { code: "A1101" },
        { code: "A1102", appellation: 11717 },
      ],
      contactEmail: fakeBusinessContact.email,
    });
  });

  const expectEstablishmentAggregateInRepo = async (expected: {
    siret: string;
    nafDto: NafDto;
    contactEmail: string;
    offerRomeCodesAndAppellations: { code: string; appellation?: number }[];
  }) => {
    const repoEstablishmentAggregate =
      immersionOfferRepo.establishmentAggregates[0];

    expect(repoEstablishmentAggregate).toBeDefined();
    expect(repoEstablishmentAggregate.establishment.siret).toEqual(
      expected.siret,
    );
    expect(repoEstablishmentAggregate.establishment.nafDto).toEqual(
      expected.nafDto,
    );
    expect(repoEstablishmentAggregate.establishment.dataSource).toEqual("form");

    // Contact
    expect(repoEstablishmentAggregate.contact).toBeDefined();
    expect(repoEstablishmentAggregate.contact?.email).toEqual(
      expected.contactEmail,
    );

    // Offer
    expect(repoEstablishmentAggregate.immersionOffers).toHaveLength(
      expected.offerRomeCodesAndAppellations.length,
    );
    expect(
      repoEstablishmentAggregate.immersionOffers.map((offer) => ({
        code: offer.romeCode,
        appellation: offer.romeAppellation,
      })),
    ).toEqual(expected.offerRomeCodesAndAppellations);
  };

  it("correctly converts establishment with a 'tranche d'effectif salarié' of 00", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid().build();
    const establishmentFromApi =
      getEstablishmentFromSireneApi(formEstablishment);

    sireneRepo.setEstablishment(
      new SireneEstablishmentVO({
        ...establishmentFromApi.props,
        uniteLegale: {
          ...establishmentFromApi.uniteLegale,
          trancheEffectifsUniteLegale: "00",
        },
      }),
    );

    await useCase.execute(formEstablishment);

    const establishmentAggregate =
      immersionOfferRepo.establishmentAggregates[0];
    expect(establishmentAggregate).toBeDefined();
    expect(establishmentAggregate.establishment.siret).toEqual(
      formEstablishment.siret,
    );
    expect(establishmentAggregate.establishment.numberEmployeesRange).toEqual(
      0,
    );
  });
  it("Removes (and replaces) establishment and offers with same siret if exists", async () => {
    const siret = "12345678911234";
    // Prepare : insert an establishment aggregate from LBB with siret
    const previousContact = new ContactEntityV2Builder()
      .withEmail("previous.contact@gmail.com")
      .build();
    const previousEstablishment = new EstablishmentEntityV2Builder()
      .withSiret(siret)
      .withDataSource("api_labonneboite")
      .build();

    const previousAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(previousEstablishment)
      .withImmersionOffers([
        new ImmersionOfferEntityV2Builder().build(),
        new ImmersionOfferEntityV2Builder().build(),
      ])
      .withContact(previousContact)
      .build();
    immersionOfferRepo.establishmentAggregates = [previousAggregate];

    const newRomeCode = "A1101";
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(siret)
      .withProfessions([
        {
          description: "Boulanger",
          romeCodeMetier: newRomeCode,
          romeCodeAppellation: "22222",
        },
      ])
      .withBusinessContacts([
        new ContactEntityV2Builder().withEmail("new.contact@gmail.com").build(),
      ])
      .build();

    const establishmentFromApi =
      getEstablishmentFromSireneApi(formEstablishment);
    sireneRepo.setEstablishment(establishmentFromApi);

    // Act : execute use-case with same siret
    await useCase.execute(formEstablishment);

    // Assert
    // One aggregate only
    expect(immersionOfferRepo.establishmentAggregates).toHaveLength(1);

    // Establishment matches update from form
    const partialExpectedEstablishment: Partial<EstablishmentEntityV2> = {
      siret,
      address: formEstablishment.businessAddress,
      dataSource: "form",
      isActive: true,
      name: formEstablishment.businessName,
    };
    expect(
      immersionOfferRepo.establishmentAggregates[0].establishment,
    ).toMatchObject(partialExpectedEstablishment);

    // Offers match update from form
    expect(
      immersionOfferRepo.establishmentAggregates[0].immersionOffers,
    ).toHaveLength(1);
    expect(
      immersionOfferRepo.establishmentAggregates[0].immersionOffers[0].romeCode,
    ).toEqual(newRomeCode);

    // Contact match update from form
    expect(
      immersionOfferRepo.establishmentAggregates[0].contact?.email,
    ).toEqual("new.contact@gmail.com");
  });
});
