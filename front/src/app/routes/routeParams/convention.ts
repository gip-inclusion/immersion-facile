import { addDays, startOfToday } from "date-fns";
import { param, ValueSerializer } from "type-route";
import { v4 as uuidV4 } from "uuid";
import {
  AppellationAndRomeDto,
  AppellationCode,
  appellationCodeSchema,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDto,
  ImmersionObjective,
  InternshipKind,
  isBeneficiaryStudent,
  LevelOfEducation,
  mergeObjectsExceptFalsyValues,
  PeConnectIdentity,
  reasonableSchedule,
  ScheduleDto,
  toDateString,
} from "shared";
import { ConventionPresentation } from "src/app/components/forms/convention/conventionHelpers";
import { ConventionCustomAgencyPageRoute } from "src/app/pages/convention/ConventionCustomAgencyPage";
import { ConventionImmersionPageRoute } from "src/app/pages/convention/ConventionImmersionPage";
import { ConventionMiniStagePageRoute } from "src/app/pages/convention/ConventionMiniStagePage";
import { ConventionImmersionForExternalsRoute } from "src/app/pages/convention/ConventionPageForExternals";
import { deviceRepository } from "src/config/dependencies";
import { ENV } from "src/config/environmentVariables";

type ConventionRoutes =
  | ConventionMiniStagePageRoute
  | ConventionImmersionPageRoute
  | ConventionCustomAgencyPageRoute
  | ConventionImmersionForExternalsRoute;

export const conventionInitialValuesFromUrl = ({
  route,
  internshipKind,
}: {
  route: ConventionRoutes;
  internshipKind: InternshipKind;
}): ConventionPresentation => {
  const params = mergeObjectsExceptFalsyValues(
    deviceRepository.get("partialConventionInUrl") ?? {},
    route.params satisfies ConventionParamsInUrl,
  );

  const initialFormWithStoredAndUrlParams: ConventionPresentation = {
    ...conventionPresentationFromParams(params),
    id: uuidV4(),
    status: "DRAFT",
    dateSubmission: toDateString(startOfToday()),
    internshipKind,
  };

  return ENV.prefilledForms
    ? withDevPrefilledValues(initialFormWithStoredAndUrlParams)
    : initialFormWithStoredAndUrlParams;
};

const withDevPrefilledValues = (
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
        isRqth: false,
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

const conventionFormKeysInUrl: ConventionFormKeysInUrl[] = [
  "email",
  "firstName",
  "lastName",
  "phone",
  "birthdate",
  "isRqth",
  "financiaryHelp",
  "led",
  "emergencyContact",
  "emergencyContactPhone",
  "dateStart",
  "dateEnd",
  "siret",
  "businessName",
  "etFirstName",
  "etLastName",
  "etJob",
  "etEmail",
  "etPhone",
  "erFirstName",
  "erLastName",
  "erEmail",
  "erPhone",
  "brFirstName",
  "brLastName",
  "brEmail",
  "brPhone",
  "bceSiret",
  "bceBusinessName",
  "bceBusinessAddress",
  "bceFirstName",
  "bceLastName",
  "bceEmail",
  "bcePhone",
  "bceJob",
  "businessAdvantages",
  "agencyId",
  "immersionAddress",
  "sanitaryPrevention",
  "individualProtection",
  "sanitaryPreventionDescription",
  "immersionObjective",
  "immersionActivities",
  "immersionSkills",
  "workConditions",
  "schedule",
  "immersionAppellation",
];

const conventionToConventionInUrl = (
  convention: ConventionPresentation,
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
  const levelOfEducation = isBeneficiaryStudent(beneficiary)
    ? beneficiary.levelOfEducation
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
    ...(levelOfEducation ? { led: levelOfEducation } : {}),
    emergencyContact: beneficiary.emergencyContact,
    emergencyContactPhone: beneficiary.emergencyContactPhone,
    fedId: beneficiary.federatedIdentity?.token,
    fedIdProvider: beneficiary.federatedIdentity?.provider,
  };
};

export const makeValuesToWatchInUrl = (convention: ConventionPresentation) => {
  const conventionInUrl = conventionToConventionInUrl(convention);
  const keysToWatch: ConventionFormKeysInUrl[] = [
    ...conventionFormKeysInUrl,
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
  parse: (raw) => JSON.parse(raw),
  stringify: (schedule) => JSON.stringify(schedule),
};

const appellationDtoSerializer: ValueSerializer<AppellationAndRomeDto> = {
  parse: (raw) => JSON.parse(raw),
  stringify: (appellationDto) => JSON.stringify(appellationDto),
};

export const appellationStringSerializer: ValueSerializer<AppellationCode> = {
  parse: (raw) => appellationCodeSchema.parse(raw),
  stringify: (appellation) => appellation,
};

export type ConventionFormKeysInUrl = keyof ConventionQueryParams;
type ConventionQueryParams = typeof conventionValuesFromUrl;

export const conventionValuesFromUrl = {
  fedId: param.query.optional.string,
  fedIdProvider: param.query.optional.string,
  email: param.query.optional.string,
  firstName: param.query.optional.string,
  lastName: param.query.optional.string,
  phone: param.query.optional.string,
  financiaryHelp: param.query.optional.string,
  led: param.query.optional.string,
  emergencyContact: param.query.optional.string,
  emergencyContactPhone: param.query.optional.string,
  emergencyContactEmail: param.query.optional.string,
  isRqth: param.query.optional.boolean,
  birthdate: param.query.optional.string,
  agencyDepartment: param.query.optional.string,

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

  immersionObjective: param.query.optional.string,
  immersionActivities: param.query.optional.string,
  immersionSkills: param.query.optional.string,
  sanitaryPreventionDescription: param.query.optional.string,
  workConditions: param.query.optional.string,

  sanitaryPrevention: param.query.optional.boolean,
  individualProtection: param.query.optional.boolean,

  dateStart: param.query.optional.string,
  dateEnd: param.query.optional.string,

  schedule: param.query.optional.ofType(scheduleSerializer),
  immersionAppellation: param.query.optional.ofType(appellationDtoSerializer),
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
    params.dateStart ?? toDateString(addDays(startOfToday(), 2));
  const dateEnd = params.dateEnd ?? toDateString(addDays(startOfToday(), 3));
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
): Omit<ConventionPresentation, "internshipKind"> => ({
  // Agency
  agencyId: params.agencyId ?? undefined,
  agencyDepartment: params.agencyDepartment ?? "",

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
      levelOfEducation: (params.led as LevelOfEducation) ?? "",
      financiaryHelp: params.financiaryHelp ?? "",
      birthdate: params.birthdate ?? "",
      isRqth: params.isRqth ?? false,
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
