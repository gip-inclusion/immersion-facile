import {
  AgencyId,
  agencyIdsSchema,
  InclusionConnectDomainJwtPayload,
} from "shared";
import {
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
    const agencyId = agencyIds[0];
    const agency = await uow.agencyRepository.getById(agencyId);
    if (!agency)
      throw new NotFoundError(`Agency not found with id: ${agencyId}`);

    user.agencyRights.push({ agency, role: "toReview" });

    const event = this.createNewEvent({
      topic: "AgencyRegisteredToInclusionConnectedUser",
      payload: { userId: user.id, agencyId: agency.id },
    });

    await Promise.all([
      uow.inclusionConnectedUserRepository.update(user),
      uow.outboxRepository.save(event),
    ]);
  }
}
