import { Observable, delay, of, throwError } from "rxjs";
import {
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
}
