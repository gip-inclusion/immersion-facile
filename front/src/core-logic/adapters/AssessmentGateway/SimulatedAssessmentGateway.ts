import { delay, type Observable, of, throwError } from "rxjs";
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

export const failedId = "failed-id";
export const failedIdError = new Error("Failed Id");

export class SimulatedAssessmentGateway implements AssessmentGateway {
  constructor(private latency = 0) {}

  public createAssessment$({ assessment }: AssessmentAndJwt): Observable<void> {
    return assessment.conventionId === failedId
      ? throwError(failedIdError)
      : of(undefined).pipe(delay(this.latency));
  }

  public deleteAssessment$({
    conventionId,
  }: {
    conventionId: ConventionId;
    deleteAssessmentJustification: string;
    jwt: string;
  }): Observable<void> {
    return conventionId === failedId
      ? throwError(failedIdError)
      : of(undefined).pipe(delay(this.latency));
  }

  public getAssessment$({
    conventionId,
  }: {
    conventionId: ConventionId;
    jwt: string;
  }): Observable<AssessmentDto> {
    return of({
      conventionId,
      status: "COMPLETED",
      endedWithAJob: false,
      establishmentAdvices: "my advices",
      establishmentFeedback: "my feedback",
    });
  }

  public sendAssessmentLink$(
    _params: WithConventionId,
    _jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return of(undefined).pipe(delay(this.latency));
  }
}
