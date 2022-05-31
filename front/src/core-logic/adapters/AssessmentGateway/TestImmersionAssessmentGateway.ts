import { Observable, Subject } from "rxjs";
import { ImmersionAssessmentDto } from "src/../../shared/src/immersionAssessment/ImmersionAssessmentDto";
import { ImmersionAssessmentGateway } from "src/core-logic/ports/ImmersionAssessmentGateway";

export class TestImmersionAssessmentGateway
  implements ImmersionAssessmentGateway
{
  createAssessment(_payload: ImmersionAssessmentDto): Observable<void> {
    return this.creationResponse$;
  }

  // test purpose
  public creationResponse$ = new Subject<void>();
}
