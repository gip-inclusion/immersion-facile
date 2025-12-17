import { addDays, startOfToday } from "date-fns";
import {
  type AgencyKind,
  type AppellationAndRomeDto,
  type AppellationCode,
  addressDtoToString,
  addressStringToDto,
  type BeneficiaryCurrentEmployer,
  type BeneficiaryRepresentative,
  type ConventionDto,
  type ConventionReadDto,
  type FtConnectIdentity,
  type ImmersionObjective,
  type InternshipKind,
  isBeneficiaryStudent,
  keys,
  type LevelOfEducation,
  mergeObjectsExceptFalsyValues,
  type NafCode,
  parseStringToJsonOrThrow,
  reasonableSchedule,
  type ScheduleDto,
  toDateUTCString,
} from "shared";
import type { CreateConventionPresentationInitialValues } from "src/app/components/forms/convention/conventionHelpers";
import type { ConventionImmersionPageRoute } from "src/app/pages/convention/ConventionImmersionPage";
import type { ConventionMiniStagePageRoute } from "src/app/pages/convention/ConventionMiniStagePage";
import type { ConventionImmersionForExternalsRoute } from "src/app/pages/convention/ConventionPageForExternals";
import { outOfReduxDependencies } from "src/config/dependencies";
import { ENV } from "src/config/environmentVariables";
import { param, type ValueSerializer } from "type-route";
import { v4 as uuidV4 } from "uuid";

type ConventionRoutes =
  | ConventionMiniStagePageRoute
  | ConventionImmersionPageRoute
  | ConventionImmersionForExternalsRoute;

