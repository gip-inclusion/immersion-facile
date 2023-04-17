import {
  AgencyId,
  agencyIdsSchema,
  InclusionConnectDomainJwtPayload,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../../core/eventBus/EventBus";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";

export class RegisterAgencyToInclusionConnectUser extends TransactionalUseCase<
  AgencyId[],
  void,
  InclusionConnectDomainJwtPayload
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  inputSchema = agencyIdsSchema;

  protected async _execute(
    agencyIds: AgencyId[],
    uow: UnitOfWork,
    inclusionConnectedPayload: InclusionConnectDomainJwtPayload,
  ): Promise<void> {
    if (!inclusionConnectedPayload)
      throw new ForbiddenError("No JWT token provided");

    const user = await uow.inclusionConnectedUserRepository.getById(
      inclusionConnectedPayload.userId,
    );
    if (!user)
      throw new NotFoundError(
        `User not found with id: ${inclusionConnectedPayload.userId}`,
      );
    if (user.agencyRights.length > 0) {
      throw new BadRequestError(
        `This user (userId: ${user.id}), already has agencies rights.`,
      );
    }

    const agencies = await uow.agencyRepository.getByIds(agencyIds);
    if (agencies.length !== agencyIds.length) {
      const agenciesFoundMessage = agencies.length
        ? `Found only : ${agencies.map((agency) => agency.id).join(", ")}.`
        : "No agencies found.";

      throw new BadRequestError(
        [
          `Some agencies not found with ids : ${agencyIds.join(", ")}. `,
          agenciesFoundMessage,
        ].join(""),
      );
    }

    user.agencyRights = agencies.map((agency) => ({
      agency,
      role: "toReview",
    }));

    const event = this.createNewEvent({
      topic: "AgencyRegisteredToInclusionConnectedUser",
      payload: { userId: user.id, agencyIds },
    });

    await Promise.all([
      uow.inclusionConnectedUserRepository.update(user),
      uow.outboxRepository.save(event),
    ]);
  }
}
