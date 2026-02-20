import type { Observable } from "rxjs";
import type {
  AssessmentDto,
  ConventionId,
  ConventionSupportedJwt,
  DeleteAssessmentRequestDto,
  LegacyAssessmentDto,
  SignAssessmentRequestDto,
  WithConventionId,
} from "shared";

export type AssessmentAndJwt = {
  assessment: AssessmentDto;
  jwt: string;
};

export interface AssessmentGateway {
  createAssessment$(params: AssessmentAndJwt): Observable<void>;
  signAssessment$(
    params: SignAssessmentRequestDto,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;
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
