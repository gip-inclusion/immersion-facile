import { isBefore } from "date-fns";
import type { ConventionReadDto } from "shared";

export const isConventionAlreadyStarted = (convention: ConventionReadDto) =>
  isBefore(new Date(convention.dateStart), new Date());

export const canAssessmentBeFilled = (convention: ConventionReadDto) =>
  convention.status === "ACCEPTED_BY_VALIDATOR" &&
  isConventionAlreadyStarted(convention) &&
  !convention.assessment;
