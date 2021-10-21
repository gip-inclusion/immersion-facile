import { AppDependencies } from "./config";

export const subscribeToEvents = (deps: AppDependencies) => {
  // Notification for information  Wiring
  deps.eventBus.subscribe(
    "ImmersionApplicationSubmittedByBeneficiary",
    (event) =>
      deps.useCases.confirmToBeneficiaryThatApplicationCorrectlySubmitted.execute(
        event.payload,
      ),
  );

  deps.eventBus.subscribe(
    "ImmersionApplicationSubmittedByBeneficiary",
    (event) =>
      deps.useCases.confirmToMentorThatApplicationCorrectlySubmitted.execute(
        event.payload,
      ),
  );

  deps.eventBus.subscribe(
    "ImmersionApplicationSubmittedByBeneficiary",
    (event) =>
      deps.useCases.notifyToTeamApplicationSubmittedByBeneficiary.execute(
        event.payload,
      ),
  );

  // Needs Review by a counsellor or validator
  deps.eventBus.subscribe(
    "ImmersionApplicationSubmittedByBeneficiary",
    (event) => {
      deps.useCases.notifyNewApplicationNeedsReview.execute(event.payload);
    },
  );

  deps.eventBus.subscribe("ImmersionApplicationAcceptedByCounsellor", (event) =>
    deps.useCases.notifyNewApplicationNeedsReview.execute(event.payload),
  );

  deps.eventBus.subscribe("ImmersionApplicationAcceptedByValidator", (event) =>
    deps.useCases.notifyNewApplicationNeedsReview.execute(event.payload),
  );

  deps.eventBus.subscribe(
    "FinalImmersionApplicationValidationByAdmin",
    (event) =>
      deps.useCases.notifyAllActorsOfFinalApplicationValidation.execute(
        event.payload,
      ),
  );

  deps.eventBus.subscribe("ImmersionApplicationRejected", (event) =>
    deps.useCases.notifyBeneficiaryAndEnterpriseThatApplicationIsRejected.execute(
      event.payload,
    ),
  );

  deps.eventBus.subscribe("ImmersionApplicationRequiresModification", (event) =>
    deps.useCases.notifyBeneficiaryAndEnterpriseThatApplicationNeedsModifications.execute(
      event.payload,
    ),
  );
};
