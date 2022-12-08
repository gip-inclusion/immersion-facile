import {
  Beneficiary,
  BeneficiaryRepresentative,
} from "../convention/convention.dto";
import { displayEmergencyContactInfos } from "./beneficiary";

describe("Beneficiary utils", () => {
  it("should display correctly emergency contact infos", () => {
    const beneficiary: Partial<Beneficiary> = {
      emergencyContact: "Jean Aimarre",
      emergencyContactEmail: "jean.aimarre@mail.com",
      emergencyContactPhone: "0610502021",
    };
    const beneficiaryRepresentative: Partial<BeneficiaryRepresentative> = {
      firstName: "Thierry",
      lastName: "Aulait",
      email: "thierry.aulait@mail.com",
      phone: "0610502025",
    };
    const expected = null;
    expect(
      displayEmergencyContactInfos({
        beneficiary,
        beneficiaryRepresentative,
      }),
    ).toEqual(expected);
  });
});
