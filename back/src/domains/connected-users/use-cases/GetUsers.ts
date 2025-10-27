import {
  type ConnectedUser,
  type GetUsersFilters,
  getUsersFiltersSchema,
  type UserWithNumberOfAgenciesAndEstablishments,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { throwIfNotAdmin } from "../helpers/authorization.helper";

export type GetUsers = ReturnType<typeof makeGetUsers>;
export const makeGetUsers = useCaseBuilder("GetUsers")
  .withInput<GetUsersFilters>(getUsersFiltersSchema)
  .withOutput<UserWithNumberOfAgenciesAndEstablishments[]>()
  .withCurrentUser<ConnectedUser>()
  .build(async ({ uow, currentUser, inputParams }) => {
    throwIfNotAdmin(currentUser);
    return uow.userRepository.getUsers(inputParams);
  });
