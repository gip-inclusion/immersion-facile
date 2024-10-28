import {
  GetUsersFilters,
  InclusionConnectedUser,
  UserInList,
  UserWithAdminRights,
  getUsersFiltersSchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

export type GetUsers = ReturnType<typeof makeGetUsers>;
export const makeGetUsers = createTransactionalUseCase<
  GetUsersFilters,
  UserInList[],
  InclusionConnectedUser
>(
  {
    name: "GetUsers",
    inputSchema: getUsersFiltersSchema,
  },
  async ({ uow, currentUser, inputParams }) => {
    throwIfNotAdmin(currentUser);
    const users = await uow.userRepository.getUsers(
      inputParams,
      await makeProvider(uow),
    );
    return Promise.all(users.map((user) => userToUserInList(uow, user)));
  },
);

const userToUserInList = async (
  uow: UnitOfWork,
  { isBackofficeAdmin: _, ...rest }: UserWithAdminRights,
): Promise<UserInList> => {
  const userAgencies = await uow.agencyRepository.getAgenciesRightsByUserId(
    rest.id,
  );
  return {
    ...rest,
    numberOfAgencies: userAgencies.length,
  };
};
