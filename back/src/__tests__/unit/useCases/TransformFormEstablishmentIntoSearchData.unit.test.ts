import { createInMemoryUow } from "../../../adapters/primary/config";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAdresseAPI } from "../../../adapters/secondary/immersionOffer/InMemoryAdresseAPI";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemoryRomeGateway } from "../../../adapters/secondary/InMemoryRomeGateway";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { SequenceRunner } from "../../../domain/core/ports/SequenceRunner";
import { TransformFormEstablishmentIntoSearchData } from "../../../domain/immersionOffer/useCases/TransformFormEstablishmentIntoSearchData";
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

describe("Transform FormEstablishment into search data", () => {
  let inMemorySireneRepository: InMemorySireneRepository;
  let immersionOfferRepo: InMemoryImmersionOfferRepository;
  let inMemoryAdresseAPI: InMemoryAdresseAPI;
  let useCase: TransformFormEstablishmentIntoSearchData;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    inMemorySireneRepository = new InMemorySireneRepository();
    immersionOfferRepo = new InMemoryImmersionOfferRepository();
    inMemoryAdresseAPI = new InMemoryAdresseAPI(fakePosition);
    uuidGenerator = new TestUuidGenerator();
    const inMemoryRomeGateway = new InMemoryRomeGateway();
    const sequencerRunner = new TestSequenceRunner();
    const outboxRepository = new InMemoryOutboxRepository();
    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      outboxRepo: outboxRepository,
      immersionOfferRepo: immersionOfferRepo,
    });

    useCase = new TransformFormEstablishmentIntoSearchData(
      inMemoryAdresseAPI,
      inMemorySireneRepository,
      inMemoryRomeGateway,
      sequencerRunner,
      uuidGenerator,
      new CustomClock(),
      uowPerformer,
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
    inMemorySireneRepository.setEstablishment(establishmentFromApi);

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

    inMemorySireneRepository.setEstablishment(
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
  it("Removes (and replaces) establishment and offers with same siret from La Bonne Boite if exists", async () => {
    const siret = "12345678911234";
    // Prepare : insert an establishment aggregate from LBB with siret
    immersionOfferRepo.establishmentAggregates = [
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityV2Builder()
            .withSiret(siret)
            .withDataSource("api_labonneboite")
            .build(),
        )
        .withImmersionOffers([new ImmersionOfferEntityV2Builder().build()])
        .build(),
    ];
    // Act : execute use-case with same siret
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(siret)
      .build();
    await useCase.execute(formEstablishment);

    // Assert
    expect(immersionOfferRepo.establishmentAggregates).toHaveLength(0);
  });
  it("Raises an error if an establishment from form with same siret already exists - Should not happen.", async () => {
    const siret = "12345678911234";
    // Prepare : insert an establishment aggregate from LBB with siret
    immersionOfferRepo.establishmentAggregates = [
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityV2Builder()
            .withSiret(siret)
            .withDataSource("form")
            .build(),
        )
        .withImmersionOffers([new ImmersionOfferEntityV2Builder().build()])
        .build(),
    ];
    // Act and assert : execute use-case with same siret from form should raise
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(siret)
      .build();

    await expect(useCase.execute(formEstablishment)).rejects.toThrow(
      "Cannot insert establishment from form with siret 12345678911234 since it already exists.",
    );
  });
});
