import { InclusionConnectedUser } from "shared";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../../../../../config/helpers/httpErrors";

export const throwIfNotAdmin = (user: InclusionConnectedUser | undefined) => {
  if (!user) throw new UnauthorizedError();
  if (!user.isBackofficeAdmin)
    throw new ForbiddenError("Insufficient privileges for this user");
};
