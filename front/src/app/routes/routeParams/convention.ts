import { addDays, startOfToday } from "date-fns";
import {
  type AgencyKind,
  type AppellationAndRomeDto,
  type BeneficiaryCurrentEmployer,
  type BeneficiaryRepresentative,
  type ConventionDraftDto,
  type ConventionDto,
  type ConventionTemplate,
  type CreateConventionPresentationInitialValues,
  type CreateConventionTemplatePresentationInitialValues,
  type DateString,
  type FtConnectIdentity,
  type ImmersionObjective,
  type InternshipKind,
  isFtConnectIdentity,
  type LevelOfEducation,
  reasonableSchedule,
  type ScheduleDto,
  type Signatories,
  type SiretDto,
  toDateUTCString,
} from "shared";
import { ENV } from "src/config/environmentVariables";
import type { FederatedIdentityWithUser } from "src/core-logic/domain/auth/auth.slice";
import { v4 as uuidV4 } from "uuid";

export const makeEmptyConventionInitialValues = ({
  internshipKind,
  agencyDepartment,
  agencyKind,
  agencyId,
  agencyReferentFirstName,
  agencyReferentLastName,
  siret,
  immersionAppellation,
  immersionAddress,
  federatedIdentity,
}: {
  internshipKind: InternshipKind;
  agencyDepartment?: string;
  agencyKind?: AgencyKind;
  agencyId?: string;
  agencyReferentFirstName?: string;
  agencyReferentLastName?: string;
  siret?: SiretDto;
  immersionAppellation?: AppellationAndRomeDto;
  immersionAddress?: string;
  federatedIdentity?: FederatedIdentityWithUser;
}): CreateConventionPresentationInitialValues => {
  const dateStart = new Date();
  const dateEnd = addDays(dateStart, 1);
  const initialForm: CreateConventionPresentationInitialValues = {
    id: uuidV4(),
    agencyDepartment: agencyDepartment,
    agencyKind: agencyKind,
    agencyId: agencyId,
    agencyReferent: {
      firstname: agencyReferentFirstName,
      lastname: agencyReferentLastName,
    },
    dateStart: dateStart.toISOString(),
    dateEnd: dateEnd.toISOString(),
    schedule: reasonableSchedule({
      start: dateStart,
      end: dateEnd,
    }),
    siret,
    immersionAddress: immersionAddress,
    immersionAppellation: immersionAppellation,
    establishmentTutor: {
      role: "establishment-tutor",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      job: "",
    },
    signatories: {
      beneficiary: {
        role: "beneficiary",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        emergencyContact: "",
        emergencyContactPhone: "",
        emergencyContactEmail: "",
        address: undefined,
        schoolName: "",
        schoolPostcode: "",
        financiaryHelp: "",
        birthdate: "",
        isRqth: false,
        federatedIdentity:
          federatedIdentity && isFtConnectIdentity(federatedIdentity)
            ? federatedIdentity
            : undefined,
      },
      establishmentRepresentative: {
        role: "establishment-representative",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      },
      beneficiaryRepresentative: beneficiaryRepresentativeFromParams({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
      }),
      beneficiaryCurrentEmployer: beneficiaryCurrentEmployerFromParams({
        businessName: "",
        businessSiret: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        job: "",
        businessAddress: "",
      }),
    },
    status: "READY_TO_SIGN",
    dateSubmission: toDateUTCString(new Date()),
    internshipKind,
  };

  return ENV.prefilledForms ? withDevPrefilledValues(initialForm) : initialForm;
};

