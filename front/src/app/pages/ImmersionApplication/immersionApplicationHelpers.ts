import { addDays, startOfToday } from "date-fns";
import { immersionApplicationGateway } from "src/app/config/dependencies";
import {
  ImmersionApplicationPageRoute,
  ImmersionApplicationPresentation,
} from "src/app/pages/ImmersionApplication/ImmersionApplicationPage";
import { ImmersionApplicationUkrainePageRoute } from "src/app/pages/ImmersionApplication/ImmersionApplicationPageForUkraine";
import { ENV } from "src/environmentVariables";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
} from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import { emptySchedule } from "src/shared/ScheduleSchema";
import { toDateString } from "src/shared/utils/date";
import { v4 as uuidV4 } from "uuid";

const { frontEnvType } = ENV;

export const createOrUpdateImmersionApplication = async (
  properties: { jwt?: string; demandeId?: string },
  immersionApplication: ImmersionApplicationDto,
): Promise<void> => {
  const currentJWT = properties.jwt ?? "";

  currentJWT.length > 0
    ? await immersionApplicationGateway.updateMagicLink(
        immersionApplication,
        currentJWT,
      )
    : await immersionApplicationGateway.add(immersionApplication);
};

export const isImmersionApplicationFrozen = (
  immersionApplication: Partial<ImmersionApplicationDto>,
): boolean =>
  !immersionApplication.status || immersionApplication.status !== "DRAFT";

export const undefinedIfEmptyString = (text?: string): string | undefined =>
  text || undefined;

export const immersionApplicationInitialValuesFromUrl = ({
  params,
}:
  | ImmersionApplicationPageRoute
  | ImmersionApplicationUkrainePageRoute): ImmersionApplicationPresentation => {
  const emptyForm = {
    id: uuidV4(),
    status: "DRAFT" as ApplicationStatus,
    dateSubmission: toDateString(startOfToday()),

    // Participant
    email: params.email ?? "",
    firstName: params.firstName ?? "",
    lastName: params.lastName ?? "",
    phone: params.phone ?? "",
    postalCode: params.postalCode ?? "",
    emergencyContact: params.emergencyContact ?? "",
    emergencyContactPhone: params.emergencyContactPhone ?? "",

    dateStart: params.dateStart ?? toDateString(addDays(startOfToday(), 2)),
    dateEnd: params.dateEnd ?? toDateString(addDays(startOfToday(), 3)),
    peExternalId: params.peExternalId ?? undefined,

    // Enterprise
    siret: params.siret ?? "",
    businessName: params.businessName ?? "",
    mentor: params.mentor ?? "",
    mentorPhone: params.mentorPhone ?? "",
    mentorEmail: params.mentorEmail ?? "",
    schedule: params.schedule ?? emptySchedule,
    immersionAddress: params.immersionAddress ?? "",
    agencyId: params.agencyId ?? undefined,
    workConditions: params.workConditions ?? "",

    // Covid
    individualProtection: params.individualProtection ?? undefined,
    sanitaryPrevention: params.sanitaryPrevention ?? undefined,
    sanitaryPreventionDescription: params.sanitaryPreventionDescription ?? "",

    // Immersion
    immersionObjective: params.immersionObjective ?? "",
    immersionAppellation: params.immersionAppellation,
    immersionActivities: params.immersionActivities ?? "",
    immersionSkills: params.immersionSkills ?? "",

    // Signatures
    beneficiaryAccepted: false,
    enterpriseAccepted: false,
  };
  if (frontEnvType === "DEV") return devPrefilledValues(emptyForm);
  return emptyForm;
};

const devPrefilledValues = (
  emptyForm: ImmersionApplicationPresentation,
): ImmersionApplicationPresentation => ({
  ...emptyForm,
  // Participant
  email: emptyForm.email || "sylvanie@monemail.fr",
  firstName: emptyForm.firstName || "Sylvanie",
  lastName: emptyForm.lastName || "Durand",
  phone: emptyForm.phone || "0612345678",
  postalCode: emptyForm.postalCode || "75001",
  emergencyContact: emptyForm.emergencyContact || "Éric Durand",
  emergencyContactPhone: emptyForm.emergencyContactPhone || "0662552607",

  peExternalId: emptyForm.peExternalId || undefined,

  // Enterprise
  siret: emptyForm.siret || "1234567890123",
  businessName: emptyForm.businessName || "Futuroscope",
  mentor: emptyForm.mentor || "Le Mentor du futur",
  mentorPhone: emptyForm.mentorPhone || "0101100110",
  mentorEmail: emptyForm.mentorEmail || "mentor@supermentor.fr",
  immersionAddress:
    emptyForm.immersionAddress ||
    "Societe Du Parc Du Futuroscope PARC DU FUTUROSCOPE 86130 JAUNAY-MARIGNY",
  agencyId: emptyForm.agencyId || "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",

  // Covid
  individualProtection: emptyForm.individualProtection ?? true,
  sanitaryPrevention: emptyForm.sanitaryPrevention ?? true,
  sanitaryPreventionDescription:
    emptyForm.sanitaryPreventionDescription || "Aucunes",

  // Immersion
  immersionObjective: emptyForm.immersionObjective || "",
  immersionAppellation: emptyForm.immersionAppellation || {
    romeLabel: "Boulanger / Boulangère",
    appellationLabel: "Boulangerie",
    romeCode: "D1502",
    appellationCode: "12278",
  },
  immersionActivities: emptyForm.immersionActivities || "Superviser",
  immersionSkills: emptyForm.immersionSkills || "Attention au détail",

  // Signatures
  beneficiaryAccepted: false,
  enterpriseAccepted: false,
});
