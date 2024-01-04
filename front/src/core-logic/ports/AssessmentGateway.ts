import { Observable } from "rxjs";
import { AssessmentDto } from "shared";

export type AssessmentAndJwt = {
  assessment: AssessmentDto;
  jwt: string;
};

export interface AssessmentGateway {
  createAssessment$(params: AssessmentAndJwt): Observable<void>;
}
