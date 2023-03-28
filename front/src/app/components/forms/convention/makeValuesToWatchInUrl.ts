import { ConventionDto, isBeneficiaryStudent } from "shared";
import {
  ConventionFormKeysInUrl,
  ConventionInUrl,
} from "src/app/routes/route-params";

const commonKeysToWatch: ConventionFormKeysInUrl[] = [
  "email",
  "firstName",
  "lastName",
  "phone",
  "birthdate",
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

const convertToConventionInUrl = (
  conventionDto: ConventionDto,
): ConventionInUrl => {
  const {
    signatories: {
      beneficiary,
      beneficiaryRepresentative,
      establishmentRepresentative,
      beneficiaryCurrentEmployer,
    },
    ...flatValues
  } = conventionDto;
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
      bceFirstName: beneficiaryCurrentEmployer.firstName,
      bceLastName: beneficiaryCurrentEmployer.lastName,
      bceEmail: beneficiaryCurrentEmployer.email,
      bcePhone: beneficiaryCurrentEmployer.phone,
      bceJob: beneficiaryCurrentEmployer.job,
    }),
    etFirstName: conventionDto.establishmentTutor.firstName,
    etLastName: conventionDto.establishmentTutor.lastName,
    etPhone: conventionDto.establishmentTutor.phone,
    etEmail: conventionDto.establishmentTutor.email,
    etJob: conventionDto.establishmentTutor.job,
    erFirstName: establishmentRepresentative.firstName,
    erLastName: establishmentRepresentative.lastName,
    erEmail: establishmentRepresentative.email,
    erPhone: establishmentRepresentative.phone,
    firstName: beneficiary.firstName,
    lastName: beneficiary.lastName,
    birthdate: beneficiary.birthdate,
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

export const makeValuesToWatchInUrl = (conventionDto: ConventionDto) => {
  const conventionInUrl = convertToConventionInUrl(conventionDto);
  const keysToWatch: ConventionFormKeysInUrl[] = [
    ...commonKeysToWatch,
    "agencyDepartment",
  ];
  return keysToWatch.reduce(
    (acc, watchedKey) => ({
      ...acc,
      [watchedKey]: conventionInUrl[watchedKey],
    }),
    {} as ConventionInUrl,
  );
};
