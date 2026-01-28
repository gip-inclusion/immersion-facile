import { type Observable, Subject } from "rxjs";
import type {
  AssessmentDto,
  ConventionId,
  ConventionSupportedJwt,
  WithConventionId,
} from "shared";
import type {
  AssessmentAndJwt,
  AssessmentGateway,
} from "src/core-logic/ports/AssessmentGateway";

export class TestAssessmentGateway implements AssessmentGateway {
  // test purpose
  public creationResponse$ = new Subject<void>();
  public deleteAssessmentResponse$ = new Subject<void>();
  public getResponse$ = new Subject<AssessmentDto>();
  public sendAssessmentLinkResponse$ = new Subject<void>();

  public createAssessment$(_params: AssessmentAndJwt): Observable<void> {
    return this.creationResponse$;
  }

  public deleteAssessment$(_params: {
    conventionId: ConventionId;
    deleteAssessmentJustification: string;
    jwt: string;
  }): Observable<void> {
    return this.deleteAssessmentResponse$;
  }

  public getAssessment$(_input: {
    conventionId: ConventionId;
    jwt: string;
  }): Observable<AssessmentDto> {
    return this.getResponse$;
  }

  public sendAssessmentLink$(
    _params: WithConventionId,
    _jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return this.sendAssessmentLinkResponse$;
  }
}
