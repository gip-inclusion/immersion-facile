import {
  AssessmentDto,
  ConventionDto,
  ConventionStatus,
  calculateTotalImmersionHoursBetweenDateComplex,
  errors,
} from "shared";
import { EntityFromDto } from "../../../utils/EntityFromDto";

export type AssessmentEntity = EntityFromDto<AssessmentDto, "Assessment"> & {
  numberOfHoursActuallyMade: number | null;
};

export const acceptedConventionStatusesForAssessment: ConventionStatus[] = [
  "ACCEPTED_BY_VALIDATOR",
];

const calculateNumberOfHoursActuallyMade = (
  assessment: AssessmentDto,
  convention: ConventionDto,
): number => {
  if (assessment.status === "DID_NOT_SHOW") return 0;
  if (assessment.status === "COMPLETED") return convention.schedule.totalHours;

  return (
    calculateTotalImmersionHoursBetweenDateComplex({
      complexSchedule: convention.schedule.complexSchedule,
      dateStart: convention.dateStart,
      dateEnd: assessment.lastDayOfPresence ?? convention.dateEnd,
    }) - assessment.numberOfMissedHours
  );
};

export const createAssessmentEntity = (
  assessment: AssessmentDto,
  convention: ConventionDto,
): AssessmentEntity => {
  if (!acceptedConventionStatusesForAssessment.includes(convention.status))
    throw errors.assessment.badStatus(convention.status);

  return {
    _entityName: "Assessment",
    ...assessment,
    numberOfHoursActuallyMade: calculateNumberOfHoursActuallyMade(
      assessment,
      convention,
    ),
  };
};

export const toAssessmentDto = ({
  _entityName,
  numberOfHoursActuallyMade: _,
  ...assessmentEntity
}: AssessmentEntity): AssessmentDto => assessmentEntity;
