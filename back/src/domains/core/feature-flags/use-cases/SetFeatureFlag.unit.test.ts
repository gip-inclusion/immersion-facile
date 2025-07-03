import {
  ConnectedUserBuilder,
  errors,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  type SetFeatureFlagParam,
} from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import { SetFeatureFlag } from "./SetFeatureFlag";

const setEnableMaintenanceParams = {
  flagName: "enableMaintenance",
  featureFlag: {
    kind: "textWithSeverity",
    isActive: true,
    value: {
      message: "Hola",
      severity: "info",
    },
  },
} satisfies SetFeatureFlagParam;

const setEnableSearchByScoreParams = {
  flagName: "enableSearchByScore",
  featureFlag: {
    kind: "boolean",
    isActive: true,
  },
} satisfies SetFeatureFlagParam;

const connectedUserNotAdmin = new ConnectedUserBuilder()
  .withIsAdmin(false)
  .build();

const connectedUserAdmin = new ConnectedUserBuilder().withIsAdmin(true).build();

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
      errors.user.unauthorized(),
    );
  });

  it("throws Forbidden if currentUser user is not admin", async () => {
    await expectPromiseToFailWithError(
      setFeatureFlag.execute(setEnableMaintenanceParams, connectedUserNotAdmin),
      errors.user.forbidden({ userId: connectedUserNotAdmin.id }),
    );
  });

  it("saves the feature flag", async () => {
    expectObjectsToMatch(await uow.featureFlagRepository.getAll(), {
      enableMaintenance: {
        kind: "textWithSeverity",
        isActive: false,
        value: { message: "Maintenance message", severity: "warning" },
      },
    });
    await setFeatureFlag.execute(
      setEnableMaintenanceParams,
      connectedUserAdmin,
    );
    expectObjectsToMatch(await uow.featureFlagRepository.getAll(), {
      enableMaintenance: setEnableMaintenanceParams.featureFlag,
    });
  });

  it("updates the feature flag", async () => {
    await setFeatureFlag.execute(
      setEnableSearchByScoreParams,
      connectedUserAdmin,
    );
    expectObjectsToMatch(await uow.featureFlagRepository.getAll(), {
      enableSearchByScore: setEnableSearchByScoreParams.featureFlag,
    });

    const updateEnableSearchByScoreParams = {
      flagName: "enableSearchByScore",
      featureFlag: {
        kind: "boolean",
        isActive: false,
      },
    } satisfies SetFeatureFlagParam;

    await setFeatureFlag.execute(
      updateEnableSearchByScoreParams,
      connectedUserAdmin,
    );
    expectObjectsToMatch(await uow.featureFlagRepository.getAll(), {
      enableSearchByScore: updateEnableSearchByScoreParams.featureFlag,
    });

    const reupdateEnableSearchByScoreParams = {
      flagName: "enableSearchByScore",
      featureFlag: {
        kind: "boolean",
        isActive: true,
      },
    } satisfies SetFeatureFlagParam;
    await setFeatureFlag.execute(
      reupdateEnableSearchByScoreParams,
      connectedUserAdmin,
    );
    expectObjectsToMatch(await uow.featureFlagRepository.getAll(), {
      enableSearchByScore: reupdateEnableSearchByScoreParams.featureFlag,
    });
  });
});
