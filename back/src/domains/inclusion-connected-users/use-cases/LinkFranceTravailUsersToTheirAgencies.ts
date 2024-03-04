import { partition } from "ramda";
import {
  AgencyDto,
  AgencyGroup,
  AgencyRight,
  InclusionConnectedUser,
} from "shared";
import { z } from "zod";
import { NotFoundError } from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
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

    const icUser = await uow.inclusionConnectedUserRepository.getById(userId);
    if (!icUser)
      throw new NotFoundError(`Inclusion Connect user '${userId}' not found.`);

    if (isIcUserAlreadyHasValidRight(icUser, codeSafir)) return;

    const agency: AgencyDto | undefined =
      await uow.agencyRepository.getBySafir(codeSafir);
    if (agency) {
      await uow.inclusionConnectedUserRepository.update({
        ...icUser,
        agencyRights: [
          ...icUser.agencyRights.filter(
            (agencyRight) => agencyRight.agency.codeSafir !== codeSafir,
          ),
          { agency, role: "validator" },
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

      await uow.inclusionConnectedUserRepository.update({
        ...icUser,
        agencyRights: [
          ...agencyRightsWithoutConflicts,
          ...agencies.map((agency): AgencyRight => {
            const existingAgencyRight = agencyRightsWithConflicts.find(
              (agencyRight) => agencyRight.agency.id === agency.id,
            );
            if (existingAgencyRight && existingAgencyRight.role !== "toReview")
              return existingAgencyRight;

            return { agency, role: "counsellor" };
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
    ({ agency, role }) => agency.codeSafir === codeSafir && role !== "toReview",
  );