export const getConventionInitialValuesFromUrl = ({
  route,
  internshipKind,
}: {
  route: ConventionRoutes;
  internshipKind: InternshipKind;
}): CreateConventionPresentationInitialValues => {
  const params = mergeObjectsExceptFalsyValues(
    outOfReduxDependencies.localDeviceRepository.get(
      "partialConventionInUrl",
    ) ?? {},
    route.params satisfies ConventionParamsInUrl,
  );
  const initialFormWithStoredAndUrlParams: CreateConventionPresentationInitialValues =
    {
      ...conventionPresentationFromParams(params),
      id: uuidV4(),
      status: "READY_TO_SIGN",
      dateSubmission: toDateUTCString(new Date()),
      internshipKind,
    };

  return ENV.prefilledForms
    ? withDevPrefilledValues(initialFormWithStoredAndUrlParams)
    : initialFormWithStoredAndUrlParams;
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

    // Enterprise
    siret: emptyForm.siret || "1234567890123",
    businessName: emptyForm.businessName || "Futuroscope",
    immersionAddress:
      emptyForm.immersionAddress ||
      "Societe Du Parc Du Futuroscope PARC DU FUTUROSCOPE 86130 JAUNAY-MARIGNY",
    agencyId: emptyForm.agencyId || "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",

    // Covid
    individualProtection: emptyForm.individualProtection ?? true,
    individualProtectionDescription:
      emptyForm.individualProtectionDescription || "Aucunes",
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

const conventionToConventionInUrl = (
  convention: CreateConventionPresentationInitialValues,
): ConventionParamsInUrl => {
  const {
    signatories: {
      beneficiary,
      beneficiaryRepresentative,
      establishmentRepresentative,
      beneficiaryCurrentEmployer,
    },
    ...flatValues
  } = convention;
  const beneficiarySchoolInformations = isBeneficiaryStudent(beneficiary)
    ? {
        led: beneficiary.levelOfEducation,
        schoolName: beneficiary.schoolName,
        schoolPostcode: beneficiary.schoolPostcode,
        address: beneficiary.address && addressDtoToString(beneficiary.address),
      }
    : undefined;

  return {
    ...flatValues,
    ...(beneficiaryRepresentative && {
      brFirstName: beneficiaryRepresentative.firstName,
      brLastName: beneficiaryRepresentative.lastName,
      brPhone: beneficiaryRepresentative.phone,
      brEmail: beneficiaryRepresentative.email,
    }),
    ...(beneficiaryCurrentEmployer && {
      bceSiret: beneficiaryCurrentEmployer.businessSiret,
      bceBusinessName: beneficiaryCurrentEmployer.businessName,
      bceBusinessAddress: beneficiaryCurrentEmployer.businessAddress,
      bceFirstName: beneficiaryCurrentEmployer.firstName,
      bceLastName: beneficiaryCurrentEmployer.lastName,
      bceEmail: beneficiaryCurrentEmployer.email,
      bcePhone: beneficiaryCurrentEmployer.phone,
      bceJob: beneficiaryCurrentEmployer.job,
    }),
    etFirstName: convention.establishmentTutor.firstName,
    etLastName: convention.establishmentTutor.lastName,
    etPhone: convention.establishmentTutor.phone,
    etEmail: convention.establishmentTutor.email,
    etJob: convention.establishmentTutor.job,
    erFirstName: establishmentRepresentative.firstName,
    erLastName: establishmentRepresentative.lastName,
    erEmail: establishmentRepresentative.email,
    erPhone: establishmentRepresentative.phone,
    firstName: beneficiary.firstName,
    lastName: beneficiary.lastName,
    birthdate: beneficiary.birthdate,
    isRqth: beneficiary.isRqth,
    financiaryHelp: beneficiary.financiaryHelp,
    email: beneficiary.email,
    phone: beneficiary.phone,
    businessAdvantages: flatValues.businessAdvantages,
    ...(beneficiarySchoolInformations
      ? { ...beneficiarySchoolInformations }
      : {}),
    emergencyContact: beneficiary.emergencyContact,
    emergencyContactPhone: beneficiary.emergencyContactPhone,
    emergencyContactEmail: beneficiary.emergencyContactEmail,
    fedId: beneficiary.federatedIdentity?.token,
    fedIdProvider: beneficiary.federatedIdentity?.provider,
    agencyReferentFirstName: convention.agencyReferent?.firstname,
    agencyReferentLastName: convention.agencyReferent?.lastname,
  };
};

export const conventionReadToConventionRouteParams = (
  convention: ConventionReadDto,
): ConventionParamsInUrl => {
  const baseParams = {
    // Beneficiary information
    email: convention.signatories.beneficiary.email,
    firstName: convention.signatories.beneficiary.firstName,
    lastName: convention.signatories.beneficiary.lastName,
    phone: convention.signatories.beneficiary.phone,
    birthdate: convention.signatories.beneficiary.birthdate,
    isRqth: convention.signatories.beneficiary.isRqth,
    financiaryHelp: convention.signatories.beneficiary.financiaryHelp,
    emergencyContact: convention.signatories.beneficiary.emergencyContact,
    emergencyContactPhone:
      convention.signatories.beneficiary.emergencyContactPhone,
    emergencyContactEmail:
      convention.signatories.beneficiary.emergencyContactEmail,
    fedId: convention.signatories.beneficiary.federatedIdentity?.token,
    fedIdProvider:
      convention.signatories.beneficiary.federatedIdentity?.provider,
    fromPeConnectedUser: false,

    // Beneficiary representative information
    brEmail: convention.signatories.beneficiaryRepresentative?.email,
    brFirstName: convention.signatories.beneficiaryRepresentative?.firstName,
    brLastName: convention.signatories.beneficiaryRepresentative?.lastName,
    brPhone: convention.signatories.beneficiaryRepresentative?.phone,

    // Beneficiary current employer information
    bceEmail: convention.signatories.beneficiaryCurrentEmployer?.email,
    bceFirstName: convention.signatories.beneficiaryCurrentEmployer?.firstName,
    bceLastName: convention.signatories.beneficiaryCurrentEmployer?.lastName,
    bcePhone: convention.signatories.beneficiaryCurrentEmployer?.phone,
    bceSiret: convention.signatories.beneficiaryCurrentEmployer?.businessSiret,
    bceBusinessName:
      convention.signatories.beneficiaryCurrentEmployer?.businessName,
    bceJob: convention.signatories.beneficiaryCurrentEmployer?.job,
    bceBusinessAddress:
      convention.signatories.beneficiaryCurrentEmployer?.businessAddress,

    // Establishment information
    siret: convention.siret,
    businessName: convention.businessName,
    businessAdvantages: convention.businessAdvantages,
    workConditions: convention.workConditions,
    immersionAddress: convention.immersionAddress,

    // Establishment tutor information
    etFirstName: convention.establishmentTutor.firstName,
    etLastName: convention.establishmentTutor.lastName,
    etJob: convention.establishmentTutor.job,
    etPhone: convention.establishmentTutor.phone,
    etEmail: convention.establishmentTutor.email,

    // Establishment representative information
    erFirstName: convention.signatories.establishmentRepresentative.firstName,
    erLastName: convention.signatories.establishmentRepresentative.lastName,
    erPhone: convention.signatories.establishmentRepresentative.phone,
    erEmail: convention.signatories.establishmentRepresentative.email,

    // Agency information
    agencyId: convention.agencyId,
    agencyDepartment: convention.agencyDepartment,
    agencyKind: convention.agencyKind,
    agencyReferentFirstName: convention.agencyReferent?.firstname,
    agencyReferentLastName: convention.agencyReferent?.lastname,

    // Immersion details
    immersionObjective: convention.immersionObjective,
    immersionActivities: convention.immersionActivities,
    immersionSkills: convention.immersionSkills,
    immersionAppellation: convention.immersionAppellation,

    // Schedule information
    dateStart: convention.dateStart,
    dateEnd: convention.dateEnd,
    schedule: convention.schedule,

    // Health and safety
    sanitaryPrevention: convention.sanitaryPrevention,
    sanitaryPreventionDescription: convention.sanitaryPreventionDescription,
    individualProtection: convention.individualProtection,
    individualProtectionDescription: convention.individualProtectionDescription,
  };

  // Add student-specific fields for mini-stage-cci conventions
  if (convention.internshipKind === "mini-stage-cci") {
    return {
      ...baseParams,
      address: convention.signatories.beneficiary.address
        ? `${convention.signatories.beneficiary.address.streetNumberAndAddress} ${convention.signatories.beneficiary.address.postcode} ${convention.signatories.beneficiary.address.city}`
        : undefined,
      led: convention.signatories.beneficiary.levelOfEducation,
      schoolName: convention.signatories.beneficiary.schoolName,
      schoolPostcode: convention.signatories.beneficiary.schoolPostcode,
    };
  }

  // For immersion conventions, student-specific fields are not available
  return baseParams;
};

export const makeValuesToWatchInUrl = (
  convention: CreateConventionPresentationInitialValues,
) => {
  const conventionInUrl = conventionToConventionInUrl(convention);
  const keysToWatch: ConventionFormKeysInUrl[] = [
    ...keys(conventionValuesFromUrl),
    "agencyDepartment",
  ];
  return keysToWatch.reduce(
    (acc, watchedKey) => ({
      ...acc,
      [watchedKey]: conventionInUrl[watchedKey],
    }),
    {} as ConventionParamsInUrl,
  );
};

const scheduleSerializer: ValueSerializer<ScheduleDto> = {
  parse: (raw) =>
    parseStringToJsonOrThrow<ScheduleDto, "schedule">(raw, "schedule"),
  stringify: (schedule) => JSON.stringify(schedule),
};

export const appellationAndRomeDtoSerializer: ValueSerializer<AppellationAndRomeDto> =
  {
    parse: (raw) =>
      parseStringToJsonOrThrow<AppellationAndRomeDto, "immersionAppellation">(
        raw,
        "immersionAppellation",
      ),
    stringify: (appellationDto) => JSON.stringify(appellationDto),
  };

export const appellationAndRomeDtoArraySerializer: ValueSerializer<
  AppellationAndRomeDto[]
> = {
  parse: (raw) =>
    parseStringToJsonOrThrow<AppellationAndRomeDto[], "appellations">(
      raw,
      "appellations",
    ),
  stringify: (appellationDto) => JSON.stringify(appellationDto),
};

export const appellationStringSerializer: ValueSerializer<AppellationCode[]> = {
  parse: (raw) =>
    parseStringToJsonOrThrow<AppellationCode[], "appellationCodes">(
      raw,
      "appellationCodes",
    ),
  stringify: (appellationCodes) => JSON.stringify(appellationCodes),
};

export const nafCodeSerializer: ValueSerializer<NafCode[]> = {
  parse: (raw) =>
    parseStringToJsonOrThrow<NafCode[], "nafCodes">(raw, "nafCodes"),
  stringify: (nafCode) => JSON.stringify(nafCode),
};

export type ConventionFormKeysInUrl = keyof ConventionQueryParams;
type ConventionQueryParams = typeof conventionValuesFromUrl;

export const conventionValuesFromUrl = {
  fedId: param.query.optional.string,
  fedIdProvider: param.query.optional.string,
  fedIdToken: param.query.optional.string,
  fromPeConnectedUser: param.query.optional.boolean,
  email: param.query.optional.string,
  firstName: param.query.optional.string,
  lastName: param.query.optional.string,
  phone: param.query.optional.string,
  financiaryHelp: param.query.optional.string,
  led: param.query.optional.string,
  address: param.query.optional.string,
  schoolName: param.query.optional.string,
  schoolPostcode: param.query.optional.string,
  emergencyContact: param.query.optional.string,
  emergencyContactPhone: param.query.optional.string,
  emergencyContactEmail: param.query.optional.string,
  isRqth: param.query.optional.boolean,
  birthdate: param.query.optional.string,
  agencyDepartment: param.query.optional.string,
  agencyKind: param.query.optional.string,

  brEmail: param.query.optional.string,
  brFirstName: param.query.optional.string,
  brLastName: param.query.optional.string,
  brPhone: param.query.optional.string,

  bceEmail: param.query.optional.string,
  bceFirstName: param.query.optional.string,
  bceLastName: param.query.optional.string,
  bcePhone: param.query.optional.string,
  bceSiret: param.query.optional.string,
  bceBusinessName: param.query.optional.string,
  bceJob: param.query.optional.string,
  bceBusinessAddress: param.query.optional.string,

  siret: param.query.optional.string,
  businessName: param.query.optional.string,
  businessAdvantages: param.query.optional.string,
  etFirstName: param.query.optional.string,
  etLastName: param.query.optional.string,
  etJob: param.query.optional.string,
  etPhone: param.query.optional.string,
  etEmail: param.query.optional.string,
  erFirstName: param.query.optional.string,
  erLastName: param.query.optional.string,
  erPhone: param.query.optional.string,
  erEmail: param.query.optional.string,
  immersionAddress: param.query.optional.string,
  agencyId: param.query.optional.string,
  agencyReferentFirstName: param.query.optional.string,
  agencyReferentLastName: param.query.optional.string,
  immersionObjective: param.query.optional.string,
  immersionActivities: param.query.optional.string,
  immersionSkills: param.query.optional.string,
  sanitaryPreventionDescription: param.query.optional.string,
  workConditions: param.query.optional.string,

  sanitaryPrevention: param.query.optional.boolean,
  individualProtection: param.query.optional.boolean,
  individualProtectionDescription: param.query.optional.string,

  dateStart: param.query.optional.string,
  dateEnd: param.query.optional.string,

  schedule: param.query.optional.ofType(scheduleSerializer),
  immersionAppellation: param.query.optional.ofType(
    appellationAndRomeDtoSerializer,
  ),
};

export type ConventionParamsInUrl = Partial<{
  [K in keyof ConventionQueryParams]: ConventionQueryParams[K]["~internal"]["valueSerializer"] extends ValueSerializer<
    infer T
  >
    ? T
    : never;
}>;

const beneficiaryRepresentativeFromParams = (
  params: ConventionParamsInUrl,
): BeneficiaryRepresentative | undefined =>
  params.brEmail || params.brPhone || params.brFirstName || params.brLastName
    ? {
        role: "beneficiary-representative",
        firstName: params.brFirstName ?? "",
        lastName: params.brLastName ?? "",
        email: params.brEmail ?? "",
        phone: params.brPhone ?? "",
      }
    : undefined;

const beneficiaryCurrentEmployerFromParams = (
  params: ConventionParamsInUrl,
): BeneficiaryCurrentEmployer | undefined =>
  params.bceBusinessName ||
  params.bceSiret ||
  params.bceFirstName ||
  params.bceLastName ||
  params.bceEmail ||
  params.bcePhone ||
  params.bceJob ||
  params.bceBusinessAddress
    ? {
        businessSiret: params.bceSiret ?? "",
        businessName: params.bceBusinessName ?? "",
        firstName: params.bceFirstName ?? "",
        lastName: params.bceLastName ?? "",
        email: params.bceEmail ?? "",
        phone: params.bcePhone ?? "",
        job: params.bceJob ?? "",
        role: "beneficiary-current-employer",
        businessAddress: params.bceBusinessAddress ?? "",
      }
    : undefined;

const scheduleFromParams = (
  params: ConventionParamsInUrl,
): Pick<ConventionDto, "dateStart" | "dateEnd" | "schedule"> => {
  const dateStart =
    params.dateStart ?? toDateUTCString(addDays(startOfToday(), 2));
  const dateEnd = params.dateEnd ?? toDateUTCString(addDays(startOfToday(), 3));
  return {
    dateStart,
    dateEnd,
    schedule:
      params.schedule ??
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

const conventionPresentationFromParams = (
  params: ConventionParamsInUrl,
): Omit<CreateConventionPresentationInitialValues, "internshipKind"> => ({
  // Agency
  agencyId: params.agencyId ?? undefined,
  agencyDepartment: params.agencyDepartment ?? "",
  agencyKind: params.agencyKind as AgencyKind | undefined,
  agencyReferent: {
    firstname: params.agencyReferentFirstName ?? "",
    lastname: params.agencyReferentLastName ?? "",
  },

  //Actors
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
      address: params.address ? addressStringToDto(params.address) : undefined,
      levelOfEducation: (params.led as LevelOfEducation) ?? "",
      schoolName: params.schoolName ?? "",
      schoolPostcode: params.schoolPostcode ?? "",
      financiaryHelp: params.financiaryHelp ?? "",
      birthdate: params.birthdate ?? "",
      isRqth: params.isRqth ?? false,
      ...(params.fedId && params.fedIdProvider
        ? {
            federatedIdentity: {
              provider: params.fedIdProvider as FtConnectIdentity["provider"],
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
    beneficiaryRepresentative: beneficiaryRepresentativeFromParams(params),
    beneficiaryCurrentEmployer: beneficiaryCurrentEmployerFromParams(params),
  },

  // Schedule
  ...scheduleFromParams(params),

  // Enterprise
  siret: params.siret ?? "",
  businessName: params.businessName ?? "",
  immersionAddress: params.immersionAddress ?? "",
  workConditions: params.workConditions ?? "",
  businessAdvantages: params.businessAdvantages ?? "",

  // Covid
  individualProtection: params.individualProtection ?? undefined,
  individualProtectionDescription: params.individualProtectionDescription ?? "",
  sanitaryPrevention: params.sanitaryPrevention ?? undefined,
  sanitaryPreventionDescription: params.sanitaryPreventionDescription ?? "",

  // Immersion
  immersionObjective: params.immersionObjective as
    | ImmersionObjective
    | undefined,
  immersionAppellation: params.immersionAppellation,
  immersionActivities: params.immersionActivities ?? "",
  immersionSkills: params.immersionSkills ?? "",
});
