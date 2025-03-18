import {
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  type TransferConventionToAgencyRequestDto,
  WithAgencyId,
  type WithConventionDto,
  conventionSchema,
  errors,
  transferConventionToAgencyRequestSchema,
  withConventionSchema,
} from "shared";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { createTransactionalUseCase } from "../../../core/UseCase";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";

export type NotifyAllActorsThatConventionTransfered = ReturnType<
  typeof makeNotifyAllActorsThatConventionTransfered
>;

export const makeNotifyAllActorsThatConventionTransfered =
  createTransactionalUseCase<
    WithConventionDto & WithAgencyId,
    void,
    {
      saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
      generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
      timeGateway: TimeGateway;
      shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    }
  >(
    {
      name: "NotifyAllActorsThatConventionTransfered",
      inputSchema: ,
    },
    async ({ inputParams, uow, deps }) => {
      
      await Promise.all([
        
      ]);
    },
  );

