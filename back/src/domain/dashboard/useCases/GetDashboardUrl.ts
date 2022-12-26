import { AbsoluteUrl, GetDashboardParams, getDashboardParams } from "shared";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UseCase } from "../../core/UseCase";
import { DashboardGateway } from "../port/DashboardGateway";

export class GetDashboardUrl extends UseCase<GetDashboardParams, AbsoluteUrl> {
  constructor(
    private dashboardGateway: DashboardGateway,
    private timeGateway: TimeGateway,
  ) {
    super();
  }

  inputSchema = getDashboardParams;

  // eslint-disable-next-line @typescript-eslint/require-await
  public async _execute(params: GetDashboardParams): Promise<AbsoluteUrl> {
    if (params.name === "agency")
      return this.dashboardGateway.getAgencyUrl(
        params.agencyId,
        this.timeGateway.now(),
      );
    if (params.name === "conventionStatus")
      return this.dashboardGateway.getConventionStatusUrl(
        params.conventionId,
        this.timeGateway.now(),
      );
    return this.dashboardGateway.getDashboardUrl(
      params.name,
      this.timeGateway.now(),
    );
  }
}
