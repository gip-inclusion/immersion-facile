import { keys, values } from "ramda";
import { Role } from "../tokens/MagicLinkPayload";
import { DotNestedKeys, ExtractFromExisting } from "../utils";
import {
  ConventionDto,
  ConventionStatus,
  Signatories,
  SignatoryRole,
  signatoryRoles,
} from "./convention.dto";

export const allSignatoriesSigned = (signatories: Signatories) =>
  values(signatories).every((signatory) => !signatory || !!signatory.signedAt);

const getNewStatus = (signatories: Signatories): ConventionStatus => {
  if (allSignatoriesSigned(signatories)) return "IN_REVIEW";
  return "PARTIALLY_SIGNED";
};

const updateSignatoriesOnSignature = (
  signatories: Signatories,
  role: SignatoryRole,
  signedAt: string,
): Signatories => {
  switch (role) {
    case "beneficiary":
      return {
        ...signatories,
        beneficiary: { ...signatories.beneficiary, signedAt },
      };

    case "legal-representative":
    case "beneficiary-representative":
      if (!signatories.beneficiaryRepresentative)
        throw new Error(
          "There is no beneficiary representative on signatories.",
        );
      return {
        ...signatories,
        beneficiaryRepresentative: {
          ...signatories.beneficiaryRepresentative,
          signedAt,
        },
      };
    case "establishment":
    case "establishment-representative":
      return {
        ...signatories,
        establishmentRepresentative: {
          ...signatories.establishmentRepresentative,
          signedAt,
        },
      };
    default: {
      const keyOfRole = keys(signatories).find(
        (signatoryKey) => signatories[signatoryKey]?.role === role,
      );
      if (!keyOfRole) return signatories; // ToDo : throw Forbidden Error
      return {
        ...signatories,
        beneficiary: signatories.beneficiary,
        establishmentRepresentative: signatories.establishmentRepresentative,
        [keyOfRole]: { ...signatories[keyOfRole], signedAt },
      };
    }
  }
};

// Returns an application signed by provided roles.
export const signConventionDtoWithRole = (
  convention: ConventionDto,
  role: SignatoryRole,
  signedAt: string,
): ConventionDto => {
  const updatedSignatories = updateSignatoriesOnSignature(
    convention.signatories,
    role,
    signedAt,
  );

  return {
    ...convention,
    signatories: updatedSignatories,
    status: getNewStatus(updatedSignatories),
  };
};

export const isSignatory = (role: Role): role is SignatoryRole =>
  signatoryRoles.includes(role as SignatoryRole);

export type ConventionField = DotNestedKeys<ConventionDto>;

export const getConventionFieldName = (name: DotNestedKeys<ConventionDto>) =>
  name;

type SignatoryField = ExtractFromExisting<keyof ConventionDto, "signatories">;

export const getSignatoryKey = (
  v: `${SignatoryField}.${keyof ConventionDto["signatories"]}`,
) => v;

export const isEstablishmentTutorIsEstablishmentRepresentative = (
  convention: Pick<ConventionDto, "signatories" | "establishmentTutor">,
): boolean => {
  const establishmentTutor = convention.establishmentTutor;
  const establishmentRepresentative =
    convention.signatories.establishmentRepresentative;

  return (
    establishmentTutor.firstName === establishmentRepresentative.firstName &&
    establishmentTutor.lastName === establishmentRepresentative.lastName &&
    establishmentTutor.email === establishmentRepresentative.email &&
    establishmentTutor.phone === establishmentRepresentative.phone
  );
};

export const isBeneficiaryMinor = (
  convention: Pick<ConventionDto, "signatories">,
): boolean => !!convention.signatories.beneficiaryRepresentative;
