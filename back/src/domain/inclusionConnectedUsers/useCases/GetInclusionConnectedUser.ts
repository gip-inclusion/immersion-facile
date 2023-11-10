import { z } from "zod";
import {
  InclusionConnectedUser,
  InclusionConnectJwtPayload,
  WithDashboardUrls,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { DashboardGateway } from "../../dashboard/port/DashboardGateway";

export class GetInclusionConnectedUser extends TransactionalUseCase<
  void,
  InclusionConnectedUser,
  InclusionConnectJwtPayload
> {
  protected inputSchema = z.void();

  readonly #dashboardGateway: DashboardGateway;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    dashboardGateway: DashboardGateway,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);

    this.#dashboardGateway = dashboardGateway;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    _: void,
    uow: UnitOfWork,
    jwtPayload?: InclusionConnectJwtPayload,
  ): Promise<InclusionConnectedUser> {
    if (!jwtPayload) throw new ForbiddenError("No JWT token provided");
    const { userId } = jwtPayload;
    const user = await uow.inclusionConnectedUserRepository.getById(userId);
    if (!user)
      throw new NotFoundError(`No user found with provided ID : ${userId}`);

    return {
      ...user,
      ...(await this.#withAgencyDashboard(user, uow)),
    };
  }

  async #withAgencyDashboard(
    user: InclusionConnectedUser,
    uow: UnitOfWork,
  ): Promise<WithDashboardUrls> {
    const agencyIdsWithEnoughPrivileges = user.agencyRights
      .filter(({ role }) => role !== "toReview")
      .map(({ agency }) => agency.id);

    const hasAtLeastOnePeAgency = user.agencyRights.some(
      ({ agency }) => agency.kind === "pole-emploi",
    );

    const hasConventionForEstablishmentRepresentative =
      (
        await uow.conventionRepository.getIdsByEstablishmentRepresentativeEmail(
          user.email,
        )
      ).length > 0;

    return {
      ...(agencyIdsWithEnoughPrivileges.length > 0
        ? {
            agencyDashboardUrl: await this.#dashboardGateway.getAgencyUserUrl(
              agencyIdsWithEnoughPrivileges,
              this.#timeGateway.now(),
            ),
          }
        : {}),
      ...(agencyIdsWithEnoughPrivileges.length > 0 && hasAtLeastOnePeAgency
        ? {
            erroredConventionsDashboardUrl:
              await this.#dashboardGateway.getErroredConventionsDashboardUrl(
                agencyIdsWithEnoughPrivileges,
                this.#timeGateway.now(),
              ),
          }
        : {}),
      ...(hasConventionForEstablishmentRepresentative
        ? {
            establishmentRepresentativeDashboardUrl:
              await this.#dashboardGateway.getEstablishmentRepresentativeConventionsDashboardUrl(
                user.email,
                this.#timeGateway.now(),
              ),
          }
        : {}),
    };
  }
}
