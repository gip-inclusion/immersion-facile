import { uniq } from "ramda";
import { errors, withAgencyIdSchema } from "shared";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { getUserIdsWithoutRoleFromAgencyRights } from "../entities/Agency";

export type NotifyAgencyHasBeenPutOnHold = ReturnType<
  typeof makeNotifyAgencyHasBeenPutOnHold
>;
export const makeNotifyAgencyHasBeenPutOnHold = useCaseBuilder(
  "NotifyAgencyHasBeenPutOnHold",
)
  .withInput(withAgencyIdSchema)
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  }>()
  .build(async ({ inputParams, uow, deps }) => {
    const agency = await uow.agencyRepository.getById(inputParams.agencyId);
    if (!agency) throw errors.agency.notFound(inputParams);

    const agencyReviewedUserEmails = await uow.userRepository
      .getByIds(
        getUserIdsWithoutRoleFromAgencyRights({
          rights: agency.usersRights,
          excludedRole: "to-review",
        }),
      )
      .then((users) => users.map(({ email }) => email));

    await deps.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      followedIds: { agencyId: agency.id },
      templatedContent: {
        kind: "AGENCY_HAS_BEEN_PUT_ON_HOLD",
        params: { agencyName: agency.name },
        recipients: uniq([agency.contactEmail, ...agencyReviewedUserEmails]),
      },
    });
  });
