import {
  errors,
  executeInSequence,
  onlyAdminUserRightsWithStatusAccepted,
  onlyContactUserRightsWithStatusAccepted,
  type WithSiretDto,
  withSiretSchema,
} from "shared";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type NotifyEstablishmentUsersThatEstablishmentIsBanned = ReturnType<
  typeof makeNotifyEstablishmentUsersThatEstablishmentIsBanned
>;

export const makeNotifyEstablishmentUsersThatEstablishmentIsBanned =
  useCaseBuilder("NotifyEstablishmentUsersThatEstablishmentIsBanned")
    .withInput<WithSiretDto>(withSiretSchema)
    .withDeps<{
      saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    }>()
    .build(async ({ uow, inputParams, deps }) => {
      const { siret } = inputParams;

      const establishment =
        await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
          siret,
        );

      if (!establishment) throw errors.establishment.notFound({ siret });
      if (!establishment.establishment.isEstablishmentBanned)
        throw errors.establishment.establishmentNotBanned({ siret });

      const userRightIds = establishment.userRights
        .filter(
          (right) =>
            onlyAdminUserRightsWithStatusAccepted(right) ||
            onlyContactUserRightsWithStatusAccepted(right),
        )
        .map((right) => right.userId);

      const users = await uow.userRepository.getByIds(userRightIds);

      await executeInSequence(users, (user) =>
        deps.saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [user.email],
            params: { businessName: establishment.establishment.name, siret },
          },
          followedIds: { establishmentSiret: siret },
        }),
      );
    });
