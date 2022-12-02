import {
  AddressDto,
  AgencyDtoBuilder,
  expectTypeToMatchAndEqual,
} from "shared";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { ListAgenciesByFilter, toAgencyOption } from "./ListAgenciesByFilter";

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

describe("Query: List agencies by filter", () => {
  const uow = createInMemoryUow();
  const agencyRepository = uow.agencyRepository;
  const useCase = new ListAgenciesByFilter(new InMemoryUowPerformer(uow));
  const allAgencies = [
    otherAgencyInParis,
    cciAgency1InCergy,
    cciAgency2InParis,
    peAgency1InParis,
    peAgency2InParis,
  ];
  agencyRepository.setAgencies(allAgencies);

  describe("No filters", () => {
    it("List all agencies", async () => {
      const result = await useCase.execute({}, undefined);
      expectTypeToMatchAndEqual(result, allAgencies.map(toAgencyOption));
    });
  });

  describe("With Agency kind filter", () => {
    it("List CCI only agencies", async () => {
      expectTypeToMatchAndEqual(
        await useCase.execute({ kind: "cciOnly" }, undefined),
        [cciAgency1InCergy, cciAgency2InParis].map(toAgencyOption),
      );
    });
    it("List peExcluded agencies", async () => {
      expectTypeToMatchAndEqual(
        await useCase.execute({ kind: "peExcluded" }, undefined),
        [otherAgencyInParis, cciAgency1InCergy, cciAgency2InParis].map(
          toAgencyOption,
        ),
      );
    });
    it("List peOnly agencies", async () => {
      expectTypeToMatchAndEqual(
        await useCase.execute({ kind: "peOnly" }, undefined),
        [peAgency1InParis, peAgency2InParis].map(toAgencyOption),
      );
    });
    it("List cciExcluded agencies", async () => {
      expectTypeToMatchAndEqual(
        await useCase.execute({ kind: "cciExcluded" }, undefined),
        [otherAgencyInParis, peAgency1InParis, peAgency2InParis].map(
          toAgencyOption,
        ),
      );
    });
  });
  describe("With Agency department code filter", () => {
    it("List agencies with department code 95", async () => {
      expectTypeToMatchAndEqual(
        await useCase.execute({ departmentCode: "95" }, undefined),
        [cciAgency1InCergy].map(toAgencyOption),
      );
    });
    it("List agencies with department code 75", async () => {
      expectTypeToMatchAndEqual(
        await useCase.execute({ departmentCode: "75" }, undefined),
        [
          otherAgencyInParis,
          cciAgency2InParis,
          peAgency1InParis,
          peAgency2InParis,
        ].map(toAgencyOption),
      );
    });
    it("List agencies with department code 78", async () => {
      expectTypeToMatchAndEqual(
        await useCase.execute({ departmentCode: "78" }, undefined),
        [].map(toAgencyOption),
      );
    });
  });

  describe("With Agency name", () => {
    it("List agencies with name 'PE'", async () => {
      expectTypeToMatchAndEqual(
        await useCase.execute({ nameIncludes: "PE" }, undefined),
        [peAgency1InParis, peAgency2InParis].map(toAgencyOption),
      );
    });
    it("List agencies with name 'Agence'", async () => {
      expectTypeToMatchAndEqual(
        await useCase.execute({ nameIncludes: "Agence" }, undefined),
        allAgencies.map(toAgencyOption),
      );
    });
    it("List agencies with name 'TOTO'", async () => {
      expectTypeToMatchAndEqual(
        await useCase.execute({ nameIncludes: "TOTO" }, undefined),
        [].map(toAgencyOption),
      );
    });
  });
});
