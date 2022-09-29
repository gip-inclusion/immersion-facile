import { AbsoluteUrl, AgencyId } from "shared";
import { z } from "zod";
import { UseCase } from "../../core/UseCase";
import { DashboardGateway } from "../port/DashboardGateway";

export class AgencyDashboard extends UseCase<AgencyId, AbsoluteUrl> {
  constructor(private dashboardGateway: DashboardGateway) {
    super();
  }

  inputSchema = z.string();

  // eslint-disable-next-line @typescript-eslint/require-await
  public async _execute(agency: AgencyId): Promise<AbsoluteUrl> {
    return this.dashboardGateway.getAgencyUrl(agency);
  }
}
