import { AbsoluteUrl, GetDashboardParams, getDashboardParams } from "shared";
import { UseCase } from "../../core/UseCase";
import { DashboardGateway } from "../port/DashboardGateway";

export class GetDashboardUrl extends UseCase<GetDashboardParams, AbsoluteUrl> {
  constructor(private dashboardGateway: DashboardGateway) {
    super();
  }

  inputSchema = getDashboardParams;

  // eslint-disable-next-line @typescript-eslint/require-await
  public async _execute(params: GetDashboardParams): Promise<AbsoluteUrl> {
    if (params.name === "agency")
      return this.dashboardGateway.getAgencyUrl(params.agencyId);
    if (params.name === "conventionStatus")
      return this.dashboardGateway.getConventionStatusUrl(params.conventionId);
    return this.dashboardGateway.getDashboardUrl(params.name);
  }
}
