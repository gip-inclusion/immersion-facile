import { Observable } from "rxjs";
import { ImmersionAssessmentDto } from "src/../../shared/src/immersionAssessment/ImmersionAssessmentDto";
import { ImmersionAssessmentGateway } from "src/core-logic/ports/ImmersionAssessmentGateway";

export class HttpImmersionAssessmentGateway
  implements ImmersionAssessmentGateway
{
  createAssessment(_payload: ImmersionAssessmentDto): Observable<void> {
    throw new Error("Method not implemented.");
  }
}
