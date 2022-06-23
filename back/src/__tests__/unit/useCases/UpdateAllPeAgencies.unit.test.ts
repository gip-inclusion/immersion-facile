import { expectTypeToMatchAndEqual } from "../../../_testBuilders/test.helpers";
import { ConsoleAppLogger } from "../../../adapters/secondary/core/ConsoleAppLogger";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryPeAgenciesReferential } from "../../../adapters/secondary/immersionOffer/InMemoryPeAgenciesReferential";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { defaultQuestionnaireUrl } from "../../../domain/convention/useCases/AddAgency";
import { UpdateAllPeAgencies } from "../../../domain/convention/useCases/UpdateAllPeAgencies";
import { AgencyDto } from "shared/src/agency/agency.dto";
import { PeAgencyFromReferenciel } from "../../../domain/immersionOffer/ports/PeAgenciesReferential";

const adminMail = "admin@mail.com";

describe("UpdateAllPeAgencies use case", () => {
  let updateAllPeAgencies: UpdateAllPeAgencies;
  let peAgenciesReferential: InMemoryPeAgenciesReferential;
  let agencyRepository: InMemoryAgencyRepository;
  let uuid: TestUuidGenerator;

  beforeEach(() => {
    peAgenciesReferential = new InMemoryPeAgenciesReferential();
    agencyRepository = new InMemoryAgencyRepository();
    uuid = new TestUuidGenerator();
    updateAllPeAgencies = new UpdateAllPeAgencies(
      peAgenciesReferential,
      agencyRepository,
      adminMail,
      uuid,
      new ConsoleAppLogger(),
    );
  });

  it("should save agencies which have never been saved", async () => {
    peAgenciesReferential.setPeAgencies([peReferentialAgency]);
    agencyRepository.setAgencies([]);
    uuid.setNextUuid("some-uuid");
    await updateAllPeAgencies.execute();
    expectTypeToMatchAndEqual(agencyRepository.agencies, [
      {
        id: "some-uuid",
        name: "Agence Pôle emploi MOLSHEIM",
        counsellorEmails: [],
        validatorEmails: ["molsheim@pole-emploi.fr"],
        adminEmails: [adminMail],
        address: "16 b RUE Gaston Romazzotti, 67120 MOLSHEIM",
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

  describe("Agency already exists, should add the new emails, siret, code and replaces the adresse and position", () => {
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
        address: "16B RUE Gaston Romazzotti, 67120 Molsheim",
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
          address: "16 b RUE Gaston Romazzotti, 67120 MOLSHEIM",
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
        address: "16B RUE Gaston Romazzotti, 67120 Molsheim",
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
          address: "16 b RUE Gaston Romazzotti, 67120 MOLSHEIM",
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
        address: "16B RUE Gaston Romazzotti, 67120 Molsheim",
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
          address: "16 b RUE Gaston Romazzotti, 67120 MOLSHEIM",
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

  it("if existing agency is not of kind pole-emploi or is of kind 'from-api-PE' it should not be considered, and a new one should be created", async () => {
    peAgenciesReferential.setPeAgencies([peReferentialAgency]);
    const initialAgency: AgencyDto = {
      id: "some-uuid",
      name: "Agence Pôle emploi Molsheim",
      counsellorEmails: [],
      validatorEmails: ["existing@mail.com"],
      adminEmails: ["someAdmin@mail.com"],
      address: "16B RUE Gaston Romazzotti, 67120 Molsheim",
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
    await updateAllPeAgencies.execute();

    expectTypeToMatchAndEqual(agencyRepository.agencies, [
      initialAgency,
      {
        id: "other-uuid",
        name: "Agence Pôle emploi MOLSHEIM",
        counsellorEmails: [],
        validatorEmails: ["molsheim@pole-emploi.fr"],
        adminEmails: [adminMail],
        address: "16 b RUE Gaston Romazzotti, 67120 MOLSHEIM",
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
