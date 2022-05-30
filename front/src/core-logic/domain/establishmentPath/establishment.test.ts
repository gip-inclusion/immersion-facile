import { expectObjectsToMatch } from "shared/src/expectToEqual";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { establishmentSlice, EstablishmentState } from "./establishment.slice";

describe("Establishment", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    const storeAndDeps = createTestStore();
    ({ store, dependencies } = storeAndDeps);
  });

  it("send modification link", () => {
    expectEstablishmentStateToMatch({ isLoading: false, linkSent: false });
    store.dispatch(
      establishmentSlice.actions.sendModificationLinkRequested("siret-123"),
    );
    expectEstablishmentStateToMatch({ isLoading: true });
    dependencies.establishmentGateway.establishmentModificationResponse$.next(
      undefined,
    );
    expectEstablishmentStateToMatch({ isLoading: false, linkSent: true });
  });

  it("forgets modification link was sent if siret changes", () => {
    ({ store } = createTestStore(
      {
        establishment: { linkSent: true, isLoading: false },
      },
      "skip",
    ));
    store.dispatch(siretSlice.actions.siretModified("1234"));
    expectEstablishmentStateToMatch({ linkSent: false, isLoading: false });
  });

  const expectEstablishmentStateToMatch = (
    expected: Partial<EstablishmentState>,
  ) => expectObjectsToMatch(store.getState().establishment, expected);
});
