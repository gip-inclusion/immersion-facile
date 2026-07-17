import { type ConnectedUser, setFeatureFlagSchema } from "shared";
import { throwIfNotAdmin } from "../../../connected-users/helpers/authorization.helper";
import { useCaseBuilder } from "../../useCaseBuilder";

export type SetFeatureFlag = ReturnType<typeof makeSetFeatureFlag>;

export const makeSetFeatureFlag = useCaseBuilder("SetFeatureFlag")
  .withInput(setFeatureFlagSchema)
  .withCurrentUser<ConnectedUser>()
  .build(async ({ inputParams, uow, currentUser }) => {
    throwIfNotAdmin(currentUser);
    await uow.featureFlagRepository.update(inputParams);
  });
