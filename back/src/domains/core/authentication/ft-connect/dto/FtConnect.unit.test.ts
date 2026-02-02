import { expectToEqual } from "shared";
import { ftconnectBeneficiaryBirthdateToIfBeneficiaryBirthdate } from "./FtConnect.dto";

describe("ftconnectBeneficiaryBirthdateToIfBeneficiaryBirthdate", () => {
  it("returns UTC date for ISO UTC datetime", () => {
    expectToEqual(
      ftconnectBeneficiaryBirthdateToIfBeneficiaryBirthdate(
        "1990-05-15T12:30:00.000Z",
      ),
      "1990-05-15",
    );
  });

  it("returns UTC date for ISO UTC datetime at midnight in UTC+2", () => {
    expectToEqual(
      ftconnectBeneficiaryBirthdateToIfBeneficiaryBirthdate(
        "1994-06-25T00:00:00+02:00",
      ),
      "1994-06-25",
    );
  });

  it("returns UTC date for ISO UTC datetime at midnight in UTC-5", () => {
    expectToEqual(
      ftconnectBeneficiaryBirthdateToIfBeneficiaryBirthdate(
        "1990-05-15T00:00:00-05:00",
      ),
      "1990-05-15",
    );
  });

  it("throws when given invalid date string", () => {
    expect(() =>
      ftconnectBeneficiaryBirthdateToIfBeneficiaryBirthdate("not-a-date"),
    ).toThrow("Invalid date value");
  });
});
