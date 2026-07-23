import {
  addressDtoToString,
  type CaptureAddressGroupsResult,
  captureAddressGroups,
  inferDepartmentCode,
} from "../utils/address";

describe("address", () => {
  it("captureAddressGroups should match address postalCode and city groups", () => {
    const capturedAddressGroups = captureAddressGroups(
      "91 RUE DE LA REPUBLIQUE, 97438 SAINTE-MARIE",
    );
    expect(capturedAddressGroups).toStrictEqual({
      address: "91 RUE DE LA REPUBLIQUE",
      postalCode: "97438",
      city: "SAINTE-MARIE",
    });
  });

  it("infers the department code", () => {
    expect(inferDepartmentCode("75017")).toBe("75");
    expect(inferDepartmentCode("97187")).toBe("971");
  });

  it("captureAddressGroups should match any address", () => {
    for (const address in expectedGroups) {
      const capturedAddressGroups = captureAddressGroups(address);
      expect(capturedAddressGroups).toStrictEqual(expectedGroups[address]);
    }
  });

  describe("addressDtoToString", () => {
    it("formats a complete address", () => {
      expect(
        addressDtoToString({
          streetNumberAndAddress: "1 rue de Rivoli",
          postcode: "75001",
          city: "Paris",
          departmentCode: "75",
        }),
      ).toBe("1 rue de Rivoli 75001 Paris");
    });

    it("omits street when streetNumberAndAddress is empty", () => {
      expect(
        addressDtoToString({
          streetNumberAndAddress: "",
          postcode: "75001",
          city: "Paris",
          departmentCode: "75",
        }),
      ).toBe("75001 Paris");
    });

    it("omits street when streetNumberAndAddress equals city", () => {
      expect(
        addressDtoToString({
          streetNumberAndAddress: "Paris",
          postcode: "75001",
          city: "Paris",
          departmentCode: "75",
        }),
      ).toBe("75001 Paris");
    });

    it("appends country when present", () => {
      expect(
        addressDtoToString({
          streetNumberAndAddress: "1 rue de Rivoli",
          postcode: "75001",
          city: "Paris",
          departmentCode: "75",
          countryCode: "FR",
        }),
      ).toBe("1 rue de Rivoli 75001 Paris, France");
    });
  });
});

const expectedGroups: Record<string, CaptureAddressGroupsResult> = {
  "97438 SAINTE-MARIE": {
    address: "",
    postalCode: "97438",
    city: "SAINTE-MARIE",
  },

  "Service des ressources humaines, 33 BOULEVARD DE L EUROPE, 13127 VITROLLES":
    {
      address: "Service des ressources humaines, 33 BOULEVARD DE L EUROPE",
      postalCode: "13127",
      city: "VITROLLES",
    },
};
