import { AgencyDto, InclusionConnectedUser } from "shared";
import { z } from "zod";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { UserAuthenticatedPayload } from "../../core/eventBus/events";
import { UnitOfWork } from "../../core/ports/UnitOfWork";

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
    if (!agency) return;

    await uow.inclusionConnectedUserRepository.update({
      ...icUser,
      agencyRights: [
        ...icUser.agencyRights.filter(
          (agencyRight) => agencyRight.agency.codeSafir !== codeSafir,
        ),
        { agency, role: "validator" },
      ],
    });
  }
}

const isIcUserAlreadyHasValidRight = (
  icUser: InclusionConnectedUser,
  codeSafir: string,
) =>
  icUser.agencyRights.some(
    ({ agency, role }) => agency.codeSafir === codeSafir && role !== "toReview",
  );
