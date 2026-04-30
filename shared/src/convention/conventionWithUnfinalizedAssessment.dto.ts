import type { DateString } from "../utils/date";
import type {
  ConventionAssessmentFields,
  ConventionId,
} from "./convention.dto";
import type { WithFirstnameAndLastname } from "./convention.schema";

export type ConventionWithUnfinalizedAssessment = {
  id: ConventionId;
  dateEnd: DateString;
  beneficiary: WithFirstnameAndLastname;
  assessment: ConventionAssessmentFields["assessment"];
};
