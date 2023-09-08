import { Observable, Subject } from "rxjs";
import {
  AssessmentAndJwt,
  ImmersionAssessmentGateway,
} from "src/core-logic/ports/ImmersionAssessmentGateway";

export class TestImmersionAssessmentGateway
  implements ImmersionAssessmentGateway
{
  // test purpose
  public creationResponse$ = new Subject<void>();

  public createAssessment(_params: AssessmentAndJwt): Observable<void> {
    return this.creationResponse$;
  }
}
