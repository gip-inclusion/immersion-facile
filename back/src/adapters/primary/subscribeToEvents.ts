import { AppConfig } from "./config";

export const subscribeToEvents = (config: AppConfig) => {
  // Notification for information  Wiring
  config.eventBus.subscribe(
    "ImmersionApplicationSubmittedByBeneficiary",
    (event) =>
      config.useCases.confirmToBeneficiaryThatApplicationCorrectlySubmitted.execute(
        event.payload,
      ),
  );

  config.eventBus.subscribe(
    "ImmersionApplicationSubmittedByBeneficiary",
    (event) =>
      config.useCases.confirmToMentorThatApplicationCorrectlySubmitted.execute(
        event.payload,
      ),
  );

  config.eventBus.subscribe(
    "ImmersionApplicationSubmittedByBeneficiary",
    (event) =>
      config.useCases.notifyToTeamApplicationSubmittedByBeneficiary.execute(
        event.payload,
      ),
  );

  // Needs Review by a counsellor or validator
  config.eventBus.subscribe(
    "ImmersionApplicationSubmittedByBeneficiary",
    (event) =>
      config.useCases.notifyNewApplicationNeedsReview.execute(event.payload),
  );

  config.eventBus.subscribe(
    "ImmersionApplicationAcceptedByCounsellor",
    (event) =>
      config.useCases.notifyNewApplicationNeedsReview.execute(event.payload),
  );

  config.eventBus.subscribe(
    "ImmersionApplicationAcceptedByValidator",
    (event) =>
      config.useCases.notifyNewApplicationNeedsReview.execute(event.payload),
  );

  config.eventBus.subscribe(
    "FinalImmersionApplicationValidationByAdmin",
    (event) =>
      config.useCases.notifyAllActorsOfFinalApplicationValidation.execute(
        event.payload,
      ),
  );

  config.eventBus.subscribe("ImmersionApplicationRejected", (event) =>
    config.useCases.notifyBeneficiaryAndEnterpriseThatApplicationIsRejected.execute(
      event.payload,
    ),
  );
};