const withDevPrefilledValues = (
  emptyForm: CreateConventionPresentationInitialValues,
): CreateConventionPresentationInitialValues => {
  const signatories = emptyForm.signatories;

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
        firstName: signatories?.beneficiary.firstName || "Sylvanie",
        lastName: signatories?.beneficiary.lastName || "Durand",
        email: signatories?.beneficiary.email || "sylvanie@monemail.fr",
        phone: signatories?.beneficiary.phone || "0612345678",
        birthdate:
          signatories?.beneficiary.birthdate || "1990-02-21T00:00:00.000Z",
        emergencyContact:
          signatories?.beneficiary.emergencyContact || "Éric Durand",
        emergencyContactPhone:
          signatories?.beneficiary.emergencyContactPhone || "0662552607",
        emergencyContactEmail:
          signatories?.beneficiary.emergencyContactEmail ||
          "eric.durand@emergencycontact.com",
        federatedIdentity: signatories?.beneficiary.federatedIdentity,
        isRqth: false,
      },
      beneficiaryRepresentative: signatories?.beneficiaryRepresentative,
      establishmentRepresentative: {
        role: "establishment-representative",
        firstName:
          signatories?.establishmentRepresentative.firstName ||
          defaultTutor.firstName,
        lastName:
          signatories?.establishmentRepresentative.lastName ||
          defaultTutor.lastName,
        phone:
          signatories?.establishmentRepresentative.phone || defaultTutor.phone,
        email:
          signatories?.establishmentRepresentative.email || defaultTutor.email,
      },
    },
    establishmentTutor: {
      role: "establishment-tutor",
      firstName: tutor?.firstName || defaultTutor.firstName,
      lastName: tutor?.lastName || defaultTutor.lastName,
      phone: tutor?.phone || defaultTutor.phone,
      email: tutor?.email || defaultTutor.email,
      job: tutor?.job || defaultTutor.job,
    },
    siret: emptyForm.siret || "1234567890123",
    businessName: emptyForm.businessName || "Futuroscope",
    immersionAddress:
      emptyForm.immersionAddress ||
      "Societe Du Parc Du Futuroscope PARC DU FUTUROSCOPE 86130 JAUNAY-MARIGNY",
    agencyId: emptyForm.agencyId || "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    individualProtection: emptyForm.individualProtection ?? true,
    individualProtectionDescription:
      emptyForm.individualProtectionDescription || "Aucunes",
    sanitaryPrevention: emptyForm.sanitaryPrevention ?? true,
    sanitaryPreventionDescription:
      emptyForm.sanitaryPreventionDescription || "Aucunes",
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

export const beneficiaryRepresentativeFromParams = ({
  email,
  phone,
  firstName,
  lastName,
}: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}): BeneficiaryRepresentative | undefined =>
  email || phone || firstName || lastName
    ? {
        role: "beneficiary-representative",
        firstName: firstName ?? "",
        lastName: lastName ?? "",
        email: email ?? "",
        phone: phone ?? "",
      }
    : undefined;

const beneficiaryCurrentEmployerFromParams = ({
  businessName,
  businessSiret,
  firstName,
  lastName,
  email,
  phone,
  job,
  businessAddress,
}: {
  businessName?: string;
  businessSiret?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  job?: string;
  businessAddress?: string;
}): BeneficiaryCurrentEmployer | undefined =>
  businessName ||
  businessSiret ||
  firstName ||
  lastName ||
  email ||
  phone ||
  job ||
  businessAddress
    ? {
        businessSiret: businessSiret ?? "",
        businessName: businessName ?? "",
        firstName: firstName ?? "",
        lastName: lastName ?? "",
        email: email ?? "",
        phone: phone ?? "",
        job: job ?? "",
        role: "beneficiary-current-employer",
        businessAddress: businessAddress ?? "",
      }
    : undefined;

const scheduleFromParams = ({
  dateStart: dateStartParam,
  dateEnd: dateEndParam,
  schedule: scheduleParam,
}: {
  dateStart?: DateString;
  dateEnd?: DateString;
  schedule?: ScheduleDto;
}): Pick<ConventionDto, "dateStart" | "dateEnd" | "schedule"> => {
  const dateStart =
    dateStartParam ?? toDateUTCString(addDays(startOfToday(), 2));
  const dateEnd = dateEndParam ?? toDateUTCString(addDays(startOfToday(), 3));
  return {
    dateStart,
    dateEnd,
    schedule:
      scheduleParam ??
      reasonableSchedule(
        {
          start: new Date(dateStart),
          end: new Date(dateEnd),
        },
        [],
        [],
      ),
  };
};

const getMiniStageSignatoryProperty = <
  S extends keyof Signatories<"mini-stage-cci">,
  K extends keyof NonNullable<Signatories<"mini-stage-cci">[S]>,
