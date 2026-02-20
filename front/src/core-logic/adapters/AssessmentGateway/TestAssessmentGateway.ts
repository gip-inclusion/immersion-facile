import { type Observable, Subject } from "rxjs";
import type {
  AssessmentDto,
  ConventionId,
  ConventionSupportedJwt,
  DeleteAssessmentRequestDto,
  SignAssessmentRequestDto,
  WithConventionId,
} from "shared";
import type {
  AssessmentAndJwt,
  AssessmentGateway,
} from "src/core-logic/ports/AssessmentGateway";

export class TestAssessmentGateway implements AssessmentGateway {
  // test purpose
  public creationResponse$ = new Subject<void>();
  public signAssessmentResponse$ = new Subject<void>();
  public deleteAssessmentResponse$ = new Subject<void>();
  public getResponse$ = new Subject<AssessmentDto>();
  public sendAssessmentLinkResponse$ = new Subject<void>();

  public createAssessment$(_params: AssessmentAndJwt): Observable<void> {
    return this.creationResponse$;
  }

  public signAssessment$(
    _params: SignAssessmentRequestDto,
    _jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return this.signAssessmentResponse$;
  }

  public deleteAssessment$(
    _params: DeleteAssessmentRequestDto,
    _jwt: ConventionSupportedJwt,
  ): Observable<void> {
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
