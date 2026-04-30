import { errors, withAgencyIdAndUserIdSchema } from "shared";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type NotifyUserAgencyRightChanged = ReturnType<
  typeof makeNotifyUserAgencyRightChanged
>;

type Deps = {
  saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
};

export const makeNotifyUserAgencyRightChanged = useCaseBuilder(
  "NotifyUserAgencyRightChanged",
)
  .withInput(withAgencyIdAndUserIdSchema)
  .withDeps<Deps>()
  .build(async ({ inputParams: { agencyId, userId }, uow, deps }) => {
    const agency = await uow.agencyRepository.getById(agencyId);
    if (!agency) throw errors.agency.notFound({ agencyId });

    const user = await uow.userRepository.getById(userId);
    if (!user) throw errors.user.notFound({ userId });

    const agencyRight = agency.usersRights[user.id];

    if (agencyRight && !agencyRight.roles.includes("to-review"))
      await deps.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "IC_USER_RIGHTS_HAS_CHANGED",
          recipients: [user.email],
          params: {
            agencyName: agency.name,
            isNotifiedByEmail: agencyRight.isNotifiedByEmail,
            roles: agencyRight.roles,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
        },
        followedIds: {
          agencyId: agency.id,
          userId: user.id,
        },
      });
  });
