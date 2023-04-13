import { filter, join } from "ramda";
import {
  Beneficiary,
  BeneficiaryRepresentative,
  InternshipKind,
} from "../convention/convention.dto";
import { pipeWithValue } from "../pipeWithValue";

const isTruthy = <T>(t: T | null | undefined): t is T => !!t;

const getEmergencyContactInfos = ({
  fullName,
  phone,
  email,
}: {
  fullName?: string;
  phone?: string;
  email?: string;
}) => {
  const emailAndPhone = pipeWithValue(
    [phone, email],
    filter<string | undefined>(isTruthy),
    join(" - "),
    (str: string | undefined) => (str ? `(${str})` : ""),
  );

  return [fullName, emailAndPhone].join(" ");
};

export const displayEmergencyContactInfos = <T extends InternshipKind>({
  beneficiary,
  beneficiaryRepresentative,
}: {
  beneficiaryRepresentative?: Partial<BeneficiaryRepresentative>;
  beneficiary: Partial<Beneficiary<T>>;
}) =>
  beneficiaryRepresentative
    ? getEmergencyContactInfos({
        fullName: `${beneficiaryRepresentative.firstName} ${beneficiaryRepresentative.lastName}`,
        email: beneficiaryRepresentative.email,
        phone: beneficiaryRepresentative.phone,
      })
    : getEmergencyContactInfos({
        fullName: beneficiary.emergencyContact,
        email: beneficiary.emergencyContactEmail,
        phone: beneficiary.emergencyContactPhone,
      });
