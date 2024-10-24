import { AddressDto, AgencyDto, expectToEqual } from "shared";
import { InMemoryAddressGateway } from "../../core/address/adapters/InMemoryAddressGateway";
import { ConsoleAppLogger } from "../../core/app-logger/adapters/ConsoleAppLogger";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { PeAgencyFromReferenciel } from "../../establishment/ports/PeAgenciesReferential";
import { InMemoryAgencyRepository } from "../adapters/InMemoryAgencyRepository";
import { InMemoryPeAgenciesReferential } from "../adapters/pe-agencies-referential/InMemoryPeAgenciesReferential";
import { UpdateAllPeAgencies } from "./UpdateAllPeAgencies";

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
    expectToEqual(agencyRepository.agencies, [
      {
        id: "some-uuid",
        name: "Agence Pôle emploi MOLSHEIM",
        counsellorEmails: [],
        validatorEmails: ["molsheim@pole-emploi.fr"],
        coveredDepartments: [address.departmentCode],
        address,
        position: {
          lon: 7.511,
          lat: 48.532571,
        },
        signature: "L'équipe de l'Agence Pôle emploi MOLSHEIM",
        agencySiret: "13000548120984",
        codeSafir: "63019",
        kind: "pole-emploi",
        status: "from-api-PE",
        refersToAgencyId: null,
        refersToAgencyName: null,
        logoUrl: null,
        questionnaireUrl: null,
        rejectionJustification: null,
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
        coveredDepartments: [address.departmentCode],
        address,
        position: {
          lon: 7,
          lat: 49,
        },
        signature: "L'équipe de l'Agence Pôle emploi Molsheim",
        questionnaireUrl: "https://some-url.com",
        kind: "pole-emploi",
        status: "active",
        agencySiret: "12345678904444",
        refersToAgencyId: null,
        refersToAgencyName: null,
        logoUrl: null,
        rejectionJustification: null,
        codeSafir: "63019",
      };

      agencyRepository.setAgencies([initialAgency]);
      uuid.setNextUuid("other-uuid");
      await updateAllPeAgencies.execute();

      expectToEqual(agencyRepository.agencies, [
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
        coveredDepartments: [address.departmentCode],
        address,
        position: {
          lon: 3,
          lat: 50,
        },
        signature: "L'équipe de l'Agence Pôle emploi Molsheim",
        questionnaireUrl: "https://some-url.com",
        kind: "pole-emploi",
        status: "active",
        agencySiret: "12345678904444",
        refersToAgencyId: null,
        refersToAgencyName: null,
        logoUrl: null,
        rejectionJustification: null,
        codeSafir: "63019",
      };

      agencyRepository.setAgencies([initialAgency]);
      uuid.setNextUuid("other-uuid");
      await updateAllPeAgencies.execute();

      expectToEqual(agencyRepository.agencies, [
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
        coveredDepartments: [address.departmentCode],
        address,
        position: {
          lon: 7.51213,
          lat: 48.532571324,
        },
        signature: "L'équipe de l'Agence Pôle emploi Molsheim",
        questionnaireUrl: "https://some-url.com",
        kind: "pole-emploi",
        status: "active",
        agencySiret: "12345678904444",
        refersToAgencyId: null,
        refersToAgencyName: null,
        logoUrl: null,
        rejectionJustification: null,
        codeSafir: "",
      };

      agencyRepository.setAgencies([initialAgency]);
      uuid.setNextUuid("other-uuid");
      await updateAllPeAgencies.execute();

      expectToEqual(agencyRepository.agencies, [
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
      coveredDepartments: [address.departmentCode],
      address,
      position: {
        lon: 7,
        lat: 49,
      },
      signature: "L'équipe de l'Agence Pôle emploi Molsheim",
      questionnaireUrl: "https://some-url.com",
      kind: "mission-locale",
      status: "active",
      agencySiret: "12345678904444",
      refersToAgencyId: null,
      refersToAgencyName: null,
      logoUrl: null,
      rejectionJustification: null,
      codeSafir: "",
    };

    agencyRepository.setAgencies([initialAgency]);
    uuid.setNextUuid("other-uuid");
    addressApi.setNextAddress(address);
    await updateAllPeAgencies.execute();

    expectToEqual(agencyRepository.agencies, [
      initialAgency,
      {
        id: "other-uuid",
        name: "Agence Pôle emploi MOLSHEIM",
        counsellorEmails: [],
        validatorEmails: ["molsheim@pole-emploi.fr"],
        coveredDepartments: [address.departmentCode],
        address,
        position: {
          lon: 7.511,
          lat: 48.532571,
        },
        signature: "L'équipe de l'Agence Pôle emploi MOLSHEIM",
        agencySiret: "13000548120984",
        codeSafir: "63019",
        kind: "pole-emploi",
        status: "from-api-PE",
        logoUrl: null,
        questionnaireUrl: null,
        refersToAgencyId: null,
        refersToAgencyName: null,
        rejectionJustification: null,
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
