import { toPairs } from "ramda";
import {
  type AbsoluteUrl,
  agencyIdsSchema,
  errors,
  userIdSchema,
} from "shared";
import { z } from "zod";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type NotifyUserThatAgencyRegistrationRequestWasReceived = ReturnType<
  typeof makeNotifyUserThatAgencyRegistrationRequestWasReceived
>;

const notifyUserThatAgencyRegistrationRequestWasReceivedSchema = z.object({
  userId: userIdSchema,
  agencyIds: agencyIdsSchema,
});

export const makeNotifyUserThatAgencyRegistrationRequestWasReceived =
  useCaseBuilder("NotifyUserThatAgencyRegistrationRequestWasReceived")
    .withInput(notifyUserThatAgencyRegistrationRequestWasReceivedSchema)
    .withDeps<{
      saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
      immersionBaseUrl: AbsoluteUrl;
    }>()
    .build(async ({ inputParams: { userId, agencyIds }, uow, deps }) => {
      const user = await uow.userRepository.getById(userId);
      if (!user) throw errors.user.notFound({ userId });

      const agencies = await uow.agencyRepository.getByIds(agencyIds);

      const agenciesParams = await Promise.all(
        agencies.map(async (agency) => {
          const adminUserIds = toPairs(agency.usersRights)
            .filter(([_, userRight]) =>
              userRight?.roles.includes("agency-admin"),
            )
            .map(([adminUserId]) => adminUserId);

          const adminUsers = await uow.userRepository.getByIds(adminUserIds);

          return {
            agencyName: agency.name,
            adminEmails: adminUsers.map(({ email }) => email),
          };
        }),
      );

      await deps.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "AGENCY_REGISTRATION_REQUEST_CONFIRMATION",
          recipients: [user.email],
          params: {
            immersionBaseUrl: deps.immersionBaseUrl,
            agencies: agenciesParams,
          },
        },
        followedIds: {
          userId: user.id,
        },
      });
    });
