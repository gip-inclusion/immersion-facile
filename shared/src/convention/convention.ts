import { keys, values } from "ramda";
import { reasonableSchedule } from "../schedule/ScheduleUtils";
import { Role } from "../tokens/MagicLinkPayload";
import { DotNestedKeys } from "../utils";
import {
  Beneficiary,
  ConventionDto,
  ConventionStatus,
  Mentor,
  Signatories,
  SignatoryRole,
  signatoryRoles,
} from "./convention.dto";

export const allSignatoriesSigned = (signatories: Signatories) =>
  values(signatories).every((signatory) => !signatory || !!signatory?.signedAt);

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
    case "establishment":
      return {
        ...signatories,
        mentor: { ...signatories.mentor, signedAt },
      };
    default: {
      const keyOfRole = keys(signatories).find(
        (signatoryKey) => signatories[signatoryKey]?.role === role,
      );
      if (!keyOfRole) return signatories; // ToDo : throw Forbidden Error
      return {
        ...signatories,
        beneficiary: signatories.beneficiary,
        mentor: signatories.mentor,
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

  const status = getNewStatus(updatedSignatories);

  return {
    ...convention,
    signatories: updatedSignatories,
    status,
  };
};

export const isSignatory = (role: Role): role is SignatoryRole =>
  signatoryRoles.includes(role as SignatoryRole);

const beneficiary: Beneficiary = {
  role: "beneficiary",
  email: "esteban@ocon.fr",
  phone: "+33012345678",
  firstName: "Esteban",
  lastName: "Ocon",
  signedAt: "2022-01-05T12:00:00.000000",
  emergencyContact: "Camille Dumaître",
  emergencyContactPhone: "0601020202",
};

const mentor: Mentor = {
  role: "establishment",
  email: "alain@prost.fr",
  phone: "0601010101",
  firstName: "Alain",
  lastName: "Prost",
  signedAt: "2022-01-05T12:00:00.000000",
  job: "Big Boss",
};

// USED IN FRONT DO NOT DELETE !
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const IMMERSION_APPLICATION_TEMPLATE: ConventionDto = {
  id: "fake-test-id",
  externalId: "00000000001",
  status: "DRAFT",
  postalCode: "75000",
  agencyId: "fake-agency-id",
  dateSubmission: "2021-07-01",
  dateStart: "2021-08-01",
  dateEnd: "2021-08-31",
  dateValidation: "2021-08-05",
  businessName: "Beta.gouv.fr",
  siret: "12345678901234",
  schedule: reasonableSchedule({
    start: new Date("2021-08-01"),
    end: new Date("2021-08-31"),
  }),
  workConditions: undefined,
  immersionAddress: "75001 Centre du monde",
  individualProtection: true,
  sanitaryPrevention: true,
  sanitaryPreventionDescription: "fourniture de gel",
  immersionObjective: "Confirmer un projet professionnel",
  immersionAppellation: {
    romeLabel: "Conduite d'équipement de formage et découpage des matériaux",
    romeCode: "H2905",
    appellationCode: "12922",
    appellationLabel: "Conducteur / Conductrice de cisaille",
  },
  immersionActivities: "Piloter une cisaille",
  immersionSkills: "Utilisation des pneus optimale, gestion de carburant",
  internshipKind: "immersion",
  signatories: { beneficiary, mentor },
};

export type ConventionField = DotNestedKeys<ConventionDto>;

export const getConventionFieldName = (name: DotNestedKeys<ConventionDto>) =>
  name;
