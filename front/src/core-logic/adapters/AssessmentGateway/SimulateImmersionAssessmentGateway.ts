import { Observable, of, delay } from "rxjs";
import { ImmersionAssessmentDto } from "src/../../shared/src/immersionAssessment/ImmersionAssessmentDto";
import { ImmersionAssessmentGateway } from "src/core-logic/ports/ImmersionAssessmentGateway";

export class SimulateImmersionAssessmentGateway
  implements ImmersionAssessmentGateway
{
  constructor(private latency: number = 0) {}

  createAssessment(_payload: ImmersionAssessmentDto): Observable<void> {
    return of(undefined).pipe(delay(this.latency));
  }
}
