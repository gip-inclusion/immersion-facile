import { addDays, startOfToday } from "date-fns";
import {
  ConventionDto,
  ConventionId,
  ConventionStatus,
  ImmersionObjective,
  InternshipKind,
} from "shared/src/convention/convention.dto";
import { FederatedIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { toDateString } from "shared/src/utils/date";
import { mergeObjectsExceptFalsyValues } from "shared/src/utils/mergeObjectsExpectFalsyValues";
import { reasonableSchedule } from "shared/src/schedule/ScheduleUtils";
import {
  conventionGateway,
  deviceRepository,
} from "src/app/config/dependencies";
import {
  ConventionPageRoute,
  ConventionPresentation,
} from "src/app/pages/Convention/ConventionPage";
import { ConventionUkrainePageRoute } from "src/app/pages/Convention/ConventionPageForUkraine";
import { ENV } from "src/environmentVariables";
import { v4 as uuidV4 } from "uuid";

const { frontEnvType } = ENV;

export const createOrUpdateConvention = async (
  properties: { jwt?: string; demandeId?: string },
  convention: ConventionDto,
): Promise<void> => {
  const currentJWT = properties.jwt ?? "";

  currentJWT.length > 0
    ? await conventionGateway.updateMagicLink(convention, currentJWT)
    : await conventionGateway.add(convention);
};

export const isConventionFrozen = (
  convention: Partial<ConventionDto>,
): boolean => !convention.status || convention.status !== "DRAFT";

export const undefinedIfEmptyString = (text?: string): string | undefined =>
  text || undefined;

export const conventionInitialValuesFromUrl = (
  route: ConventionPageRoute | ConventionUkrainePageRoute,
): ConventionPresentation => {
  const internshipKind: InternshipKind = "immersion"; // This will depend on the route

  const dataFromDevice = deviceRepository.get("partialConvention") ?? {};

  const params = mergeObjectsExceptFalsyValues(
    dataFromDevice,
    route.params as Partial<ConventionPresentation>,
  );

  const dateStart =
    params.dateStart ?? toDateString(addDays(startOfToday(), 2));
  const dateEnd = params.dateEnd ?? toDateString(addDays(startOfToday(), 3));
  const initialFormWithStoredAndUrlParams: ConventionPresentation & {
    id: ConventionId;
  } = {
    id: uuidV4(),
    status: "DRAFT" as ConventionStatus,
    dateSubmission: toDateString(startOfToday()),

    //Federated Identity
    signatories: {
      beneficiary:
        {
           federatedIdentity: params.federatedIdentity as FederatedIdentity| undefined,
           signedAt: null
        },
      mentor: {
        firstName: params.mentor
        mentor: params.mentor ?? "",
        mentorPhone: params.mentorPhone ?? "",
        mentorEmail: params.mentorEmail ?? "",
      }
    }

    // Participant
    email: params.email ?? "",
    firstName: params.firstName ?? "",
    lastName: params.lastName ?? "",
    phone: params.phone ?? "",
    postalCode: params.postalCode ?? "",
    emergencyContact: params.emergencyContact ?? "",
    emergencyContactPhone: params.emergencyContactPhone ?? "",

    dateStart,
    dateEnd,

    // Enterprise
    siret: params.siret ?? "",
    businessName: params.businessName ?? "",
    mentor: params.mentor ?? "",
    mentorPhone: params.mentorPhone ?? "",
    mentorEmail: params.mentorEmail ?? "",
    schedule:
      params.schedule ??
      reasonableSchedule({
        start: new Date(dateStart),
        end: new Date(dateEnd),
      }),
    immersionAddress: params.immersionAddress ?? "",
    agencyId: params.agencyId ?? undefined,
    workConditions: params.workConditions ?? "",

    // Covid
    individualProtection: params.individualProtection ?? undefined,
    sanitaryPrevention: params.sanitaryPrevention ?? undefined,
    sanitaryPreventionDescription: params.sanitaryPreventionDescription ?? "",

    // Immersion
    immersionObjective: params.immersionObjective as
      | ImmersionObjective
      | undefined,
    immersionAppellation: params.immersionAppellation,
    immersionActivities: params.immersionActivities ?? "",
    immersionSkills: params.immersionSkills ?? "",

    // Signatures
    beneficiaryAccepted: false,
    enterpriseAccepted: false,

    // Kind
    internshipKind,
  };

  if (frontEnvType === "DEV" && ENV.PREFILLED_FORMS)
    return devPrefilledValues(initialFormWithStoredAndUrlParams);

  return initialFormWithStoredAndUrlParams;
};

const devPrefilledValues = (
  emptyForm: ConventionPresentation,
): ConventionPresentation => ({
  ...emptyForm,

  // Participant
  email: emptyForm.email || "sylvanie@monemail.fr",
  firstName: emptyForm.firstName || "Sylvanie",
  lastName: emptyForm.lastName || "Durand",
  phone: emptyForm.phone || "0612345678",
  postalCode: emptyForm.postalCode || "75001",
  emergencyContact: emptyForm.emergencyContact || "Éric Durand",
  emergencyContactPhone: emptyForm.emergencyContactPhone || "0662552607",

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
  immersionObjective: emptyForm.immersionObjective,
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
