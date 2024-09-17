import { partition } from "ramda";
import {
  AgencyDto,
  AgencyGroup,
  AgencyRight,
  InclusionConnectedUser,
  activeAgencyStatuses,
  agencyRoleIsNotToReview,
  errors,
} from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UserAuthenticatedPayload } from "../../core/events/events";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

const userAuthenticatedSchema: z.Schema<UserAuthenticatedPayload> = z.object({
  userId: z.string(),
  provider: z.literal("inclusionConnect"),
  codeSafir: z.string().or(z.null()),
});

export class LinkFranceTravailUsersToTheirAgencies extends TransactionalUseCase<UserAuthenticatedPayload> {
  inputSchema = userAuthenticatedSchema;

  protected async _execute(
    { userId, codeSafir }: UserAuthenticatedPayload,
    uow: UnitOfWork,
  ): Promise<void> {
    if (!codeSafir) return;
    const icUser = await uow.userRepository.getById(
      userId,
      oAuthProviderByFeatureFlags(await uow.featureFlagRepository.getAll()),
    );
    if (!icUser) throw errors.user.notFound({ userId });

    if (isIcUserAlreadyHasValidRight(icUser, codeSafir)) return;

    const agency: AgencyDto | undefined =
      await uow.agencyRepository.getBySafir(codeSafir);
    if (agency && activeAgencyStatuses.includes(agency.status)) {
      await uow.userRepository.updateAgencyRights({
        userId,
        agencyRights: [
          ...icUser.agencyRights.filter(
            (agencyRight) => agencyRight.agency.codeSafir !== codeSafir,
          ),
          { agency, roles: ["validator"], isNotifiedByEmail: false },
        ],
      });
      return;
    }
    const agencyGroup: AgencyGroup | undefined =
      await uow.agencyGroupRepository.getByCodeSafir(codeSafir);

    if (agencyGroup) {
      const agencies = await uow.agencyRepository.getByIds(
        agencyGroup.agencyIds,
      );

      const [agencyRightsWithConflicts, agencyRightsWithoutConflicts] =
        partition(
          ({ agency }) => agencyGroup.agencyIds.includes(agency.id),
          icUser.agencyRights,
        );

      await uow.userRepository.updateAgencyRights({
        userId,
        agencyRights: [
          ...agencyRightsWithoutConflicts,
          ...agencies
            .filter((agency) => activeAgencyStatuses.includes(agency.status))
            .map((agency): AgencyRight => {
              const existingAgencyRight = agencyRightsWithConflicts.find(
                (agencyRight) => agencyRight.agency.id === agency.id,
              );
              if (
                existingAgencyRight &&
                agencyRoleIsNotToReview(existingAgencyRight.roles)
              )
                return existingAgencyRight;

              return {
                agency,
                roles: ["agency-viewer"],
                isNotifiedByEmail: false,
              };
            }),
        ],
      });
      return;
    }
  }
}

const isIcUserAlreadyHasValidRight = (
  icUser: InclusionConnectedUser,
  codeSafir: string,
) =>
  icUser.agencyRights.some(
    ({ agency, roles }) =>
      agency.codeSafir === codeSafir && agencyRoleIsNotToReview(roles),
  );
