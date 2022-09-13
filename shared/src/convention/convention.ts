import { reasonableSchedule } from "../schedule/ScheduleUtils";
import { Role } from "../tokens/MagicLinkPayload";
import { DotNestedKeys, ExtractFromExisting } from "../utils";
import {
  Beneficiary,
  ConventionDto,
  ConventionStatus,
  Mentor,
  SignatoryRole,
  signatoryRoles,
} from "./convention.dto";

const getNewStatus = (
  enterpriseAccepted: boolean,
  beneficiaryAccepted: boolean,
): ConventionStatus => {
  if (enterpriseAccepted && beneficiaryAccepted) return "IN_REVIEW";
  if (
    (enterpriseAccepted && !beneficiaryAccepted) ||
    (!enterpriseAccepted && beneficiaryAccepted)
  )
    return "PARTIALLY_SIGNED";
  return "READY_TO_SIGN";
};

// Returns an application signed by provided roles.
export const signConventionDtoWithRole = (
  convention: ConventionDto,
  role: ExtractFromExisting<Role, "beneficiary" | "establishment">,
  signedAt: string,
): ConventionDto => {
  const beneficiary =
    role === "beneficiary"
      ? { ...convention.signatories.beneficiary, signedAt }
      : convention.signatories.beneficiary;
  const mentor =
    role === "establishment"
      ? { ...convention.signatories.mentor, signedAt }
      : convention.signatories.mentor;

  const enterpriseAccepted = !!mentor.signedAt;
  const beneficiaryAccepted = !!beneficiary.signedAt;
  const status = getNewStatus(enterpriseAccepted, beneficiaryAccepted);

  return {
    ...convention,
    signatories: { beneficiary, mentor },
    status,
  };
};

export const isSignatory = (role: Role): role is SignatoryRole => {
  return signatoryRoles.includes(role as SignatoryRole);
};

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
export const getConventionField = (name: DotNestedKeys<ConventionDto>) => name;
