import {
  AbsoluteUrl,
  ConventionsEstablishmentDashboard,
  EstablishmentDashboards,
  InclusionConnectJwtPayload,
  InclusionConnectedUser,
  WithDashboardUrls,
  WithEstablismentsSiretAndName,
} from "shared";
import { z } from "zod";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { DashboardGateway } from "../../core/dashboard/port/DashboardGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

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
    const establishments = await this.#withEstablishments(uow, user);
    return {
      ...user,
      ...(await this.#withEstablishmentDashboards(user, uow)),
      ...(establishments.length > 0 ? { establishments } : {}),
    };
  }

  async #makeConventionEstablishmentDashboard(
    uow: UnitOfWork,
    user: InclusionConnectedUser,
  ): Promise<ConventionsEstablishmentDashboard | undefined> {
    const hasConventionForEstablishmentRepresentative =
      (
        await uow.conventionRepository.getIdsByEstablishmentRepresentativeEmail(
          user.email,
        )
      ).length > 0;

    const hasConventionForEstablishmentTutor =
      (
        await uow.conventionRepository.getIdsByEstablishmentTutorEmail(
          user.email,
        )
      ).length > 0;

    return hasConventionForEstablishmentRepresentative ||
      hasConventionForEstablishmentTutor
      ? {
          url: await this.#dashboardGateway.getEstablishmentConventionsDashboardUrl(
            user.id,
            this.#timeGateway.now(),
          ),
          role: hasConventionForEstablishmentRepresentative
            ? "establishment-representative"
            : "establishment-tutor",
        }
      : undefined;
  }

  async #makeDiscussionsEstablishmentDashboard(
    uow: UnitOfWork,
    user: InclusionConnectedUser,
  ): Promise<AbsoluteUrl | undefined> {
    return (await uow.discussionRepository.hasDiscussionMatching({
      establishmentRepresentativeEmail: user.email,
    }))
      ? this.#dashboardGateway.getEstablishmentDiscussionsDashboardUrl(
          user.id,
          this.#timeGateway.now(),
        )
      : undefined;
  }

  async #withEstablishments(
    uow: UnitOfWork,
    user: InclusionConnectedUser,
  ): Promise<WithEstablismentsSiretAndName[]> {
    const establishementAggregates =
      await uow.establishmentAggregateRepository.getEstablishmentAggregates({
        contactEmail: user.email,
      });

    return establishementAggregates.map(({ establishment }) => ({
      siret: establishment.siret,
      businessName: establishment.customizedName ?? establishment.name,
    }));
  }

  async #makeEstablishmentDashboard(
    user: InclusionConnectedUser,
    uow: UnitOfWork,
  ): Promise<EstablishmentDashboards> {
    const conventions = await this.#makeConventionEstablishmentDashboard(
      uow,
      user,
    );
    const discussions = await this.#makeDiscussionsEstablishmentDashboard(
      uow,
      user,
    );
    return {
      ...(conventions ? { conventions } : {}),
      ...(discussions ? { discussions } : {}),
    };
  }

  async #withEstablishmentDashboards(
    user: InclusionConnectedUser,
    uow: UnitOfWork,
  ): Promise<WithDashboardUrls> {
    const agencyIdsWithEnoughPrivileges = user.agencyRights
      .filter(({ role }) => role !== "toReview")
      .map(({ agency }) => agency.id);

    const hasAtLeastOnePeAgency = user.agencyRights.some(
      ({ agency }) => agency.kind === "pole-emploi",
    );

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
      establishmentDashboards: await this.#makeEstablishmentDashboard(
        user,
        uow,
      ),
    };
  }
}
