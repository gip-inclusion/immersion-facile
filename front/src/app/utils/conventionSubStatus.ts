import type { ConventionReadDto, ConventionStatus } from "shared";
import {
  isConventionAlreadyStarted,
  isConventionEndingInOneDayOrMore,
} from "src/core-logic/domain/convention/convention.utils";
import { match } from "ts-pattern";

const subStatusesByStatus = {
  READY_TO_SIGN: [
    "readyToSignWithBroadcastError",
    "readyToSignWithoutBroadcastError",
  ],
  PARTIALLY_SIGNED: [
    "partiallySignedWithBroadcastError",
    "partiallySignedWithoutBroadcastError",
  ],
  IN_REVIEW: [
    "inReviewWithSingleValidationWithBroadcastError",
    "inReviewWithSingleValidationWithoutBroadcastError",
    "inReviewWithDoubleValidationWithBroadcastError",
    "inReviewWithDoubleValidationWithoutBroadcastError",
  ],
  ACCEPTED_BY_COUNSELLOR: [
    "acceptedByCounsellorWithBroadcastError",
    "acceptedByCounsellorWithoutBroadcastError",
  ],
  ACCEPTED_BY_VALIDATOR: [
    "acceptedByValidatorWithAssessmentWithBroadcastError",
    "acceptedByValidatorWithAssessmentWithoutBroadcastError",
    "acceptedByValidatorWithoutAssessmentDidNotStartWithBroadcastError",
    "acceptedByValidatorWithoutAssessmentDidNotStartWithoutBroadcastError",
    "acceptedByValidatorWithoutAssessmentDidStartEndingInOneDayOrMoreWithBroadcastError",
    "acceptedByValidatorWithoutAssessmentDidStartEndingInOneDayOrMoreWithoutBroadcastError",
    "acceptedByValidatorWithoutAssessmentDidStartEndingTomorrowOrAlreadyEndedWithBroadcastError",
    "acceptedByValidatorWithoutAssessmentDidStartEndingTomorrowOrAlreadyEndedWithoutBroadcastError",
  ],
  REJECTED: ["rejectedWithBroadcastError", "rejectedWithoutBroadcastError"],
  CANCELLED: ["cancelledWithBroadcastError", "cancelledWithoutBroadcastError"],
  DEPRECATED: [
    "deprecatedWithBroadcastError",
    "deprecatedWithoutBroadcastError",
  ],
} as const satisfies Record<ConventionStatus, readonly string[]>;

export type ConventionSubStatus =
  (typeof subStatusesByStatus)[ConventionStatus][number];

