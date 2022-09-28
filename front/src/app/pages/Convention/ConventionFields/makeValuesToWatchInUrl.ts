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
  "mentorFirstName",
  "mentorLastName",
  "mentorJob",
  "mentorEmail",
  "mentorPhone",
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
    signatories: { beneficiary, mentor, legalRepresentative },
    ...flatValues
  } = conventionDto;

  return {
    ...flatValues,
    ...(legalRepresentative && {
      lrFirstName: legalRepresentative.firstName,
      lrLastName: legalRepresentative.lastName,
      lrPhone: legalRepresentative.phone,
      lrEmail: legalRepresentative.email,
    }),
    mentorFirstName: mentor.firstName,
    mentorLastName: mentor.lastName,
    mentorPhone: mentor.phone,
    mentorEmail: mentor.email,
    mentorJob: mentor.job,
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
