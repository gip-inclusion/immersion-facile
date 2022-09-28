import { Observable } from "rxjs";
import { ImmersionAssessmentDto } from "shared";

export type AssessmentAndJwt = {
  assessment: ImmersionAssessmentDto;
  jwt: string;
};

export interface ImmersionAssessmentGateway {
  createAssessment(params: AssessmentAndJwt): Observable<void>;
}