export const getConventionSubStatus = (
  convention: ConventionReadDto,
  hasBroadcastError: boolean,
): ConventionSubStatus => {
  const isConventionEndingInMoreThanOneDay =
    isConventionEndingInOneDayOrMore(convention);
  const isSingleValidation =
    !convention.agencyRefersTo &&
    convention.agencyCounsellorEmails.length === 0;
  const hasAssessment = !!convention.assessment;
  const conventionAlreadyStarted = isConventionAlreadyStarted(convention);

  return match({
    status: convention.status,
    hasBroadcastError,
    isSingleValidation,
    hasAssessment,
    conventionAlreadyStarted,
    isConventionEndingInMoreThanOneDay,
  })
    .with(
      {
        status: "READY_TO_SIGN",
        hasBroadcastError: true,
      },
      (): ConventionSubStatus => "readyToSignWithBroadcastError",
    )
    .with(
      {
        status: "READY_TO_SIGN",
        hasBroadcastError: false,
      },
      (): ConventionSubStatus => "readyToSignWithoutBroadcastError",
    )
    .with(
      {
        status: "PARTIALLY_SIGNED",
        hasBroadcastError: true,
      },
      (): ConventionSubStatus => "partiallySignedWithBroadcastError",
    )
    .with(
      {
        status: "PARTIALLY_SIGNED",
        hasBroadcastError: false,
      },
      (): ConventionSubStatus => "partiallySignedWithoutBroadcastError",
    )
    .with(
      {
        status: "ACCEPTED_BY_COUNSELLOR",
        hasBroadcastError: true,
      },
      (): ConventionSubStatus => "acceptedByCounsellorWithBroadcastError",
    )
    .with(
      {
        status: "ACCEPTED_BY_COUNSELLOR",
        hasBroadcastError: false,
      },
      (): ConventionSubStatus => "acceptedByCounsellorWithoutBroadcastError",
    )
    .with(
      {
        status: "REJECTED",
        hasBroadcastError: true,
      },
      (): ConventionSubStatus => "rejectedWithBroadcastError",
    )
    .with(
      {
        status: "REJECTED",
        hasBroadcastError: false,
      },
      (): ConventionSubStatus => "rejectedWithoutBroadcastError",
    )
    .with(
      {
        status: "CANCELLED",
        hasBroadcastError: true,
      },
      (): ConventionSubStatus => "cancelledWithBroadcastError",
    )
    .with(
      {
        status: "CANCELLED",
        hasBroadcastError: false,
      },
      (): ConventionSubStatus => "cancelledWithoutBroadcastError",
    )
    .with(
      {
        status: "DEPRECATED",
        hasBroadcastError: true,
      },
      (): ConventionSubStatus => "deprecatedWithBroadcastError",
    )
    .with(
      {
        status: "DEPRECATED",
        hasBroadcastError: false,
      },
      (): ConventionSubStatus => "deprecatedWithoutBroadcastError",
    )
    .with(
      {
        status: "IN_REVIEW",
        hasBroadcastError: true,
        isSingleValidation: true,
      },
      (): ConventionSubStatus =>
        "inReviewWithSingleValidationWithBroadcastError",
    )
    .with(
      {
        status: "IN_REVIEW",
        hasBroadcastError: false,
        isSingleValidation: true,
      },
      (): ConventionSubStatus =>
        "inReviewWithSingleValidationWithoutBroadcastError",
    )
    .with(
      {
        status: "IN_REVIEW",
        hasBroadcastError: true,
        isSingleValidation: false,
      },
      (): ConventionSubStatus =>
        "inReviewWithDoubleValidationWithBroadcastError",
    )
    .with(
      {
        status: "IN_REVIEW",
        hasBroadcastError: false,
        isSingleValidation: false,
      },
      (): ConventionSubStatus =>
        "inReviewWithDoubleValidationWithoutBroadcastError",
    )
    .with(
      {
        status: "ACCEPTED_BY_VALIDATOR",
        hasAssessment: true,
      },
      ({ hasBroadcastError }): ConventionSubStatus =>
        hasBroadcastError
          ? "acceptedByValidatorWithAssessmentWithBroadcastError"
          : "acceptedByValidatorWithAssessmentWithoutBroadcastError",
    )
    .with(
      {
        status: "ACCEPTED_BY_VALIDATOR",
        hasAssessment: false,
        conventionAlreadyStarted: true,
        isConventionEndingInMoreThanOneDay: true,
      },
      ({ hasBroadcastError }): ConventionSubStatus =>
        hasBroadcastError
          ? "acceptedByValidatorWithoutAssessmentDidStartEndingInOneDayOrMoreWithBroadcastError"
          : "acceptedByValidatorWithoutAssessmentDidStartEndingInOneDayOrMoreWithoutBroadcastError",
    )
    .with(
      {
        status: "ACCEPTED_BY_VALIDATOR",
        hasAssessment: false,
        conventionAlreadyStarted: true,
        isConventionEndingInMoreThanOneDay: false,
      },
      ({ hasBroadcastError }): ConventionSubStatus =>
        hasBroadcastError
          ? "acceptedByValidatorWithoutAssessmentDidStartEndingTomorrowOrAlreadyEndedWithBroadcastError"
          : "acceptedByValidatorWithoutAssessmentDidStartEndingTomorrowOrAlreadyEndedWithoutBroadcastError",
    )

    .with(
      {
        status: "ACCEPTED_BY_VALIDATOR",
        hasAssessment: false,
        conventionAlreadyStarted: false,
      },
      ({ hasBroadcastError }): ConventionSubStatus =>
        hasBroadcastError
          ? "acceptedByValidatorWithoutAssessmentDidNotStartWithBroadcastError"
          : "acceptedByValidatorWithoutAssessmentDidNotStartWithoutBroadcastError",
    )
    .exhaustive();
};
