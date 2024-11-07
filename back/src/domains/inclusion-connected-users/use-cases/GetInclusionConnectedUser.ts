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
  allowedAgencyKindToSynch,
  errors,
  withOptionalUserIdSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { DashboardGateway } from "../../core/dashboard/port/DashboardGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { getIcUserByUserId } from "../helpers/inclusionConnectedUser.helper";
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
    currentIcUser?: InclusionConnectedUser,
  ): Promise<InclusionConnectedUser> {
    if (!currentIcUser) throw errors.user.noJwtProvided();
    const provider = await makeProvider(uow);

    const currentUser = await uow.userRepository.getById(
      currentIcUser.id,
      provider,
    );
    if (params.userId) throwIfNotAdmin(currentUser);

    const userIdToFetch = params.userId ?? currentIcUser.id;

    const user = await uow.userRepository.getById(userIdToFetch, provider);
    if (!user) throw errors.user.notFound({ userId: userIdToFetch });

    const icUser = await getIcUserByUserId(uow, user.id);

    return {
      ...icUser,
      ...(await this.#withEstablishmentDashboards(icUser, uow)),
      ...(await this.#withEstablishments(uow, icUser)),
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

  async #withEstablishments(
    uow: UnitOfWork,
    user: InclusionConnectedUser,
  ): Promise<{ establishments?: WithEstablismentsSiretAndName[] }> {
    const establishmentAggregates =
      await uow.establishmentAggregateRepository.getEstablishmentAggregatesByFilters(
        {
          contactEmail: user.email,
        },
      );

    const establishments = establishmentAggregates.map(({ establishment }) => ({
      siret: establishment.siret,
      businessName: establishment.customizedName
        ? establishment.customizedName
        : establishment.name,
    }));
    return establishments.length ? { establishments } : {};
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

  private async makeAgencyDashboards(
    user: InclusionConnectedUser,
  ): Promise<AgencyDashboards> {
    const agencyIdsWithEnoughPrivileges = user.agencyRights
      .filter(({ roles }) => agencyRoleIsNotToReview(roles))
      .map(({ agency }) => agency.id);

    const isSynchronisationEnableForAgency = user.agencyRights.some(
      (agencyRights) =>
        allowedAgencyKindToSynch.includes(agencyRights.agency.kind),
    );

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
            erroredConventionsDashboardUrl: isSynchronisationEnableForAgency
              ? await this.#dashboardGateway.getErroredConventionsDashboardUrl(
                  user.id,
                  this.#timeGateway.now(),
                )
              : undefined,
          }
        : {}),
    };
  }
}
