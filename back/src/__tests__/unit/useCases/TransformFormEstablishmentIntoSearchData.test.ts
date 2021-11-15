import { fakeGetPosition } from "../../../_testBuilders/FakeHttpCalls";
import { FormEstablishmentDtoBuilder } from "../../../_testBuilders/FormEstablishmentDtoBuilder";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemoryFormEstablishmentRepository } from "../../../adapters/secondary/InMemoryFormEstablishmentRepository";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { Position } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { GetPosition } from "../../../domain/immersionOffer/entities/UncompleteEstablishmentEntity";
import { TransformFormEstablishmentIntoSearchData } from "../../../domain/immersionOffer/useCases/TransformFormEstablishmentIntoSearchData";
import { Establishment } from "../../../domain/sirene/ports/SireneRepository";
import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";

const fakePosition: Position = { lat: 49.119146, lon: 6.17602 };

describe("Transform FormEstablishment into search data", () => {
  let formEstablishmentRepository: InMemoryFormEstablishmentRepository;
  let inMemorySireneRepository: InMemorySireneRepository;
  let inMemoryImmersionOfferRepository: InMemoryImmersionOfferRepository;
  let transformFormEstablishmentIntoSearchData: TransformFormEstablishmentIntoSearchData;
  let getPosition: GetPosition;

  beforeEach(() => {
    formEstablishmentRepository = new InMemoryFormEstablishmentRepository();
    inMemorySireneRepository = new InMemorySireneRepository();
    inMemoryImmersionOfferRepository = new InMemoryImmersionOfferRepository();
    getPosition = async () => fakePosition;
    transformFormEstablishmentIntoSearchData =
      new TransformFormEstablishmentIntoSearchData(
        formEstablishmentRepository,
        inMemoryImmersionOfferRepository,
        getPosition,
        inMemorySireneRepository,
      );
  });

  it("converts Form Establishment in search format", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid().build();
    await formEstablishmentRepository.save(formEstablishment);

    const establishmentFromSirenApi: Establishment = {
      // nic: "01234",
      siret: formEstablishment.siret,
      uniteLegale: {
        denominationUniteLegale: formEstablishment.businessName,
        activitePrincipaleUniteLegale: "85.59A",
        // nomenclatureActivitePrincipaleUniteLegale: "Ref2",
        trancheEffectifsUniteLegale: "01",
      },
      adresseEtablissement: {
        numeroVoieEtablissement: formEstablishment.businessAddress,
        typeVoieEtablissement: formEstablishment.businessAddress,
        libelleVoieEtablissement: formEstablishment.businessAddress,
        codePostalEtablissement: formEstablishment.businessAddress,
        libelleCommuneEtablissement: formEstablishment.businessAddress,
      },
    };
    inMemorySireneRepository.setEstablishment(establishmentFromSirenApi);

    await transformFormEstablishmentIntoSearchData.execute(
      formEstablishment.id,
    );

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

  const expectImmersionOfferAndContactInRepo = async (
    rome: string,
    expected: { siret: string; contactEmail: string },
  ) => {
    const immersionsBoulanger =
      await inMemoryImmersionOfferRepository.getFromSearch({
        rome,
        distance: 30,
        ...fakePosition,
      });

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
    const establishments =
      await inMemoryImmersionOfferRepository.getEstablishmentsFromSiret(
        formEstablishment.siret,
      );

    expect(establishments).toHaveLength(1);
    const establishment = establishments[0];
    expect(establishment.getSiret()).toEqual(formEstablishment.siret);
    expect(establishment.getNaf().length).toEqual(5);
  };
});
