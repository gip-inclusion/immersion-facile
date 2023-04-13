import { addDays, startOfToday } from "date-fns";
import { v4 as uuidV4 } from "uuid";

import {
  ConventionDto,
  ConventionId,
  ConventionStatus,
  DepartmentCode,
  EstablishmentTutor,
  ImmersionObjective,
  InternshipKind,
  LevelOfEducation,
  mergeObjectsExceptFalsyValues,
  OmitFromExistingKeys,
  PeConnectIdentity,
  reasonableSchedule,
  Signatories,
  toDateString,
} from "shared";

import { ConventionCustomAgencyPageRoute } from "src/app/pages/convention/ConventionCustomAgencyPage";
import { ConventionImmersionPageRoute } from "src/app/pages/convention/ConventionImmersionPage";
import { ConventionMiniStagePageRoute } from "src/app/pages/convention/ConventionMiniStagePage";
import { ConventionImmersionForExternalsRoute } from "src/app/pages/convention/ConventionPageForExternals";
import { ConventionInUrl } from "src/app/routes/route-params";
import { deviceRepository } from "src/config/dependencies";
import { ENV } from "src/config/environmentVariables";

export const isConventionFrozen = (
  status: ConventionStatus | undefined,
): boolean => status !== "DRAFT";

export const undefinedIfEmptyString = (text?: string): string | undefined =>
  text || undefined;

type WithSignatures = {
  signatories: {
    [K in keyof Signatories]: Partial<Signatories[K]>;
  };
};

type WithEstablishmentTutor = {
  establishmentTutor: EstablishmentTutor;
};

type WithAgencyDepartment = {
  agencyDepartment: DepartmentCode;
};

type WithIntershipKind = {
  internshipKind: InternshipKind;
};

export type ConventionPresentation = OmitFromExistingKeys<
  Partial<ConventionDto>,
  "statusJustification"
> &
  WithSignatures &
  WithEstablishmentTutor &
  WithIntershipKind &
  WithAgencyDepartment;

export const conventionInitialValuesFromUrl = ({
  route,
  internshipKind,
}: {
  route:
    | ConventionMiniStagePageRoute
    | ConventionImmersionPageRoute
    | ConventionCustomAgencyPageRoute
    | ConventionImmersionForExternalsRoute;
  internshipKind: InternshipKind;
}): ConventionPresentation => {
  const dataFromDevice = deviceRepository.get("partialConventionInUrl") ?? {};

  const params = mergeObjectsExceptFalsyValues(
    dataFromDevice,
    route.params as Partial<ConventionInUrl>,
  );

  const dateStart =
    params.dateStart ?? toDateString(addDays(startOfToday(), 2));
  const dateEnd = params.dateEnd ?? toDateString(addDays(startOfToday(), 3));

  const areBeneficiaryRepresentativeFieldPresent = !!(
    params.brEmail ||
    params.brPhone ||
    params.brFirstName ||
    params.brLastName
  );

  const areBeneficiaryCurrentEmployerFieldPresent = !!(
    params.bceBusinessName ||
    params.bceSiret ||
    params.bceFirstName ||
    params.bceLastName ||
    params.bceEmail ||
    params.bcePhone ||
    params.bceJob
  );

  const initialFormWithStoredAndUrlParams: ConventionPresentation & {
    id: ConventionId;
  } = {
    id: uuidV4(),
    status: "DRAFT" as ConventionStatus,
    dateSubmission: toDateString(startOfToday()),
    establishmentTutor: {
      role: "establishment-tutor",
      firstName: params.etFirstName ?? "",
      lastName: params.etLastName ?? "",
      email: params.etEmail ?? "",
      phone: params.etPhone ?? "",
      job: params.etJob ?? "",
    },
    signatories: {
      beneficiary: {
        role: "beneficiary",
        firstName: params.firstName ?? "",
        lastName: params.lastName ?? "",
        email: params.email ?? "",
        phone: params.phone ?? "",
        emergencyContact: params.emergencyContact ?? "",
        emergencyContactPhone: params.emergencyContactPhone ?? "",
        emergencyContactEmail: params.emergencyContactEmail ?? "",
        levelOfEducation: (params.led as LevelOfEducation) ?? "",
        financiaryHelp: params.financiaryHelp ?? "",
        birthdate: params.birthdate ?? "",
        ...(params.fedId && params.fedIdProvider
          ? {
              federatedIdentity: {
                provider: params.fedIdProvider as PeConnectIdentity["provider"],
                token: params.fedId,
              },
            }
          : {}),
      },
      establishmentRepresentative: {
        role: "establishment-representative",
        firstName: params.erFirstName ?? "",
        lastName: params.erLastName ?? "",
        email: params.erEmail ?? "",
        phone: params.erPhone ?? "",
      },
      beneficiaryRepresentative: areBeneficiaryRepresentativeFieldPresent
        ? {
            role: "beneficiary-representative",
            firstName: params.brFirstName ?? "",
            lastName: params.brLastName ?? "",
            email: params.brEmail ?? "",
            phone: params.brPhone ?? "",
          }
        : undefined,
      beneficiaryCurrentEmployer: areBeneficiaryCurrentEmployerFieldPresent
        ? {
            businessSiret: params.bceSiret ?? "",
            businessName: params.bceBusinessName ?? "",
            firstName: params.bceFirstName ?? "",
            lastName: params.bceLastName ?? "",
            email: params.bceEmail ?? "",
            phone: params.bcePhone ?? "",
            job: params.bceJob ?? "",
            role: "beneficiary-current-employer",
          }
        : undefined,
    },
    agencyDepartment: params.agencyDepartment ?? "",
    dateStart,
    dateEnd,

    // Enterprise
    siret: params.siret ?? "",
    businessName: params.businessName ?? "",
    schedule:
      params.schedule ??
      reasonableSchedule({
        start: new Date(dateStart),
        end: new Date(dateEnd),
      }),
    immersionAddress: params.immersionAddress ?? "",
    agencyId: params.agencyId ?? undefined,
    workConditions: params.workConditions ?? "",
    businessAdvantages: params.businessAdvantages ?? "",

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

    // Kind
    internshipKind,
  };

  if (ENV.prefilledForms)
    return devPrefilledValues(initialFormWithStoredAndUrlParams);

  return initialFormWithStoredAndUrlParams;
};

