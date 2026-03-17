import type { UserWithAdminRights } from "shared";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { EstablishmentUserRight } from "../entities/EstablishmentAggregate";

export const getNotifiedUsersFromEstablishmentUserRights = async (
  uow: UnitOfWork,
  userRights: EstablishmentUserRight[],
): Promise<UserWithAdminRights[]> =>
  uow.userRepository.getByIds(
    userRights
      .filter(
        ({ shouldReceiveDiscussionNotifications, status }) =>
          shouldReceiveDiscussionNotifications && status === "ACCEPTED",
      )
      .map(({ userId }) => userId),
  );
