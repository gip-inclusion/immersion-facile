import { errors, rejectIcUserRoleForAgencyParamsSchema } from "shared";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type NotifyUserAgencyRightRejected = ReturnType<
  typeof makeNotifyUserAgencyRightRejected
>;

type Deps = {
  saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
};

export const makeNotifyUserAgencyRightRejected = useCaseBuilder(
  "NotifyUserAgencyRightRejected",
)
  .withInput(rejectIcUserRoleForAgencyParamsSchema)
  .withDeps<Deps>()
  .build(
    async ({ inputParams: { agencyId, justification, userId }, uow, deps }) => {
      const agency = await uow.agencyRepository.getById(agencyId);

      if (!agency) throw errors.agency.notFound({ agencyId });

      const user = await uow.userRepository.getById(userId);

      if (!user) throw errors.user.notFound({ userId });

      await deps.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "IC_USER_REGISTRATION_TO_AGENCY_REJECTED",
          params: {
            agencyName: agency.name,
            justification,
          },
          recipients: [user.email],
        },
        followedIds: {
          agencyId: agency.id,
          userId: user.id,
        },
      });
    },
  );
