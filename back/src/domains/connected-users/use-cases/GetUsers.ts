import {
  type ConnectedUser,
  type GetUsersFilters,
  getUsersFiltersSchema,
  type UserWithAdminRights,
  type UserWithNumberOfAgencies,
} from "shared";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { throwIfNotAdmin } from "../helpers/authorization.helper";

export type GetUsers = ReturnType<typeof makeGetUsers>;
export const makeGetUsers = useCaseBuilder("GetUsers")
  .withInput<GetUsersFilters>(getUsersFiltersSchema)
  .withOutput<UserWithNumberOfAgencies[]>()
  .withCurrentUser<ConnectedUser>()
  .build(async ({ uow, currentUser, inputParams }) => {
    throwIfNotAdmin(currentUser);
    const users = await uow.userRepository.getUsers(inputParams);
    return Promise.all(users.map((user) => userToUserInList(uow, user)));
  });

const userToUserInList = async (
  uow: UnitOfWork,
  { isBackofficeAdmin: _, ...rest }: UserWithAdminRights,
): Promise<UserWithNumberOfAgencies> => {
  const userAgencies = await uow.agencyRepository.getAgenciesRightsByUserId(
    rest.id,
  );
  return {
    ...rest,
    numberOfAgencies: userAgencies.length,
  };
};
