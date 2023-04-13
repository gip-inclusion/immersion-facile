import { Observable, of } from "rxjs";
import { AbsoluteUrl } from "shared";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

export class SimulatedInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  getMyAgencyDashboardUrl$(_token: string): Observable<AbsoluteUrl> {
    return of("https://placeholder.com/");
  }
}
