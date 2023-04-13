import { Observable } from "rxjs";

import { AbsoluteUrl } from "shared";

export interface InclusionConnectedGateway {
  getMyAgencyDashboardUrl$(token: string): Observable<AbsoluteUrl>;
}
