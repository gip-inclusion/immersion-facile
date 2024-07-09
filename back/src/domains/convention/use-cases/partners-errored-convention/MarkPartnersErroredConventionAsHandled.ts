import {
  InclusionConnectDomainJwtPayload,
  MarkPartnersErroredConventionAsHandledRequest,
  errorMessages,
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
      throw new NotFoundError(
        errorMessages.convention.notFound({
          conventionId: params.conventionId,
        }),
      );

    const currentUser =
      await uow.inclusionConnectedUserRepository.getById(userId);
    if (!currentUser)
      throw new NotFoundError(errorMessages.user.notFound({ userId }));
    const userAgencyRights = currentUser.agencyRights.find(
      (agencyRight) =>
        agencyRight.agency.id === conventionToMarkAsHandled.agencyId,
    );
    if (!userAgencyRights)
      throw new ForbiddenError(
        errorMessages.user.noRightsOnAgency({
          userId,
          agencyId: conventionToMarkAsHandled.agencyId,
        }),
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
          triggeredBy: {
            kind: "inclusion-connected",
            userId: currentUser.id,
          },
        },
        occurredAt: conventionMarkAsHandledAt,
      }),
    );
  }
}
