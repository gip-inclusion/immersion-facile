import { type Observable, Subject } from "rxjs";
import type { AssessmentDto, ConventionId } from "shared";
import type {
  AssessmentAndJwt,
  AssessmentGateway,
} from "src/core-logic/ports/AssessmentGateway";

export class TestAssessmentGateway implements AssessmentGateway {
  // test purpose
  public creationResponse$ = new Subject<void>();
  public getResponse$ = new Subject<AssessmentDto>();

  public createAssessment$(_params: AssessmentAndJwt): Observable<void> {
    return this.creationResponse$;
  }

  public getAssessment$(_input: {
    conventionId: ConventionId;
    jwt: string;
  }): Observable<AssessmentDto> {
    return this.getResponse$;
  }
}
