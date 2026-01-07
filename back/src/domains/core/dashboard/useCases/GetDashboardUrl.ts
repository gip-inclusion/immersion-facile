import {
  type AbsoluteUrl,
  type ConnectedUser,
  type ConventionDomainJwtPayload,
  type DashboardUrlAndName,
  errors,
  type GetDashboardParams,
  getDashboardParams,
} from "shared";
import { throwIfNotAdmin } from "../../../connected-users/helpers/authorization.helper";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { UseCase } from "../../UseCase";
import type { DashboardGateway } from "../port/DashboardGateway";

export class GetDashboardUrl extends UseCase<
  GetDashboardParams,
  DashboardUrlAndName,
  ConnectedUser | ConventionDomainJwtPayload
> {
  protected inputSchema = getDashboardParams;

  readonly #dashboardGateway: DashboardGateway;

  readonly #timeGateway: TimeGateway;

  constructor(dashboardGateway: DashboardGateway, timeGateway: TimeGateway) {
    super();

    this.#dashboardGateway = dashboardGateway;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    params: GetDashboardParams,
    currentUser: ConnectedUser | ConventionDomainJwtPayload,
  ): Promise<DashboardUrlAndName> {
    if (!currentUser) throw errors.user.unauthorized();

    if ("applicationId" in currentUser) {
      if (params.name !== "conventionStatus") throw errors.user.unauthorized();
      if (currentUser.applicationId !== params.conventionId)
        throw errors.user.unauthorized();

      return {
        name: params.name,
        url: this.#dashboardGateway.getConventionStatusUrl(
          params.conventionId,
          this.#timeGateway.now(),
        ),
      };
    }

    throwIfNotAdmin(currentUser);
    return {
      url: this.#getAdminDashboardAbsoluteUrl(params),
      name: params.name,
    };
  }

  #getAdminDashboardAbsoluteUrl(params: GetDashboardParams): AbsoluteUrl {
    if (params.name === "adminAgencyDetails")
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
      throw errors.dashboard.establishmentConventionForbidden();

    return this.#dashboardGateway.getAdminDashboardUrl(
      params.name,
      this.#timeGateway.now(),
    );
  }
}
