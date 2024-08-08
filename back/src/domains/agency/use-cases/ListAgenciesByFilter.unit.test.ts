import { AddressDto, AgencyDtoBuilder, expectToEqual } from "shared";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import {
  ListAgencyOptionsByFilter,
  toAgencyOption,
} from "./ListAgenciesByFilter";

const parisAddress: AddressDto = {
  city: "Paris",
  departmentCode: "75",
  postcode: "75001",
  streetNumberAndAddress: "OSEF",
};
const cergyAddress: AddressDto = {
  city: "Cergy",
  departmentCode: "95",
  postcode: "95000",
  streetNumberAndAddress: "OSEF",
};
const uzercheAddress: AddressDto = {
  city: "Uzerche",
  departmentCode: "19",
  postcode: "19140",
  streetNumberAndAddress: "OSEF",
};

const otherAgencyInParis = new AgencyDtoBuilder()
  .withId("0")
  .withName("Agence autre 0")
  .withKind("autre")
  .withAddress(parisAddress)
  .build();
const cciAgency1InCergy = new AgencyDtoBuilder()
  .withId("1")
  .withName("Agence CCI 1")
  .withKind("cci")
  .withAddress(cergyAddress)
  .build();
const cciAgency2InParis = new AgencyDtoBuilder()
  .withId("2")
  .withName("Agence CCI 2")
  .withAddress(parisAddress)
  .withKind("cci")
  .build();
const peAgency1InParis = new AgencyDtoBuilder()
  .withId("3")
  .withName("Agence PE 3")
  .withKind("pole-emploi")
  .withAddress(parisAddress)
  .build();
const peAgency2InParis = new AgencyDtoBuilder()
  .withId("4")
  .withName("Agence PE 4")
  .withKind("pole-emploi")
  .withAddress(parisAddress)
  .build();
const otherAgencyWithRefersToInCergy = new AgencyDtoBuilder()
  .withRefersToAgencyId(peAgency2InParis.id)
  .withId("5")
  .withName("Agence avec refersTo")
  .withAddress(cergyAddress)
  .build();
const agencyWithSiret = new AgencyDtoBuilder()
  .withId("6")
  .withName("Agence avec Siret")
  .withKind("autre")
  .withAddress(uzercheAddress)
  .withAgencySiret("11122233344455")
  .build();

const agencyChambreAgriculture = new AgencyDtoBuilder()
  .withId("7")
  .withName("Agence chambre d'agriculture")
  .withKind("chambre-agriculture")
  .build();

const agencyCma = new AgencyDtoBuilder()
  .withId("8")
  .withName("Agency CMA")
  .withKind("cma")
  .build();

const allAgencies = [
  otherAgencyInParis,
  cciAgency1InCergy,
  cciAgency2InParis,
  peAgency1InParis,
  peAgency2InParis,
  otherAgencyWithRefersToInCergy,
  agencyWithSiret,
  agencyChambreAgriculture,
  agencyCma,
];

describe("Query: List agencies by filter", () => {
  let listAgencyOptionsByFilter: ListAgencyOptionsByFilter;

  beforeEach(() => {
    const uow = createInMemoryUow();
    listAgencyOptionsByFilter = new ListAgencyOptionsByFilter(
      new InMemoryUowPerformer(uow),
    );
    uow.agencyRepository.setAgencies(allAgencies);
  });

  describe("No filters", () => {
    it("List all agencies", async () => {
      const result = await listAgencyOptionsByFilter.execute({}, undefined);
      expectToEqual(result, allAgencies.map(toAgencyOption));
    });
  });

  describe("With Agency kind filter", () => {
    it("List miniStageOnly agencies", async () => {
      expectToEqual(
        await listAgencyOptionsByFilter.execute(
          { kind: "miniStageOnly" },
          undefined,
        ),
        [
          cciAgency1InCergy,
          cciAgency2InParis,
          agencyChambreAgriculture,
          agencyCma,
        ].map(toAgencyOption),
      );
    });

    it("List immersionPeOnly agencies", async () => {
      expectToEqual(
        await listAgencyOptionsByFilter.execute(
          { kind: "immersionPeOnly" },
          undefined,
        ),
        [peAgency1InParis, peAgency2InParis].map(toAgencyOption),
      );
    });

    it("List miniStageExcluded agencies", async () => {
      expectToEqual(
        await listAgencyOptionsByFilter.execute(
          { kind: "miniStageExcluded" },
          undefined,
        ),
        [
          otherAgencyInParis,
          peAgency1InParis,
          peAgency2InParis,
          otherAgencyWithRefersToInCergy,
          agencyWithSiret,
        ].map(toAgencyOption),
      );
    });

    it("List withoutRefersToAgency agencies", async () => {
      expectToEqual(
        await listAgencyOptionsByFilter.execute(
          { kind: "withoutRefersToAgency" },
          undefined,
        ),
        allAgencies
          .filter((agency) => agency.refersToAgencyId === null)
          .map(toAgencyOption),
      );
    });

    it("List agencies for given siret", async () => {
      expectToEqual(
        await listAgencyOptionsByFilter.execute(
          { siret: "11122233344455" },
          undefined,
        ),
        [toAgencyOption(agencyWithSiret)],
      );
    });
  });

  describe("With Agency department code filter", () => {
    it("List agencies with department code 95", async () => {
      expectToEqual(
        await listAgencyOptionsByFilter.execute(
          { departmentCode: "95" },
          undefined,
        ),
        [cciAgency1InCergy, otherAgencyWithRefersToInCergy].map(toAgencyOption),
      );
    });

    it("List agencies with department code 75", async () => {
      expectToEqual(
        await listAgencyOptionsByFilter.execute(
          { departmentCode: "75" },
          undefined,
        ),
        [
          otherAgencyInParis,
          cciAgency2InParis,
          peAgency1InParis,
          peAgency2InParis,
        ].map(toAgencyOption),
      );
    });

    it("List agencies with department code 78", async () => {
      expectToEqual(
        await listAgencyOptionsByFilter.execute(
          { departmentCode: "78" },
          undefined,
        ),
        [].map(toAgencyOption),
      );
    });
  });

  describe("With Agency name", () => {
    it("List agencies with name 'PE'", async () => {
      expectToEqual(
        await listAgencyOptionsByFilter.execute(
          { nameIncludes: "PE" },
          undefined,
        ),
        [peAgency1InParis, peAgency2InParis].map(toAgencyOption),
      );
    });

    it("List agencies with name 'Agence'", async () => {
      expectToEqual(
        await listAgencyOptionsByFilter.execute(
          { nameIncludes: "Agence" },
          undefined,
        ),
        allAgencies
          .filter((agency) => agency.id !== agencyCma.id)
          .map(toAgencyOption),
      );
    });

    it("List agencies with name 'TOTO'", async () => {
      expectToEqual(
        await listAgencyOptionsByFilter.execute(
          { nameIncludes: "TOTO" },
          undefined,
        ),
        [].map(toAgencyOption),
      );
    });
  });
});
