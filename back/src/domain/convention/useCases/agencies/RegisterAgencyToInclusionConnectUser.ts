import {
  InclusionConnectDomainJwtPayload,
  RegisterAgencyToInclusionConnectUserParams,
  registerAgencyToInclusionConnectUserParamsSchema,
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
  RegisterAgencyToInclusionConnectUserParams,
  void,
  InclusionConnectDomainJwtPayload
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  inputSchema = registerAgencyToInclusionConnectUserParamsSchema;

  protected async _execute(
    dto: RegisterAgencyToInclusionConnectUserParams,
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

    const agency = await uow.agencyRepository.getById(dto.agencyId);
    if (!agency)
      throw new NotFoundError(`Agency not found with id: ${dto.agencyId}`);

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
