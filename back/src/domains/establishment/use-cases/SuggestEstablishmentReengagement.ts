import {
  errors,
  executeInSequence,
  immersionFacileNoReplyEmailSender,
  onlyAdminUserRightsWithStatusAccepted,
  siretSchema,
} from "shared";
import { notifyErrorObjectToTeam } from "../../../utils/notifyTeam";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type SuggestEstablishmentReengagement = ReturnType<
  typeof makeSuggestEstablishmentReengagement
>;

export const makeSuggestEstablishmentReengagement = useCaseBuilder(
  "SuggestEstablishmentReengagement",
)
  .withInput(siretSchema)
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  }>()
  .build(
    async ({ inputParams, uow, deps: { saveNotificationAndRelatedEvent } }) => {
      const establishmentAggregate =
        await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
          inputParams,
        );
      if (!establishmentAggregate)
        throw errors.establishment.notFound({ siret: inputParams });

      const { userRights, establishment } = establishmentAggregate;
      const adminIds = userRights
        .filter(onlyAdminUserRightsWithStatusAccepted)
        .map((right) => right.userId);

      const admins = await uow.userRepository.getByIds(adminIds);

      await executeInSequence(admins, (user) =>
        saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "ESTABLISHMENT_REENGAGEMENT_SUGGESTION",
            sender: immersionFacileNoReplyEmailSender,
            recipients: [user.email],
            params: {
              businessName: establishment.customizedName ?? establishment.name,
            },
          },
          followedIds: {
            establishmentSiret: establishmentAggregate.establishment.siret,
          },
        }).catch((error) => notifyErrorObjectToTeam(error)),
      );
    },
  );
