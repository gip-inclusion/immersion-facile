import {
  AbsoluteUrl,
  AgencyDashboards,
  ConventionsEstablishmentDashboard,
  EstablishmentDashboards,
  InclusionConnectedUser,
  WithDashboards,
  WithEstablismentsSiretAndName,
  WithOptionalUserId,
  agencyRoleIsNotToReview,
  errors,
  withOptionalUserIdSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { DashboardGateway } from "../../core/dashboard/port/DashboardGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

export class GetInclusionConnectedUser extends TransactionalUseCase<
  WithOptionalUserId,
  InclusionConnectedUser,
  InclusionConnectedUser
> {
  protected inputSchema = withOptionalUserIdSchema;

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
    params: WithOptionalUserId,
    uow: UnitOfWork,
    currentUser?: InclusionConnectedUser,
  ): Promise<InclusionConnectedUser> {
    if (!currentUser) throw errors.user.noJwtProvided();

    if (params.userId) throwIfNotAdmin(currentUser);

    const userIdToFetch = params.userId ?? currentUser.id;

    const user = await uow.userRepository.getById(
      userIdToFetch,
      oAuthProviderByFeatureFlags(await uow.featureFlagRepository.getAll()),
    );
    if (!user) throw errors.user.notFound({ userId: userIdToFetch });
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
    const establishmentAggregates =
      await uow.establishmentAggregateRepository.getEstablishmentAggregatesByFilters(
        {
          contactEmail: user.email,
        },
      );

    return establishmentAggregates.map(({ establishment }) => ({
      siret: establishment.siret,
      businessName: establishment.customizedName
        ? establishment.customizedName
        : establishment.name,
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
  ): Promise<WithDashboards> {
    return {
      dashboards: {
        agencies: await this.makeAgencyDashboards(user),
        establishments: await this.#makeEstablishmentDashboard(user, uow),
      },
    };
  }

  private async makeAgencyDashboards(
    user: InclusionConnectedUser,
  ): Promise<AgencyDashboards> {
    const agencyIdsWithEnoughPrivileges = user.agencyRights
      .filter(({ roles }) => agencyRoleIsNotToReview(roles))
      .map(({ agency }) => agency.id);

    return {
      ...(agencyIdsWithEnoughPrivileges.length > 0
        ? {
            agencyDashboardUrl: await this.#dashboardGateway.getAgencyUserUrl(
              user.id,
              this.#timeGateway.now(),
            ),
          }
        : {}),
      ...(agencyIdsWithEnoughPrivileges.length > 0
        ? {
            erroredConventionsDashboardUrl:
              await this.#dashboardGateway.getErroredConventionsDashboardUrl(
                user.id,
                this.#timeGateway.now(),
              ),
          }
        : {}),
    };
  }
}
