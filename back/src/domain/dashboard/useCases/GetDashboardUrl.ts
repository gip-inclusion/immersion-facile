import { AbsoluteUrl, DashboardName, dashboardNameSchema } from "shared";
import { UseCase } from "../../core/UseCase";
import { DashboardGateway } from "../port/DashboardGateway";

export class GetDashboardUrl extends UseCase<DashboardName, AbsoluteUrl> {
  constructor(private dashboardGateway: DashboardGateway) {
    super();
  }

  inputSchema = dashboardNameSchema;

  // eslint-disable-next-line @typescript-eslint/require-await
  public async _execute(dashboardName: DashboardName): Promise<AbsoluteUrl> {
    return this.dashboardGateway.getDashboardUrl(dashboardName);
  }
}
