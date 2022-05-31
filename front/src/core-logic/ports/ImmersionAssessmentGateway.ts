import { Observable } from "rxjs";
import { ImmersionAssessmentDto } from "shared/src/immersionAssessment/ImmersionAssessmentDto";

export interface ImmersionAssessmentGateway {
  createAssessment(payload: ImmersionAssessmentDto): Observable<void>;
}
