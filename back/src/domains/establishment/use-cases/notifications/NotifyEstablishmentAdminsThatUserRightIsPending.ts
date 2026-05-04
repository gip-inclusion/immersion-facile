import {
  errors,
  establishmentRoleSchema,
  frontRoutes,
  onlyAdminUserRightsWithStatusAccepted,
  siretSchema,
  userIdSchema,
  type WithSiretDto,
} from "shared";
import z from "zod";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
import type { EstablishmentUserRight } from "../../entities/EstablishmentAggregate";

export type NotifyEstablishmentAdminsThatUserRightIsPendingRequestedPayload =
  WithSiretDto & Pick<EstablishmentUserRight, "userId" | "role">;

const notifyEstablishmentAdminsThatUserRightIsPendingRequestedPayloadSchema =
  z.object({
    siret: siretSchema,
    userId: userIdSchema,
    role: establishmentRoleSchema,
  });

export type NotifyEstablishmentAdminsThatUserRightIsPending = ReturnType<
  typeof makeNotifyEstablishmentAdminsThatUserRightIsPending
>;

export const makeNotifyEstablishmentAdminsThatUserRightIsPending =
  useCaseBuilder("NotifyEstablishmentAdminsThatUserRightIsPending")
    .withInput<NotifyEstablishmentAdminsThatUserRightIsPendingRequestedPayload>(
      notifyEstablishmentAdminsThatUserRightIsPendingRequestedPayloadSchema,
    )
    .withDeps<{
      saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
      config: AppConfig;
    }>()
    .build(async ({ uow, inputParams, deps }) => {
      const establishment =
        await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
          inputParams.siret,
        );
      if (!establishment)
        throw errors.establishment.notFound({ siret: inputParams.siret });

      const admins = establishment.userRights.filter(
        onlyAdminUserRightsWithStatusAccepted,
      );
      const adminUsers = await uow.userRepository.getByIds(
        admins.map((userRight) => userRight.userId),
      );

      if (adminUsers.length === 0)
        throw errors.establishment.adminNotFound({ siret: inputParams.siret });

      const pendingUser = await uow.userRepository.getById(inputParams.userId);
      if (!pendingUser)
        throw errors.user.notFound({ userId: inputParams.userId });

      await Promise.all(
        adminUsers.map((adminUser) =>
          deps.saveNotificationAndRelatedEvent(uow, {
            kind: "email",
            templatedContent: {
              kind: "ESTABLISHMENT_USER_RIGHT_IS_PENDING",
              recipients: [adminUser.email],
              params: {
                establishmentDashboardUrl: `${deps.config.immersionFacileBaseUrl}/${frontRoutes.establishmentDashboard}`,
                adminFirstName: adminUser.firstName,
                adminLastName: adminUser.lastName,
                pendingUserFirstName: pendingUser.firstName,
                pendingUserLastName: pendingUser.lastName,
                pendingUserRole: inputParams.role,
                pendingUserEmail: pendingUser.email,
              },
            },
            followedIds: {
              establishmentSiret: inputParams.siret,
            },
          }),
        ),
      );
    });
