import {
  type ConnectedUserDomainJwtPayload,
  errors,
  type MarkPartnersErroredConventionAsHandledRequest,
  markPartnersErroredConventionAsHandledRequestSchema,
} from "shared";
import { getUserWithRights } from "../../../connected-users/helpers/userRights.helper";
import type { CreateNewEvent } from "../../../core/events/ports/EventBus";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class MarkPartnersErroredConventionAsHandled extends TransactionalUseCase<
  MarkPartnersErroredConventionAsHandledRequest,
  void,
  ConnectedUserDomainJwtPayload
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
    payload: ConnectedUserDomainJwtPayload,
  ): Promise<void> {
    if (!payload) {
      throw errors.user.unauthorized();
    }
    const { userId } = payload;
    const conventionToMarkAsHandled = await uow.conventionRepository.getById(
      params.conventionId,
    );
    if (!conventionToMarkAsHandled)
      throw errors.convention.notFound({
        conventionId: params.conventionId,
      });

    const currentUser = await uow.userRepository.getById(userId);
    if (!currentUser) throw errors.user.notFound({ userId });

    const userWithRights = await getUserWithRights(uow, currentUser.id);
    const userAgencyRights = userWithRights.agencyRights.find(
      (agencyRight) =>
        agencyRight.agency.id === conventionToMarkAsHandled.agencyId,
    );
    if (!userAgencyRights)
      throw errors.user.noRightsOnAgency({
        userId,
        agencyId: conventionToMarkAsHandled.agencyId,
      });

    const conventionMarkAsHandledAt = this.timeGateway.now().toISOString();

    await uow.broadcastFeedbacksRepository.markPartnersErroredConventionAsHandled(
      params.conventionId,
    );

    await uow.outboxRepository.save(
      this.createNewEvent({
        topic: "PartnerErroredConventionMarkedAsHandled",
        payload: {
          conventionId: params.conventionId,
          userId,
          triggeredBy: {
            kind: "connected-user",
            userId: currentUser.id,
          },
        },
        occurredAt: conventionMarkAsHandledAt,
      }),
    );
  }
}