const devPrefilledValues = (
  emptyForm: ConventionPresentation,
): ConventionPresentation => {
  const {
    beneficiary,
    beneficiaryRepresentative,
    establishmentRepresentative,
  } = emptyForm.signatories;

  const defaultTutor = {
    firstName: "Joe",
    lastName: "Le tuteur",
    phone: "0101100110",
    email: "establishmentRepresentative@superbusiness.fr",
    job: "Le job du tuteur",
  };

  const tutor = emptyForm.establishmentTutor;

  return {
    ...emptyForm,
    signatories: {
      ...emptyForm.signatories,
      beneficiary: {
        role: "beneficiary",
        firstName: beneficiary.firstName || "Sylvanie",
        lastName: beneficiary.lastName || "Durand",
        email: beneficiary.email || "sylvanie@monemail.fr",
        phone: beneficiary.phone || "0612345678",
        birthdate: beneficiary.birthdate || "1990-02-21T00:00:00.000Z",
        emergencyContact: beneficiary.emergencyContact || "Éric Durand",
        emergencyContactPhone:
          beneficiary.emergencyContactPhone || "0662552607",
        emergencyContactEmail:
          beneficiary.emergencyContactEmail ||
          "eric.durand@emergencycontact.com",
        federatedIdentity: beneficiary.federatedIdentity,
      },
      beneficiaryRepresentative,
      establishmentRepresentative: {
        role: "establishment-representative",
        firstName:
          establishmentRepresentative.firstName || defaultTutor.firstName,
        lastName: establishmentRepresentative.lastName || defaultTutor.lastName,
        phone: establishmentRepresentative.phone || defaultTutor.phone,
        email: establishmentRepresentative.email || defaultTutor.email,
      },
    },
    establishmentTutor: {
      role: "establishment-tutor",
      firstName: tutor.firstName || defaultTutor.firstName,
      lastName: tutor.lastName || defaultTutor.lastName,
      phone: tutor.phone || defaultTutor.phone,
      email: tutor.email || defaultTutor.email,
      job: tutor.job || defaultTutor.job,
    },

    // Participant
    postalCode: emptyForm.postalCode || "75001",

    // Enterprise
    siret: emptyForm.siret || "1234567890123",
    businessName: emptyForm.businessName || "Futuroscope",
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
  };
};
