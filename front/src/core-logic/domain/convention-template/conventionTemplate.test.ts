import type { ConventionTemplate, ConventionTemplateId } from "shared";
import { expectToEqual } from "shared";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import { conventionTemplateSelectors } from "./conventionTemplate.selectors";
import {
  conventionTemplateSlice,
  initialConventionTemplateState,
} from "./conventionTemplate.slice";

describe("ConventionTemplate slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  const conventionTemplate: ConventionTemplate = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" as ConventionTemplateId,
    userId: "user-id",
    name: "Mon modèle",
    internshipKind: "immersion",
    signatories: {
      beneficiary: {
        email: "beneficiary@test.com",
      },
    },
  };

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      conventionTemplate: {
        ...initialConventionTemplateState,
      },
    }));
  });

  it("creates or updates convention template successfully", () => {
    expectToEqual(store.getState().conventionTemplate, {
      isLoading: false,
      conventionTemplates: [],
    });

    store.dispatch(
      conventionTemplateSlice.actions.createOrUpdateConventionTemplateRequested(
        {
          conventionTemplate,
          jwt: "fake-jwt",
          feedbackTopic: "convention-template",
        },
      ),
    );

    expectToEqual(store.getState().conventionTemplate, {
      isLoading: true,
      conventionTemplates: [],
    });

    dependencies.conventionGateway.createOrUpdateConventionTemplateResult$.next(
      undefined,
    );

    expectToEqual(store.getState().conventionTemplate, {
      isLoading: false,
      conventionTemplates: [],
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())["convention-template"],
      {
        level: "success",
        message: "Le modèle de convention a bien été enregistré.",
        on: "create",
        title: "Le modèle de convention a bien été enregistré",
      },
    );
  });

  it("gets error message when create or update convention template fails", () => {
    store.dispatch(
      conventionTemplateSlice.actions.createOrUpdateConventionTemplateRequested(
        {
          conventionTemplate,
          jwt: "fake-jwt",
          feedbackTopic: "convention-template",
        },
      ),
    );

    expectToEqual(store.getState().conventionTemplate, {
      isLoading: true,
      conventionTemplates: [],
    });

    const errorMessage =
      "Une erreur est survenue lors de l'enregistrement du modèle.";
    dependencies.conventionGateway.createOrUpdateConventionTemplateResult$.error(
      new Error(errorMessage),
    );

    expectToEqual(store.getState().conventionTemplate, {
      isLoading: false,
      conventionTemplates: [],
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())["convention-template"],
      {
        level: "error",
        message: errorMessage,
        on: "create",
        title: "Problème lors de l'enregistrement du modèle de convention",
      },
    );
  });

  it("fetches convention templates for current user successfully", () => {
    expectToEqual(
      conventionTemplateSelectors.conventionTemplates(store.getState()),
      [],
    );

    store.dispatch(
      conventionTemplateSlice.actions.fetchConventionTemplatesRequested({
        jwt: "fake-jwt",
        feedbackTopic: "convention-template",
      }),
    );

    expectToEqual(
      conventionTemplateSelectors.isLoading(store.getState()),
      true,
    );
    expectToEqual(
      conventionTemplateSelectors.conventionTemplates(store.getState()),
      [],
    );

    const templates: ConventionTemplate[] = [conventionTemplate];
    dependencies.conventionGateway.getConventionTemplatesForCurrentUserResult$.next(
      templates,
    );

    expectToEqual(
      conventionTemplateSelectors.isLoading(store.getState()),
      false,
    );
    expectToEqual(
      conventionTemplateSelectors.conventionTemplates(store.getState()),
      templates,
    );
  });

  it("gets error message when fetch convention templates fails", () => {
    store.dispatch(
      conventionTemplateSlice.actions.fetchConventionTemplatesRequested({
        jwt: "fake-jwt",
        feedbackTopic: "convention-template",
      }),
    );

    expectToEqual(
      conventionTemplateSelectors.isLoading(store.getState()),
      true,
    );

    const errorMessage =
      "Une erreur est survenue lors de la récupération des modèles.";
    dependencies.conventionGateway.getConventionTemplatesForCurrentUserResult$.error(
      new Error(errorMessage),
    );

    expectToEqual(
      conventionTemplateSelectors.isLoading(store.getState()),
      false,
    );
    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())["convention-template"],
      {
        level: "error",
        message: errorMessage,
        on: "fetch",
        title: "Récupération des modèles de convention",
      },
    );
  });
});
