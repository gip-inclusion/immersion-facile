import { toPairs, uniq } from "ramda";
import { isTruthy, type UserId } from "shared";
import { z } from "zod";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export type AgencyNameWithUsersToReview = {
  agencyName: string;
  numberOfUsersToReview: number;
};

type AgencyAdminWithAgencies = {
  userId: UserId;
  firstName: string;
  lastName: string;
  email: string;
  agencies: AgencyNameWithUsersToReview[];
};

export type RemindAgencyAdminThatNewUserRequestAgencyRightResult = {
  remindersSent: number;
  failures: {
    userId: UserId;
    error: Error;
  }[];
};

export class RemindAgencyAdminThatNewUserRequestAgencyRight extends TransactionalUseCase<
  void,
  RemindAgencyAdminThatNewUserRequestAgencyRightResult
> {
  protected inputSchema = z.void();

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(
    _: void,
    uow: UnitOfWork,
  ): Promise<RemindAgencyAdminThatNewUserRequestAgencyRightResult> {
    const agenciesWithNumberOfUsersToReview =
      await uow.agencyRepository.getAllAgenciesWithUsersToReview();

    if (agenciesWithNumberOfUsersToReview.length === 0) {
      return { remindersSent: 0, failures: [] };
    }

    const agencyAdminUserIds: UserId[] = uniq(
      agenciesWithNumberOfUsersToReview.flatMap(({ agency }) =>
        toPairs(agency.usersRights)
          .filter(([_, userRight]) => userRight?.roles.includes("agency-admin"))
          .map(([userId]) => userId)
          .filter(isTruthy),
      ),
    );

    if (agencyAdminUserIds.length === 0) {
      return { remindersSent: 0, failures: [] };
    }

    const adminUsers = await uow.userRepository.getByIds(agencyAdminUserIds);

    const adminsWithAgencies: AgencyAdminWithAgencies[] = adminUsers.map(
      (admin) => {
        const agencies: AgencyNameWithUsersToReview[] =
          agenciesWithNumberOfUsersToReview
            .filter(({ agency }) =>
              toPairs(agency.usersRights).some(
                ([userId, userRight]) =>
                  userId === admin.id &&
                  userRight?.roles.includes("agency-admin"),
              ),
            )
            .map(({ agency, numberOfUsersToReview }) => ({
              agencyName: agency.name,
              numberOfUsersToReview,
            }));

        return {
          userId: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          agencies,
        };
      },
    );

    const failures: { userId: UserId; error: Error }[] = [];
    let remindersSent = 0;

    await Promise.all(
      adminsWithAgencies.map(async (admin) => {
        try {
          await this.#saveNotificationAndRelatedEvent(uow, {
            kind: "email",
            templatedContent: {
              kind: "AGENCY_ADMIN_NEW_USERS_TO_REVIEW_NOTIFICATION",
              recipients: [admin.email],
              params: {
                firstName: admin.firstName,
                lastName: admin.lastName,
                agencies: admin.agencies.map((agency) => ({
                  agencyName: agency.agencyName,
                  numberOfUsersToReview: agency.numberOfUsersToReview,
                })),
              },
            },
            followedIds: {
              userId: admin.userId,
            },
          });
          remindersSent++;
        } catch (error) {
          failures.push({
            userId: admin.userId,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }),
    );

    return { remindersSent, failures };
  }
}