>({
  conventionDraft,
  signatoryKey,
  propertyKey,
}: {
  conventionDraft: ConventionDraftDto;
  signatoryKey: S;
  propertyKey: K;
}): NonNullable<Signatories<"mini-stage-cci">[S]>[K] | undefined => {
  if (
    conventionDraft.internshipKind === "mini-stage-cci" &&
    conventionDraft.signatories &&
    signatoryKey in conventionDraft.signatories &&
    conventionDraft.signatories[signatoryKey]
  ) {
    return (
      conventionDraft.signatories[signatoryKey] as NonNullable<
        Signatories<"mini-stage-cci">[S]
      >
    )[propertyKey];
  }
  return undefined;
};

export const conventionPresentationFromConventionDraft = (
  conventionDraft: ConventionDraftDto,
): CreateConventionPresentationInitialValues => ({
  id: uuidV4(),
  fromConventionDraftId: conventionDraft.id,
  updatedAt: conventionDraft.updatedAt,
  status: "READY_TO_SIGN",
  dateSubmission: toDateUTCString(new Date()),
  internshipKind: conventionDraft.internshipKind,

  // Agency
  agencyId: conventionDraft.agencyId,
  agencyDepartment: conventionDraft.agencyDepartment ?? "",
  agencyKind: conventionDraft.agencyKind as AgencyKind | undefined,
  agencyReferent: {
    firstname: conventionDraft.agencyReferent?.firstname ?? "",
    lastname: conventionDraft.agencyReferent?.lastname ?? "",
  },

  //Actors
  establishmentTutor: {
    role: "establishment-tutor",
    firstName: conventionDraft.establishmentTutor?.firstName ?? "",
    lastName: conventionDraft.establishmentTutor?.lastName ?? "",
    email: conventionDraft.establishmentTutor?.email ?? "",
    phone: conventionDraft.establishmentTutor?.phone ?? "",
    job: conventionDraft.establishmentTutor?.job ?? "",
  },
  isEstablishmentBanned: false,
  signatories: {
    beneficiary: {
      role: "beneficiary",
      firstName: conventionDraft.signatories?.beneficiary?.firstName ?? "",
      lastName: conventionDraft.signatories?.beneficiary?.lastName ?? "",
      email: conventionDraft.signatories?.beneficiary?.email ?? "",
      phone: conventionDraft.signatories?.beneficiary?.phone ?? "",
      emergencyContact:
        conventionDraft.signatories?.beneficiary?.emergencyContact ?? "",
      emergencyContactPhone:
        conventionDraft.signatories?.beneficiary?.emergencyContactPhone ?? "",
      emergencyContactEmail:
        conventionDraft.signatories?.beneficiary?.emergencyContactEmail ?? "",
      address: getMiniStageSignatoryProperty({
        conventionDraft,
        signatoryKey: "beneficiary",
        propertyKey: "address",
      }),
      levelOfEducation:
        (getMiniStageSignatoryProperty({
          conventionDraft,
          signatoryKey: "beneficiary",
          propertyKey: "levelOfEducation",
        }) as LevelOfEducation) ?? "",
      schoolName:
        getMiniStageSignatoryProperty({
          conventionDraft,
          signatoryKey: "beneficiary",
          propertyKey: "schoolName",
        }) ?? "",
      schoolPostcode:
        getMiniStageSignatoryProperty({
          conventionDraft,
          signatoryKey: "beneficiary",
          propertyKey: "schoolPostcode",
        }) ?? "",
      financiaryHelp:
        conventionDraft.signatories?.beneficiary?.financiaryHelp ?? "",
      birthdate: conventionDraft.signatories?.beneficiary?.birthdate ?? "",
      isRqth: conventionDraft.signatories?.beneficiary?.isRqth ?? false,
      ...(conventionDraft.signatories?.beneficiary?.federatedIdentity
        ?.provider &&
      conventionDraft.signatories?.beneficiary?.federatedIdentity?.token
        ? {
            federatedIdentity: {
              provider: conventionDraft.signatories?.beneficiary
                ?.federatedIdentity?.provider as FtConnectIdentity["provider"],
              token:
                conventionDraft.signatories?.beneficiary?.federatedIdentity
                  ?.token,
            },
          }
        : {}),
    },
    establishmentRepresentative: {
      role: "establishment-representative",
      firstName:
        conventionDraft.signatories?.establishmentRepresentative?.firstName ??
        "",
      lastName:
        conventionDraft.signatories?.establishmentRepresentative?.lastName ??
        "",
      email:
        conventionDraft.signatories?.establishmentRepresentative?.email ?? "",
      phone:
        conventionDraft.signatories?.establishmentRepresentative?.phone ?? "",
    },
    beneficiaryRepresentative: beneficiaryRepresentativeFromParams({
      email:
        conventionDraft.signatories?.beneficiaryRepresentative?.email ?? "",
      phone:
        conventionDraft.signatories?.beneficiaryRepresentative?.phone ?? "",
      firstName:
        conventionDraft.signatories?.beneficiaryRepresentative?.firstName ?? "",
      lastName:
        conventionDraft.signatories?.beneficiaryRepresentative?.lastName ?? "",
    }),
    beneficiaryCurrentEmployer: beneficiaryCurrentEmployerFromParams({
      businessName:
        conventionDraft.signatories?.beneficiaryCurrentEmployer?.businessName ??
        "",
      businessSiret:
        conventionDraft.signatories?.beneficiaryCurrentEmployer
          ?.businessSiret ?? "",
      firstName:
        conventionDraft.signatories?.beneficiaryCurrentEmployer?.firstName ??
        "",
      lastName:
        conventionDraft.signatories?.beneficiaryCurrentEmployer?.lastName ?? "",
      email:
        conventionDraft.signatories?.beneficiaryCurrentEmployer?.email ?? "",
      phone:
        conventionDraft.signatories?.beneficiaryCurrentEmployer?.phone ?? "",
      job: conventionDraft.signatories?.beneficiaryCurrentEmployer?.job ?? "",
      businessAddress:
        conventionDraft.signatories?.beneficiaryCurrentEmployer
          ?.businessAddress ?? "",
    }),
  },

  // Schedule
  ...scheduleFromParams({
    dateStart: conventionDraft.dateStart,
    dateEnd: conventionDraft.dateEnd,
    schedule: conventionDraft.schedule as ScheduleDto | undefined,
  }),

  // Enterprise
  siret: conventionDraft.siret ?? "",
  businessName: conventionDraft.businessName ?? "",
  immersionAddress: conventionDraft.immersionAddress ?? "",
  workConditions: conventionDraft.workConditions ?? "",
  businessAdvantages: conventionDraft.businessAdvantages ?? "",

  // Covid
  individualProtection: conventionDraft.individualProtection ?? undefined,
  individualProtectionDescription:
    conventionDraft.individualProtectionDescription ?? "",
  sanitaryPrevention: conventionDraft.sanitaryPrevention ?? undefined,
  sanitaryPreventionDescription:
    conventionDraft.sanitaryPreventionDescription ?? "",

  // Immersion
  immersionObjective: conventionDraft.immersionObjective as
    | ImmersionObjective
    | undefined,
  remoteWorkMode: conventionDraft.remoteWorkMode,
  immersionAppellation: conventionDraft.immersionAppellation
    ? ({
        appellationCode: conventionDraft.immersionAppellation.appellationCode,
        appellationLabel: conventionDraft.immersionAppellation.appellationLabel,
        romeCode: conventionDraft.immersionAppellation.romeCode,
        romeLabel: conventionDraft.immersionAppellation.romeLabel,
      } as AppellationAndRomeDto)
    : undefined,
  immersionActivities: conventionDraft.immersionActivities ?? "",
  immersionSkills: conventionDraft.immersionSkills ?? "",
});

export const makeConventionPresentationFromConventionTemplate = (
  conventionTemplate: ConventionTemplate,
): CreateConventionTemplatePresentationInitialValues => {
  const { id, name, userId: _, ...conventionDraft } = conventionTemplate;
  return {
    ...conventionPresentationFromConventionDraft({
      ...conventionDraft,
      id: uuidV4(),
    }),
    id,
    name,
  };
};
