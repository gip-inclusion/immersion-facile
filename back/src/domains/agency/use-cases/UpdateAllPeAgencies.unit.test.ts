import { AddressDto, AgencyDto, expectToEqual } from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { InMemoryAddressGateway } from "../../core/address/adapters/InMemoryAddressGateway";
import { ConsoleAppLogger } from "../../core/app-logger/adapters/ConsoleAppLogger";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { PeAgencyFromReferenciel } from "../../establishment/ports/PeAgenciesReferential";
import { InMemoryPeAgenciesReferential } from "../adapters/pe-agencies-referential/InMemoryPeAgenciesReferential";
import { UpdateAllPeAgencies } from "./UpdateAllPeAgencies";

describe("UpdateAllPeAgencies use case", () => {
  let updateAllPeAgencies: UpdateAllPeAgencies;
  let peAgenciesReferential: InMemoryPeAgenciesReferential;
  let uow: InMemoryUnitOfWork;
  let uuidGenerator: TestUuidGenerator;
  let addressApi: InMemoryAddressGateway;
  let timeGateway: CustomTimeGateway;

  const address: AddressDto = {
    city: "Molsheim",
    departmentCode: "67",
    postcode: "67120",
    streetNumberAndAddress: "6B RUE Gaston Romazzotti",
  };

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

  beforeEach(() => {
    uow = createInMemoryUow();
    peAgenciesReferential = new InMemoryPeAgenciesReferential();
    uuidGenerator = new TestUuidGenerator();
    addressApi = new InMemoryAddressGateway();
    timeGateway = new CustomTimeGateway();
    updateAllPeAgencies = new UpdateAllPeAgencies(
      new InMemoryUowPerformer(uow),
      peAgenciesReferential,
      addressApi,
      uuidGenerator,
      new ConsoleAppLogger(),
      timeGateway,
    );
    uuidGenerator.setNextUuids(["other-uuid", "another-one"]);
  });

  it("should save agencies which have never been saved", async () => {
    peAgenciesReferential.setPeAgencies([peReferentialAgency]);
    uow.agencyRepository.setAgencies([]);
    addressApi.setNextAddress(address);

    await updateAllPeAgencies.execute();

    expectToEqual(uow.agencyRepository.agencies, [
      toAgencyWithRights({
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
      }),
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

      uow.agencyRepository.setAgencies([toAgencyWithRights(initialAgency)]);

      await updateAllPeAgencies.execute();

      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights({
          ...initialAgency,
          validatorEmails: [commonEmail],
          address,
          position: {
            lon: 7.511,
            lat: 48.532571,
          },
          agencySiret: "13000548120984",
          codeSafir: "63019",
        }),
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

      uow.agencyRepository.setAgencies([toAgencyWithRights(initialAgency)]);

      await updateAllPeAgencies.execute();

      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights({
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
        }),
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

      uow.agencyRepository.setAgencies([toAgencyWithRights(initialAgency)]);

      await updateAllPeAgencies.execute();

      expectToEqual(uow.userRepository.users, []);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights({
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
        }),
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

    uow.agencyRepository.setAgencies([toAgencyWithRights(initialAgency)]);
    addressApi.setNextAddress(address);

    await updateAllPeAgencies.execute();

    expectToEqual(uow.userRepository.users, [
      {
        createdAt: timeGateway.now().toISOString(),
        email: "molsheim@pole-emploi.fr",
        externalId: null,
        firstName: "",
        id: "another-one",
        lastName: "",
      },
    ]);
    expectToEqual(uow.agencyRepository.agencies, [
      toAgencyWithRights(initialAgency),
      toAgencyWithRights(
        {
          id: "other-uuid",
          name: "Agence Pôle emploi MOLSHEIM",
          counsellorEmails: [],
          validatorEmails: [],
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
          refersToAgencyName: null,
          refersToAgencyId: null,
          rejectionJustification: null,
        },
        { "another-one": { isNotifiedByEmail: false, roles: ["validator"] } },
      ),
    ]);
  });
});
