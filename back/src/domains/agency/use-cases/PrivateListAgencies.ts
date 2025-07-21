import { map } from "ramda";
import {
  type AgencyOption,
  type ConnectedUser,
  errors,
  privateListAgenciesRequestSchema,
} from "shared";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type PrivateListAgencies = ReturnType<typeof makePrivateListAgencies>;
export const makePrivateListAgencies = useCaseBuilder("PrivateListAgencies")
  .withInput(privateListAgenciesRequestSchema)
  .withCurrentUser<ConnectedUser>()
  .build(async ({ uow, currentUser, inputParams: { status } }) => {
    if (!currentUser) throw errors.user.unauthorized();
    throwIfNotAdmin(currentUser);

    return uow.agencyRepository
      .getAgencies({
        filters: { status: status && [status] },
      })
      .then(
        map(
          ({
            id,
            name,
            kind,
            status,
            address,
            refersToAgencyName,
          }): AgencyOption => ({
            id,
            name,
            kind,
            status,
            address,
            refersToAgencyName,
          }),
        ),
      );
  });
