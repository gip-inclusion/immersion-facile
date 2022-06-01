import { expectObjectToMatch } from "shared/src/expectToEqual";
import { ImmersionApplicationDtoBuilder } from "shared/src/ImmersionApplication/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  immersionConventionSlice,
  ImmersionConventionState,
} from "./immersionConvention.slice";

describe("Immersion Application slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("stores null as convention without an immersion application matching in backend", () => {
    expectImmersionConventionState({
      isLoading: false,
      convention: null,
    });
    store.dispatch(
      immersionConventionSlice.actions.immersionConventionRequested("my-jwt"),
    );
    expectImmersionConventionState({ isLoading: true });
    feedGatewayWithConvention(undefined);
    expectImmersionConventionState({
      convention: null,
      isLoading: false,
    });
  });

  it("stores the convention if one matches in backend", () => {
    const convention = new ImmersionApplicationDtoBuilder().build();
    expectImmersionConventionState({
      isLoading: false,
      convention: null,
    });
    store.dispatch(
      immersionConventionSlice.actions.immersionConventionRequested("my-jwt"),
    );
    expectImmersionConventionState({ isLoading: true });
    feedGatewayWithConvention(convention);
    expectImmersionConventionState({
      convention,
      isLoading: false,
    });
  });

  it("stores error if failure during fetch", () => {
    expectImmersionConventionState({
      isLoading: false,
      convention: null,
      error: null,
    });
    store.dispatch(
      immersionConventionSlice.actions.immersionConventionRequested("my-jwt"),
    );
    expectImmersionConventionState({ isLoading: true });
    feedGatewayWithError(new Error("I failed !"));
    expectImmersionConventionState({
      convention: null,
      isLoading: false,
      error: "I failed !",
    });
  });

  const expectImmersionConventionState = (
    immersionConventionState: Partial<ImmersionConventionState>,
  ) => {
    expectObjectToMatch(
      store.getState().immersionConvention,
      immersionConventionState,
    );
  };

  const feedGatewayWithError = (error: Error) => {
    dependencies.immersionApplicationGateway.immersionConvention$.error(error);
  };

  const feedGatewayWithConvention = (
    convention: ImmersionApplicationDto | undefined,
  ) => {
    dependencies.immersionApplicationGateway.immersionConvention$.next(
      convention,
    );
  };
});
