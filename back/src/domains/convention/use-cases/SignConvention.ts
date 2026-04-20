import {
  type ConnectedUserDomainJwtPayload,
  type ConventionDomainJwtPayload,
  errors,
  withConventionIdSchema,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import {
  domainTopicByTargetStatusMap,
  signConvention,
  throwErrorOnConventionIdMismatch,
} from "../entities/Convention";

export type SignConvention = ReturnType<typeof makeSignConvention>;

export const makeSignConvention = useCaseBuilder("SignConvention")
  .withInput(withConventionIdSchema)
  .withOutput()
  .withDeps<{
    timeGateway: TimeGateway;
    createNewEvent: CreateNewEvent;
  }>()
  .withCurrentUser<ConventionDomainJwtPayload | ConnectedUserDomainJwtPayload>()
  .build(
    async ({
      inputParams: { conventionId },
      uow,
      deps,
      currentUser: jwtPayload,
    }) => {
      throwErrorOnConventionIdMismatch({
        requestedConventionId: conventionId,
        jwtPayload,
      });
      const convention =
        await uow.conventionQueries.getConventionById(conventionId);
      if (!convention) throw errors.convention.notFound({ conventionId });

      const { role, userWithRights, signedConvention } = await signConvention({
        uow,
        convention,
        jwtPayload,
        now: deps.timeGateway.now().toISOString(),
      });

      const domainTopic = domainTopicByTargetStatusMap[signedConvention.status];
      if (domainTopic) {
        const event = deps.createNewEvent({
          topic: domainTopic,
          payload: {
            convention: signedConvention,
            triggeredBy: userWithRights
              ? { kind: "connected-user", userId: userWithRights.id }
              : { kind: "convention-magic-link", role: role },
          },
        });
        await uow.outboxRepository.save(event);
      }

      return { id: signedConvention.id };
    },
  );
