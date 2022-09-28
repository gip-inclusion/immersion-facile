import { AbsoluteUrl } from "shared";
import { z } from "zod";
import { UseCase } from "../../core/UseCase";
import { DashboardGateway } from "../port/DashboardGateway";

export class ConventionDashboard extends UseCase<void, AbsoluteUrl> {
  constructor(private dashboardGateway: DashboardGateway) {
    super();
  }

  inputSchema = z.void();

  // eslint-disable-next-line @typescript-eslint/require-await
  public async _execute(): Promise<AbsoluteUrl> {
    return this.dashboardGateway.getConventionsUrl();
  }
}
