import { path, pathEq } from "./path";
import { expectTypeToMatchAndEqual } from "../test.helpers";

type Address = {
  postCode: string;
  street: {
    floor: number;
    lines: [string, string | undefined];
  };
};

type UserInfo = {
  address: Address;
  previousAddress?: Address;
};

const data: UserInfo = {
  address: {
    postCode: "SW1P 3PA",
    street: {
      floor: 3,
      lines: ["20 Deans Yd", undefined],
    },
  },
};

describe("path", () => {
  it("returns undefined when no value matches path", () => {
    const wrong = path("wrong.path", data);
    expect(wrong).toBeUndefined();
  });

  it("gets the value at the path", () => {
    const address = path("address", data);
    expectTypeToMatchAndEqual(address, data.address);

    const street = path("address.street", data);
    expectTypeToMatchAndEqual(street, data.address.street);

    const line = path("address.street.lines.0", data);
    expectTypeToMatchAndEqual(line, data.address.street.lines[0]);
  });

  it("supports optional values", () => {
    const street = path("previousAddress.street", data);
    expect(street).toBeUndefined();
  });

  it("gets the value at the path, and supports curring", () => {
    const getAddress = path<"address", UserInfo>("address");
    const value = getAddress(data);
    expectTypeToMatchAndEqual(value, data.address);
  });
});

describe("pathEq", () => {
  it("returns undefined when no value matches path", () => {
    const wrong = pathEq("wrong.path", undefined, data);
    expect(wrong).toBe(true);
  });

  it("checks if the value at path matches given one", () => {
    const areNotEqual = pathEq("address.street.floor", 2, data);
    expectTypeToMatchAndEqual(areNotEqual, false);

    const areEqual = pathEq("address.street.floor", 3, data);
    expectTypeToMatchAndEqual(areEqual, true);
  });

  it("supports optional values", () => {
    const areEqual = pathEq("previousAddress.street.floor", 10, data);
    expectTypeToMatchAndEqual(areEqual, false);
  });

  it("gets the value at the path, and supports curring", () => {
    const areNumberEqual = pathEq<"address.street.floor", UserInfo>(
      "address.street.floor",
      3,
    );
    expectTypeToMatchAndEqual(areNumberEqual(data), true);
  });
});
