import {
  InclusionConnectDomainJwtPayload,
  MarkPartnersErroredConventionAsHandledRequest,
  markPartnersErroredConventionAsHandledRequestSchema,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../../core/UseCase";
import { CreateNewEvent } from "../../../core/events/ports/EventBus";
import { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { conventionMissingMessage } from "../../entities/Convention";

export class MarkPartnersErroredConventionAsHandled extends TransactionalUseCase<
  MarkPartnersErroredConventionAsHandledRequest,
  void,
  InclusionConnectDomainJwtPayload
> {
  protected inputSchema = markPartnersErroredConventionAsHandledRequestSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    params: MarkPartnersErroredConventionAsHandledRequest,
    uow: UnitOfWork,
    payload: InclusionConnectDomainJwtPayload,
  ): Promise<void> {
    if (!payload) {
      throw new UnauthorizedError();
    }
    const { userId } = payload;
    const conventionToMarkAsHandled = await uow.conventionRepository.getById(
      params.conventionId,
    );
    if (!conventionToMarkAsHandled)
      throw new NotFoundError(conventionMissingMessage(params.conventionId));

    const icUser = await uow.inclusionConnectedUserRepository.getById(userId);
    if (!icUser)
      throw new NotFoundError(
        `User '${userId}' not found on inclusion connected user repository.`,
      );
    const userAgencyRights = icUser.agencyRights.find(
      (agencyRight) =>
        agencyRight.agency.id === conventionToMarkAsHandled.agencyId,
    );
    if (!userAgencyRights)
      throw new ForbiddenError(
        `User '${userId}' has no role on agency '${conventionToMarkAsHandled.agencyId}'.`,
      );

    const conventionMarkAsHandledAt = this.timeGateway.now().toISOString();

    await uow.errorRepository.markPartnersErroredConventionAsHandled(
      params.conventionId,
    );

    await uow.outboxRepository.save(
      this.createNewEvent({
        topic: "PartnerErroredConventionMarkedAsHandled",
        payload: {
          conventionId: params.conventionId,
          userId,
        },
        occurredAt: conventionMarkAsHandledAt,
      }),
    );
  }
}
