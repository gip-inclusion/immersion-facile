import {
  InclusionConnectedUserBuilder,
  SetFeatureFlagParam,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
} from "shared";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../../../../config/helpers/httpErrors";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { SetFeatureFlag } from "./SetFeatureFlag";

const setEnableMaintenanceParams = {
  flagName: "enableMaintenance",
  featureFlag: {
    kind: "text",
    isActive: true,
    value: {
      message: "Hola",
    },
  },
} satisfies SetFeatureFlagParam;

const icUserNotAdmin = new InclusionConnectedUserBuilder()
  .withIsAdmin(false)
  .build();

const icUserAdmin = new InclusionConnectedUserBuilder()
  .withIsAdmin(true)
  .build();

describe("SetFeatureFlag use case", () => {
  let uow: InMemoryUnitOfWork;
  let setFeatureFlag: SetFeatureFlag;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);

    setFeatureFlag = new SetFeatureFlag(uowPerformer);
  });

  it("throws Unauthorized if no currentUser is provided", async () => {
    await expectPromiseToFailWithError(
      setFeatureFlag.execute(setEnableMaintenanceParams),
      new UnauthorizedError(),
    );
  });

  it("throws Forbidden if currentUser user is not admin", async () => {
    await expectPromiseToFailWithError(
      setFeatureFlag.execute(setEnableMaintenanceParams, icUserNotAdmin),
      new ForbiddenError("Insufficient privileges for this user"),
    );
  });

  it("saves the feature flag", async () => {
    expectObjectsToMatch(await uow.featureFlagRepository.getAll(), {
      enableMaintenance: {
        kind: "text",
        isActive: false,
        value: { message: "Maintenance message" },
      },
    });
    await setFeatureFlag.execute(setEnableMaintenanceParams, icUserAdmin);
    expectObjectsToMatch(await uow.featureFlagRepository.getAll(), {
      enableMaintenance: setEnableMaintenanceParams.featureFlag,
    });
  });
});
