import { AddressDto } from "shared";
import { AgencyDto } from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryAddressGateway } from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { ConsoleAppLogger } from "../../../adapters/secondary/core/ConsoleAppLogger";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryPeAgenciesReferential } from "../../../adapters/secondary/immersionOffer/InMemoryPeAgenciesReferential";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { defaultQuestionnaireUrl } from "../../../domain/convention/useCases/AddAgency";
import { UpdateAllPeAgencies } from "../../../domain/convention/useCases/UpdateAllPeAgencies";
import { PeAgencyFromReferenciel } from "../../../domain/immersionOffer/ports/PeAgenciesReferential";
import { expectTypeToMatchAndEqual } from "../../../_testBuilders/test.helpers";

const adminMail = "admin@mail.com";

const address: AddressDto = {
  city: "Molsheim",
  departmentCode: "67",
  postcode: "67120",
  streetNumberAndAddress: "6B RUE Gaston Romazzotti",
};

describe("UpdateAllPeAgencies use case", () => {
  let updateAllPeAgencies: UpdateAllPeAgencies;
  let peAgenciesReferential: InMemoryPeAgenciesReferential;
  let agencyRepository: InMemoryAgencyRepository;
  let uuid: TestUuidGenerator;
  let addressApi: InMemoryAddressGateway;

  beforeEach(() => {
    const uow = createInMemoryUow();
    peAgenciesReferential = new InMemoryPeAgenciesReferential();
    agencyRepository = uow.agencyRepository;
    uuid = new TestUuidGenerator();
    addressApi = new InMemoryAddressGateway();
    updateAllPeAgencies = new UpdateAllPeAgencies(
      new InMemoryUowPerformer(uow),
      peAgenciesReferential,
      addressApi,
      adminMail,
      uuid,
      new ConsoleAppLogger(),
    );
  });

  it("should save agencies which have never been saved", async () => {
    peAgenciesReferential.setPeAgencies([peReferentialAgency]);
    agencyRepository.setAgencies([]);
    uuid.setNextUuid("some-uuid");
    addressApi.setNextAddress(address);
    await updateAllPeAgencies.execute();
    expectTypeToMatchAndEqual(agencyRepository.agencies, [
      {
        id: "some-uuid",
        name: "Agence Pôle emploi MOLSHEIM",
        counsellorEmails: [],
        validatorEmails: ["molsheim@pole-emploi.fr"],
        adminEmails: [adminMail],
        address,
        position: {
          lon: 7.511,
          lat: 48.532571,
        },
        signature: "L'équipe de l'Agence Pôle emploi MOLSHEIM",
        questionnaireUrl: defaultQuestionnaireUrl,
        agencySiret: "13000548120984",
        codeSafir: "63019",
        kind: "pole-emploi",
        status: "from-api-PE",
      },
    ]);
  });

  describe("Agency already exists, should add the new emails, siret, code and replaces the address and position", () => {
    it("if PE agency email is same as one of the already existing validator Email", async () => {
      const commonEmail = "common@mail.com";
      peAgenciesReferential.setPeAgencies([
        {
          ...peReferentialAgency,
          contact: { ...peReferentialAgency.contact, email: commonEmail },
        },
      ]);
      const initialAgency: AgencyDto = {
        id: "some-uuid",
        name: "Agence Pôle emploi Molsheim",
        counsellorEmails: [],
        validatorEmails: [commonEmail],
        adminEmails: ["someAdmin@mail.com"],
        address,
        position: {
          lon: 7,
          lat: 49,
        },
        signature: "L'équipe de l'Agence Pôle emploi Molsheim",
        questionnaireUrl: "some-url",
        kind: "pole-emploi",
        status: "active",
      };
      agencyRepository.setAgencies([initialAgency]);
      uuid.setNextUuid("other-uuid");
      await updateAllPeAgencies.execute();

      expectTypeToMatchAndEqual(agencyRepository.agencies, [
        {
          ...initialAgency,
          validatorEmails: [commonEmail],
          address,
          position: {
            lon: 7.511,
            lat: 48.532571,
          },
          agencySiret: "13000548120984",
          codeSafir: "63019",
        },
      ]);
    });

    it("if PE agency email is same as one of the already existing counsellor Email", async () => {
      const commonEmail = "common@mail.com";
      peAgenciesReferential.setPeAgencies([
        {
          ...peReferentialAgency,
          contact: { ...peReferentialAgency.contact, email: commonEmail },
        },
      ]);
      const initialAgency: AgencyDto = {
        id: "some-uuid",
        name: "Agence Pôle emploi Molsheim",
        counsellorEmails: [commonEmail],
        validatorEmails: [],
        adminEmails: ["someAdmin@mail.com"],
        address,
        position: {
          lon: 3,
          lat: 50,
        },
        signature: "L'équipe de l'Agence Pôle emploi Molsheim",
        questionnaireUrl: "some-url",
        kind: "pole-emploi",
        status: "active",
      };
      agencyRepository.setAgencies([initialAgency]);
      uuid.setNextUuid("other-uuid");
      await updateAllPeAgencies.execute();

      expectTypeToMatchAndEqual(agencyRepository.agencies, [
        {
          ...initialAgency,
          counsellorEmails: [commonEmail],
          validatorEmails: [],
          address,
          position: {
            lon: 7.511,
            lat: 48.532571,
          },
          agencySiret: "13000548120984",
          codeSafir: "63019",
        },
      ]);
    });

    it("if PE agency is very close by", async () => {
      peAgenciesReferential.setPeAgencies([peReferentialAgency]);
      const initialAgency: AgencyDto = {
        id: "some-uuid",
        name: "Agence Pôle emploi Molsheim",
        counsellorEmails: [],
        validatorEmails: ["existing@mail.com"],
        adminEmails: ["someAdmin@mail.com"],
        address,
        position: {
          lon: 7.51213,
          lat: 48.532571324,
        },
        signature: "L'équipe de l'Agence Pôle emploi Molsheim",
        questionnaireUrl: "some-url",
        kind: "pole-emploi",
        status: "active",
      };
      agencyRepository.setAgencies([initialAgency]);
      uuid.setNextUuid("other-uuid");
      await updateAllPeAgencies.execute();

      expectTypeToMatchAndEqual(agencyRepository.agencies, [
        {
          ...initialAgency,
          validatorEmails: [
            ...initialAgency.validatorEmails,
            "molsheim@pole-emploi.fr",
          ],
          address,
          position: {
            lon: 7.511,
            lat: 48.532571,
          },
          agencySiret: "13000548120984",
          codeSafir: "63019",
        },
      ]);
    });
  });

  it("if existing agency is not of kind 'pole-emploi' or 'from-api-PE' it should not be considered, and a new one should be created", async () => {
    peAgenciesReferential.setPeAgencies([peReferentialAgency]);
    const initialAgency: AgencyDto = {
      id: "some-uuid",
      name: "Agence Pôle emploi Molsheim",
      counsellorEmails: [],
      validatorEmails: ["existing@mail.com"],
      adminEmails: ["someAdmin@mail.com"],
      address,
      position: {
        lon: 7,
        lat: 49,
      },
      signature: "L'équipe de l'Agence Pôle emploi Molsheim",
      questionnaireUrl: "some-url",
      kind: "mission-locale",
      status: "active",
    };
    agencyRepository.setAgencies([initialAgency]);
    uuid.setNextUuid("other-uuid");
    addressApi.setNextAddress(address);
    await updateAllPeAgencies.execute();

    expectTypeToMatchAndEqual(agencyRepository.agencies, [
      initialAgency,
      {
        id: "other-uuid",
        name: "Agence Pôle emploi MOLSHEIM",
        counsellorEmails: [],
        validatorEmails: ["molsheim@pole-emploi.fr"],
        adminEmails: [adminMail],
        address,
        position: {
          lon: 7.511,
          lat: 48.532571,
        },
        signature: "L'équipe de l'Agence Pôle emploi MOLSHEIM",
        questionnaireUrl: defaultQuestionnaireUrl,
        agencySiret: "13000548120984",
        codeSafir: "63019",
        kind: "pole-emploi",
        status: "from-api-PE",
      },
    ]);
  });
});

const peReferentialAgency: PeAgencyFromReferenciel = {
  code: "GRE0187",
  codeSafir: "63019",
  libelle: "MOLSHEIM",
  libelleEtendu: "Agence Pôle emploi MOLSHEIM",
  type: "APE",
  typeAccueil: "3",
  codeRegionINSEE: "44",
  dispositifADEDA: true,
  contact: { telephonePublic: "39-49", email: "molsheim@pole-emploi.fr" },
  siret: "13000548120984",
  adressePrincipale: {
    ligne4: "16 b RUE Gaston Romazzotti",
    ligne5: "",
    ligne6: "67120 MOLSHEIM",
    gpsLon: 7.511,
    gpsLat: 48.532571,
    communeImplantation: "67300",
    bureauDistributeur: "67120",
  },
};
