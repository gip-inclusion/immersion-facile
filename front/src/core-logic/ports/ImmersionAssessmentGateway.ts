import { Observable } from "rxjs";
import { ImmersionAssessmentDto } from "shared/src/immersionAssessment/ImmersionAssessmentDto";

export type AssessmentAndJwt = {
  assessment: ImmersionAssessmentDto;
  jwt: string;
};

export interface ImmersionAssessmentGateway {
  createAssessment(params: AssessmentAndJwt): Observable<void>;
}
