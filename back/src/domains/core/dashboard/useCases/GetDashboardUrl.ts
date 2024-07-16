import {
  AbsoluteUrl,
  DashboardUrlAndName,
  GetDashboardParams,
  getDashboardParams,
} from "shared";
import { ForbiddenError } from "shared";
import { UseCase } from "../../UseCase";
import { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { DashboardGateway } from "../port/DashboardGateway";

export class GetDashboardUrl extends UseCase<
  GetDashboardParams,
  DashboardUrlAndName
> {
  protected inputSchema = getDashboardParams;

  readonly #dashboardGateway: DashboardGateway;

  readonly #timeGateway: TimeGateway;

  constructor(dashboardGateway: DashboardGateway, timeGateway: TimeGateway) {
    super();

    this.#dashboardGateway = dashboardGateway;
    this.#timeGateway = timeGateway;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async _execute(
    params: GetDashboardParams,
  ): Promise<DashboardUrlAndName> {
    return {
      url: this.#getDashboardAbsoluteUrl(params),
      name: params.name,
    };
  }

  #getDashboardAbsoluteUrl(params: GetDashboardParams): AbsoluteUrl {
    if (params.name === "agencyForAdmin")
      return this.#dashboardGateway.getAgencyForAdminUrl(
        params.agencyId,
        this.#timeGateway.now(),
      );

    if (params.name === "conventionStatus")
      return this.#dashboardGateway.getConventionStatusUrl(
        params.conventionId,
        this.#timeGateway.now(),
      );

    if (params.name === "establishmentRepresentativeConventions")
      throw new ForbiddenError(
        "establishmentRepresentativeConventions is not available for GetDashboardUrl",
      );

    return this.#dashboardGateway.getDashboardUrl(
      params.name,
      this.#timeGateway.now(),
    );
  }
}
