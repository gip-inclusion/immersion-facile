import {
  Beneficiary,
  BeneficiaryRepresentative,
} from "../convention/convention.dto";
import { displayEmergencyContactInfos } from "./beneficiary";

describe("Beneficiary utils", () => {
  it("should display correctly emergency contact infos with full infos provided", () => {
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
    const expected = "Thierry Aulait (0610502025 - thierry.aulait@mail.com)";
    expect(
      displayEmergencyContactInfos({
        beneficiary,
        beneficiaryRepresentative,
      }),
    ).toEqual(expected);
  });
  it("should display correctly emergency contact infos without phone", () => {
    const beneficiary: Partial<Beneficiary> = {
      emergencyContact: "Jean Aimarre",
      emergencyContactEmail: "jean.aimarre@mail.com",
      emergencyContactPhone: "0610502021",
    };
    const beneficiaryRepresentative: Partial<BeneficiaryRepresentative> = {
      firstName: "Thierry",
      lastName: "Aulait",
      email: "thierry.aulait@mail.com",
    };
    const expected = "Thierry Aulait (thierry.aulait@mail.com)";
    expect(
      displayEmergencyContactInfos({
        beneficiary,
        beneficiaryRepresentative,
      }),
    ).toEqual(expected);
  });
  it("should display correctly emergency contact infos without email", () => {
    const beneficiary: Partial<Beneficiary> = {
      emergencyContact: "Jean Aimarre",
      emergencyContactEmail: "jean.aimarre@mail.com",
      emergencyContactPhone: "0610502021",
    };
    const beneficiaryRepresentative: Partial<BeneficiaryRepresentative> = {
      firstName: "Thierry",
      lastName: "Aulait",
      phone: "0610502025",
    };
    const expected = "Thierry Aulait (0610502025)";
    expect(
      displayEmergencyContactInfos({
        beneficiary,
        beneficiaryRepresentative,
      }),
    ).toEqual(expected);
  });
  it("should display correctly emergency contact infos without beneficiaryRepresentative", () => {
    const beneficiary: Partial<Beneficiary> = {
      emergencyContact: "Jean Aimarre",
      emergencyContactEmail: "jean.aimarre@mail.com",
      emergencyContactPhone: "0610502021",
    };
    const expected = "Jean Aimarre (0610502021 - jean.aimarre@mail.com)";
    expect(
      displayEmergencyContactInfos({
        beneficiary,
      }),
    ).toEqual(expected);
  });
});
