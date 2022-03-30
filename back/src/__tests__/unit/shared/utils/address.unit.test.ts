import { captureAddressGroups } from "../../../../shared/utils/address";

describe("address", () => {
  it("captureAddressGroups should match address postalCode and city groups", () => {
    const capturedAddressGroups = captureAddressGroups(
      "91 RUE DE LA REPUBLIQUE, 97438 SAINTE-MARIE",
    );
    expect(capturedAddressGroups).toStrictEqual({
      address: "91 RUE DE LA REPUBLIQUE,",
      postalCode: "97438",
      city: "SAINTE-MARIE",
      validAddress: true,
    });
  });
});
