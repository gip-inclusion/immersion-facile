import { addDays, format } from "date-fns";
import { frenchFirstNames } from "src/helpers/namesList";
import { AgencyWithPositionDto } from "shared/src/agency/agency.dto";
import { IMMERSION_APPLICATION_TEMPLATE } from "shared/src/convention/convention";
import {
  ConventionDto,
  allConventionStatuses,
} from "shared/src/convention/convention.dto";

export const generateApplication = (
  i: number,
  agencies: AgencyWithPositionDto[],
): ConventionDto => {
  const firstName =
    frenchFirstNames[Math.floor(Math.random() * frenchFirstNames.length)];
  const status =
    allConventionStatuses[
      Math.floor(Math.random() * allConventionStatuses.length)
    ];
  let beneficiaryAccepted = true;
  let enterpriseAccepted = true;

  // Configure signatures depending on the status
  if (status === "DRAFT" || status === "READY_TO_SIGN") {
    beneficiaryAccepted = false;
    enterpriseAccepted = false;
  } else if (status === "PARTIALLY_SIGNED") {
    if (Math.random() > 0.5) {
      beneficiaryAccepted = false;
    } else {
      enterpriseAccepted = false;
    }
  }
  // Otherwise it's signed by both beneficiary and enterprise.

  // Created up to, days
  const creationMaxDelay = 14;
  const dateSubmission = addDays(
    new Date(),
    -1 * Math.floor(Math.random() * creationMaxDelay),
  );

  // Date start: at least 2 business days after creation, so add 3, but no more than maxStartDelay
  const maxStartDelay = 28;
  const dateStart = addDays(
    dateSubmission,
    3 + Math.floor(Math.random() * maxStartDelay),
  );

  // Ends between 1 and 28 days after start.
  const dateEnd = addDays(dateStart, 1 + Math.floor(Math.random() * 27));

  const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

  const agencyId = agencies[Math.floor(Math.random() * agencies.length)].id;

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
    agencyId,
    enterpriseAccepted,
    beneficiaryAccepted,
  };
};
