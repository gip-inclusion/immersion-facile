import type { Observable } from "rxjs";
import type {
  AssessmentDto,
  AssessmentInputDto,
  ConventionId,
  ConventionJwt,
  ConventionSupportedJwt,
  DeleteAssessmentRequestDto,
  LegacyAssessmentDto,
  SignAssessmentRequestDto,
  WithConventionId,
} from "shared";

export interface AssessmentGateway {
  createAssessment$(
    params: AssessmentInputDto,
    jwt: ConventionJwt,
  ): Observable<void>;
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
