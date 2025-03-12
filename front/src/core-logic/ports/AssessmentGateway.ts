import type { Observable } from "rxjs";
import type { AssessmentDto, ConventionId } from "shared";

export type AssessmentAndJwt = {
  assessment: AssessmentDto;
  jwt: string;
};

export interface AssessmentGateway {
  createAssessment$(params: AssessmentAndJwt): Observable<void>;
  getAssessment$(params: {
    conventionId: ConventionId;
    jwt: string;
  }): Observable<AssessmentDto>;
}
