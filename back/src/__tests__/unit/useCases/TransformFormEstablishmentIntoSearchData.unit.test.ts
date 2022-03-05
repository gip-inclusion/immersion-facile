import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAdresseAPI } from "../../../adapters/secondary/immersionOffer/InMemoryAdresseAPI";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemoryRomeGateway } from "../../../adapters/secondary/InMemoryRomeGateway";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { SequenceRunner } from "../../../domain/core/ports/SequenceRunner";
import { TransformFormEstablishmentIntoSearchData } from "../../../domain/immersionOffer/useCases/TransformFormEstablishmentIntoSearchData";
import { SireneEstablishmentVO } from "../../../domain/sirene/ports/SireneRepository";
import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";
import { NafDto } from "../../../shared/naf";
import { ProfessionDto } from "../../../shared/rome";
import { LatLonDto } from "../../../shared/SearchImmersionDto";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { FormEstablishmentDtoBuilder } from "../../../_testBuilders/FormEstablishmentDtoBuilder";

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
  });

describe("Transform FormEstablishment into search data", () => {
  let inMemorySireneRepository: InMemorySireneRepository;
  let inMemoryImmersionOfferRepository: InMemoryImmersionOfferRepository;
  let inMemoryAdresseAPI: InMemoryAdresseAPI;
  let transformFormEstablishmentIntoSearchData: TransformFormEstablishmentIntoSearchData;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    inMemorySireneRepository = new InMemorySireneRepository();
    inMemoryImmersionOfferRepository = new InMemoryImmersionOfferRepository();
    inMemoryAdresseAPI = new InMemoryAdresseAPI(fakePosition);
    uuidGenerator = new TestUuidGenerator();
    const inMemoryRomeGateway = new InMemoryRomeGateway();
    const sequencerRunner = new TestSequenceRunner();
    transformFormEstablishmentIntoSearchData =
      new TransformFormEstablishmentIntoSearchData(
        inMemoryImmersionOfferRepository,
        inMemoryAdresseAPI,
        inMemorySireneRepository,
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
    await transformFormEstablishmentIntoSearchData.execute(formEstablishment);

    // Assert
    await expectEstablishmentAggregateInRepo({
      siret: fakeSiret,
      nafDto: expectedNafDto,
      offerRomes: ["A1101", "A1102"],
      contactEmail: fakeBusinessContact.email,
    });
  });

  const expectEstablishmentAggregateInRepo = async (expected: {
    siret: string;
    nafDto: NafDto;
    contactEmail: string;
    offerRomes: string[];
  }) => {
    const repoEstablishmentAggregate =
      inMemoryImmersionOfferRepository.establishmentAggregates[0];

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
      expected.offerRomes.length,
    );
    expect(
      repoEstablishmentAggregate.immersionOffers.map((offer) => offer.romeCode),
    ).toEqual(expected.offerRomes);
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

    await transformFormEstablishmentIntoSearchData.execute(formEstablishment);

    const establishmentAggregate =
      inMemoryImmersionOfferRepository.establishmentAggregates[0];
    expect(establishmentAggregate).toBeDefined();
    expect(establishmentAggregate.establishment.siret).toEqual(
      formEstablishment.siret,
    );
    expect(establishmentAggregate.establishment.numberEmployeesRange).toEqual(
      0,
    );
  });
});
