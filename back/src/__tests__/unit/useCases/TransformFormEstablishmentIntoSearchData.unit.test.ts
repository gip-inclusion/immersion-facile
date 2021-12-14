import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemoryFormEstablishmentRepository } from "../../../adapters/secondary/InMemoryFormEstablishmentRepository";
import { InMemoryRomeGateway } from "../../../adapters/secondary/InMemoryRomeGateway";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { SequenceRunner } from "../../../domain/core/ports/SequenceRunner";
import { Position } from "../../../domain/immersionOffer/ports/GetPosition";
import { TransformFormEstablishmentIntoSearchData } from "../../../domain/immersionOffer/useCases/TransformFormEstablishmentIntoSearchData";
import { Establishment } from "../../../domain/sirene/ports/SireneRepository";
import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";
import { ProfessionDto } from "../../../shared/rome";
import { FormEstablishmentDtoBuilder } from "../../../_testBuilders/FormEstablishmentDtoBuilder";

class TestSequenceRunner implements SequenceRunner {
  public run<Input, Output>(array: Input[], cb: (a: Input) => Promise<Output>) {
    return Promise.all(array.map(cb));
  }
}

const fakePosition: Position = { lat: 49.119146, lon: 6.17602 };
const getEstablishmentFromSirenApi = (
  formEstablishment: FormEstablishmentDto,
): Establishment => ({
  siret: formEstablishment.siret,
  uniteLegale: {
    denominationUniteLegale: formEstablishment.businessName,
    activitePrincipaleUniteLegale: "85.59A",
    trancheEffectifsUniteLegale: "01",
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
  let formEstablishmentRepository: InMemoryFormEstablishmentRepository;
  let inMemorySireneRepository: InMemorySireneRepository;
  let inMemoryImmersionOfferRepository: InMemoryImmersionOfferRepository;
  let transformFormEstablishmentIntoSearchData: TransformFormEstablishmentIntoSearchData;

  beforeEach(() => {
    formEstablishmentRepository = new InMemoryFormEstablishmentRepository();
    inMemorySireneRepository = new InMemorySireneRepository();
    inMemoryImmersionOfferRepository = new InMemoryImmersionOfferRepository();
    const getPosition = async () => fakePosition;
    const inMemoryRomeGateway = new InMemoryRomeGateway();
    const sequencerRunner = new TestSequenceRunner();
    inMemoryImmersionOfferRepository.empty();
    transformFormEstablishmentIntoSearchData =
      new TransformFormEstablishmentIntoSearchData(
        formEstablishmentRepository,
        inMemoryImmersionOfferRepository,
        getPosition,
        inMemorySireneRepository,
        inMemoryRomeGateway,
        sequencerRunner,
      );
  });

  it("converts Form Establishment in search format", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid().build();
    await formEstablishmentRepository.save(formEstablishment);
    const establishmentFromApi =
      getEstablishmentFromSirenApi(formEstablishment);
    inMemorySireneRepository.setEstablishment(establishmentFromApi);

    await transformFormEstablishmentIntoSearchData.execute(formEstablishment);

    await expectEstablishmentInRepo(formEstablishment);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const romeBoulanger = formEstablishment.professions[0].romeCodeMetier!;
    await expectImmersionOfferAndContactInRepo(romeBoulanger, {
      siret: formEstablishment.siret,
      contactEmail: formEstablishment.businessContacts[0].email,
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const romePatissier = formEstablishment.professions[1].romeCodeMetier!;
    await expectImmersionOfferAndContactInRepo(romePatissier, {
      siret: formEstablishment.siret,
      contactEmail: formEstablishment.businessContacts[0].email,
    });
  });

  it("converts Form establishment event when they only have romeAppelation (not romeCode)", async () => {
    // prepare
    const professions: ProfessionDto[] = [
      { romeCodeAppellation: "11987", description: "métier A" },
    ];
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withProfessions(professions)
      .build();
    await formEstablishmentRepository.save(formEstablishment);
    const establishmentFromApi =
      getEstablishmentFromSirenApi(formEstablishment);
    inMemorySireneRepository.setEstablishment(establishmentFromApi);

    // act
    await transformFormEstablishmentIntoSearchData.execute(formEstablishment);

    // assert
    const storedImmersion = inMemoryImmersionOfferRepository.immersionOffers;
    expect(storedImmersion).toHaveLength(1);
    expect(storedImmersion[0].getProps()).toMatchObject({
      data_source: "form",
      rome: "A1101",
    });
  });

  const expectImmersionOfferAndContactInRepo = async (
    rome: string,
    expected: { siret: string; contactEmail: string },
  ) => {
    const immersionsBoulanger =
      await inMemoryImmersionOfferRepository.immersionOffers.filter(
        (offer) => offer.getRome() === rome,
      );

    //Verify that immersion matches
    expect(immersionsBoulanger).toHaveLength(1);
    const immersionBoulanger = immersionsBoulanger[0];
    expect(immersionBoulanger.getProps().siret).toEqual(expected.siret);

    //Verify that the company contact is here
    const boulangerEstablishmentContact =
      immersionsBoulanger[0].getProps().contactInEstablishment;
    expect(boulangerEstablishmentContact).toBeDefined();
    expect(boulangerEstablishmentContact?.email).toEqual(expected.contactEmail);
  };

  const expectEstablishmentInRepo = async (
    formEstablishment: FormEstablishmentDto,
  ) => {
    const establishment =
      await inMemoryImmersionOfferRepository.getEstablishmentFromSiret(
        formEstablishment.siret,
      );

    expect(establishment.getSiret()).toEqual(formEstablishment.siret);
    expect(establishment.getNaf().length).toEqual(5);
  };
});
