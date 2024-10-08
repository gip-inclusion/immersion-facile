import {
  GetUsersFilters,
  InclusionConnectedUser,
  UserInList,
  getUsersFiltersSchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
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
  async ({ uow, currentUser }) => {
    throwIfNotAdmin(currentUser);
    return uow.userRepository.getWithFilter({});
  },
);
