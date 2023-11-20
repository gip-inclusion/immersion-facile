import { Observable, Subject } from "rxjs";
import {
  AssessmentAndJwt,
  AssessmentGateway,
} from "src/core-logic/ports/AssessmentGateway";

export class TestAssessmentGateway implements AssessmentGateway {
  // test purpose
  public creationResponse$ = new Subject<void>();

  public createAssessment(_params: AssessmentAndJwt): Observable<void> {
    return this.creationResponse$;
  }
}
