import { Observable } from "rxjs";
import { ImmersionAssessmentDto } from "src/../../shared/src/immersionAssessment/ImmersionAssessmentDto";

export interface ImmersionAssessmentGateway {
  createAssessment(payload: ImmersionAssessmentDto): Observable<void>;
}
