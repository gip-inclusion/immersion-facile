import { ConventionDto } from "shared";
import {
  ConventionFormKeysInUrl,
  ConventionInUrl,
} from "src/app/routing/route-params";

const commonKeysToWatch: ConventionFormKeysInUrl[] = [
  "email",
  "firstName",
  "lastName",
  "phone",
  "emergencyContact",
  "emergencyContactPhone",
  "dateStart",
  "dateEnd",
  "siret",
  "businessName",
  "establishmentTutorFirstName",
  "establishmentTutorLastName",
  "establishmentTutorJob",
  "establishmentTutorEmail",
  "establishmentTutorPhone",
  "establishmentRepresentativeFirstName",
  "establishmentRepresentativeLastName",
  "establishmentRepresentativeEmail",
  "establishmentRepresentativePhone",
  "lrFirstName",
  "lrLastName",
  "lrEmail",
  "lrPhone",
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
    },
    ...flatValues
  } = conventionDto;

  return {
    ...flatValues,
    ...(beneficiaryRepresentative && {
      lrFirstName: beneficiaryRepresentative.firstName,
      lrLastName: beneficiaryRepresentative.lastName,
      lrPhone: beneficiaryRepresentative.phone,
      lrEmail: beneficiaryRepresentative.email,
    }),
    establishmentTutorFirstName: conventionDto.establishmentTutor.firstName,
    establishmentTutorLastName: conventionDto.establishmentTutor.lastName,
    establishmentTutorPhone: conventionDto.establishmentTutor.phone,
    establishmentTutorEmail: conventionDto.establishmentTutor.email,
    establishmentTutorJob: conventionDto.establishmentTutor.job,
    establishmentRepresentativeFirstName: establishmentRepresentative.firstName,
    establishmentRepresentativeLastName: establishmentRepresentative.lastName,
    establishmentRepresentativeEmail: establishmentRepresentative.email,
    establishmentRepresentativePhone: establishmentRepresentative.phone,
    firstName: beneficiary.firstName,
    lastName: beneficiary.lastName,
    email: beneficiary.email,
    phone: beneficiary.phone,
    emergencyContact: beneficiary.emergencyContact,
    emergencyContactPhone: beneficiary.emergencyContactPhone,
    federatedIdentity: beneficiary.federatedIdentity,
  };
};

export const makeValuesToWatchInUrl = (conventionDto: ConventionDto) => {
  const conventionInUrl = convertToConventionInUrl(conventionDto);
  const keysToWatch: ConventionFormKeysInUrl[] = [
    ...commonKeysToWatch,
    "postalCode",
  ];

  return keysToWatch.reduce(
    (acc, watchedKey) => ({
      ...acc,
      [watchedKey]: conventionInUrl[watchedKey],
    }),
    {} as ConventionInUrl,
  );
};

export const makeValuesToWatchInUrlForUkraine = (
  conventionDto: ConventionDto,
) => {
  const conventionInUrl = convertToConventionInUrl(conventionDto);
  return commonKeysToWatch.reduce(
    (acc, watchedKey) => ({
      ...acc,
      [watchedKey]: conventionInUrl[watchedKey],
    }),
    {} as ConventionInUrl,
  );
};
