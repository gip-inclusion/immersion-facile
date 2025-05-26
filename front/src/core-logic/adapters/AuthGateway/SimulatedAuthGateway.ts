import { type Observable, delay, of } from "rxjs";
import type { InitiateLoginByEmailParams } from "shared";
import type { AuthGateway } from "src/core-logic/ports/AuthGateway";

export class SimulatedAuthGateway implements AuthGateway {
  constructor(private simulatedLatency = 0) {}
  loginByEmail$(_params: InitiateLoginByEmailParams): Observable<void> {
    return of(undefined).pipe(delay(this.simulatedLatency));
  }
}
