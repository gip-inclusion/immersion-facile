import {
  captureAddressGroups,
  inferDepartmentCode,
} from "shared/src/utils/address";

describe("address", () => {
  it("captureAddressGroups should match address postalCode and city groups", () => {
    const capturedAddressGroups = captureAddressGroups(
      "91 RUE DE LA REPUBLIQUE, 97438 SAINTE-MARIE",
    );
    expect(capturedAddressGroups).toStrictEqual({
      address: "91 RUE DE LA REPUBLIQUE",
      postalCode: "97438",
      city: "SAINTE-MARIE",
      validAddress: true,
    });
  });
  it("infers the department code", () => {
    expect(inferDepartmentCode("75017")).toBe("75");
    expect(inferDepartmentCode("97187")).toBe("971");
  });
});
