import type { Observable } from "rxjs";
import type {
  AssessmentDto,
  ConventionId,
  ConventionSupportedJwt,
  DeleteAssessmentRequestDto,
  LegacyAssessmentDto,
  WithConventionId,
} from "shared";

export type AssessmentAndJwt = {
  assessment: AssessmentDto;
  jwt: string;
};

export interface AssessmentGateway {
  createAssessment$(params: AssessmentAndJwt): Observable<void>;
  deleteAssessment$(
    params: DeleteAssessmentRequestDto,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;
  getAssessment$(params: {
    conventionId: ConventionId;
    jwt: string;
  }): Observable<AssessmentDto | LegacyAssessmentDto>;
  sendAssessmentLink$(
    params: WithConventionId,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;
}
