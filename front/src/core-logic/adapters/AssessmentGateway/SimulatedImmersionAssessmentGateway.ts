import { delay, Observable, of, throwError } from "rxjs";
import {
  AssessmentAndJwt,
  ImmersionAssessmentGateway,
} from "src/core-logic/ports/ImmersionAssessmentGateway";

export const failedId = "failed-id";
export const failedIdError = new Error("Failed Id");

export class SimulatedImmersionAssessmentGateway
  implements ImmersionAssessmentGateway
{
  constructor(private latency: number = 0) {}

  createAssessment({ assessment }: AssessmentAndJwt): Observable<void> {
    return assessment.conventionId === failedId
      ? throwError(failedIdError)
      : of(undefined).pipe(delay(this.latency));
  }
}
