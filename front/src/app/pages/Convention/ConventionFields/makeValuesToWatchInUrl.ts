import { ConventionDto } from "shared/src/convention/convention.dto";
import { ConventionFormKeysInUrl } from "src/app/routing/route-params";

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
  "mentor",
  "mentorEmail",
  "mentorPhone",
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

export const makeValuesToWatchInUrl = (values: ConventionDto) => {
  const keysToWatch: ConventionFormKeysInUrl[] = [
    ...commonKeysToWatch,
    "postalCode",
  ];

  return keysToWatch.reduce(
    (acc, watchedKey) => ({ ...acc, [watchedKey]: values[watchedKey] }),
    {} as Partial<ConventionDto>,
  );
};

export const makeValuesToWatchInUrlForUkraine = (values: ConventionDto) => {
  return commonKeysToWatch.reduce(
    (acc, watchedKey) => ({ ...acc, [watchedKey]: values[watchedKey] }),
    {} as Partial<ConventionDto>,
  );
};
