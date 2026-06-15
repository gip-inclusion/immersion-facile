import {
  type ConnectedUserDomainJwtPayload,
  errors,
  markPartnersErroredConventionAsHandledRequestSchema,
} from "shared";
import { getUserWithRights } from "../../../connected-users/helpers/userRights.helper";
import type { CreateNewEvent } from "../../../core/events/ports/EventBus";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type MarkPartnersErroredConventionAsHandled = ReturnType<
  typeof makeMarkPartnersErroredConventionAsHandled
>;

export const makeMarkPartnersErroredConventionAsHandled = useCaseBuilder(
  "MarkPartnersErroredConventionAsHandled",
)
  .withInput(markPartnersErroredConventionAsHandledRequestSchema)
  .withCurrentUser<ConnectedUserDomainJwtPayload>()
  .withDeps<{
    createNewEvent: CreateNewEvent;
    timeGateway: TimeGateway;
  }>()
  .build(async ({ currentUser, inputParams, uow, deps }) => {
    if (!currentUser) {
      throw errors.user.unauthorized();
    }
    const { userId } = currentUser;
    const conventionToMarkAsHandled = await uow.conventionRepository.getById(
      inputParams.conventionId,
    );
    if (!conventionToMarkAsHandled)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    const user = await uow.userRepository.getById(userId);
    if (!user) throw errors.user.notFound({ userId });

    const userWithRights = await getUserWithRights(uow, user.id);
    const userAgencyRights = userWithRights.agencyRights.find(
      (agencyRight) =>
        agencyRight.agency.id === conventionToMarkAsHandled.agencyId,
    );
    if (!userAgencyRights)
      throw errors.user.noRightsOnAgency({
        userId,
        agencyId: conventionToMarkAsHandled.agencyId,
      });

    const conventionMarkAsHandledAt = deps.timeGateway.now().toISOString();

    await uow.broadcastFeedbacksRepository.markPartnersErroredConventionAsHandled(
      inputParams.conventionId,
    );

    await uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "PartnerErroredConventionMarkedAsHandled",
        payload: {
          conventionId: inputParams.conventionId,
          userId,
          triggeredBy: {
            kind: "connected-user",
            userId: user.id,
          },
        },
        occurredAt: conventionMarkAsHandledAt,
      }),
    );
  });
