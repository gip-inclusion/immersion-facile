import { addDays, format } from "date-fns";
import { frenchFirstNames } from "src/helpers/namesList";
import { validAgencyCodes } from "src/shared/agencies";
import {
  ImmersionApplicationDto,
  IMMERSION_APPLICATION_TEMPLATE,
  validApplicationStatus,
} from "src/shared/ImmersionApplicationDto";

export const generateApplication = (i: number): ImmersionApplicationDto => {
  const firstName =
    frenchFirstNames[Math.floor(Math.random() * frenchFirstNames.length)];
  const status =
    validApplicationStatus[
      Math.floor(Math.random() * validApplicationStatus.length)
    ];

  // Created up to, days
  const creationMaxDelay = 14;
  const dateSubmission = addDays(
    new Date(),
    -1 * Math.floor(Math.random() * creationMaxDelay),
  );

  // Date start: at least 2 days after creation, no more than maxStartDelay
  const maxStartDelay = 28;
  const dateStart = addDays(
    dateSubmission,
    2 + Math.floor(Math.random() * maxStartDelay),
  );

  // Ends between 1 and 28 days after start.
  const dateEnd = addDays(dateStart, 1 + Math.floor(Math.random() * 27));

  const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

  const agencyCode =
    validAgencyCodes[Math.floor(Math.random() * validAgencyCodes.length)];

  return {
    ...IMMERSION_APPLICATION_TEMPLATE,
    id: `test-autopopulated-id-${i}`,
    status,
    firstName,
    lastName: "TEST",
    dateSubmission: toDateString(dateSubmission),
    dateStart: toDateString(dateStart),
    dateEnd: toDateString(dateEnd),
    email: `${firstName}@testimmersionfacileapplication.fr`,
    agencyCode,
  };
};
