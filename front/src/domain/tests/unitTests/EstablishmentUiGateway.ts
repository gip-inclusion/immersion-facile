import { EstablishementCallToAction } from "src/domain/valueObjects/EstablishementCallToAction";
import { ClientTestApplication } from "src/infra/application/ClientApplication";
import { SiretDto } from "shared/src/siret";
import { Gherkin, isGiven } from "../Gherkin";

export const givenTheEstablishmentUiGatewayHasCallToAction = (
  establishmentCallToAction: EstablishementCallToAction,
) =>
  theEstablishmentUiGatewayHasCallToAction("Given", establishmentCallToAction);
export const andGivenTheEstablishmentUiGatewayHasCallToAction = (
  establishmentCallToAction: EstablishementCallToAction,
) =>
  theEstablishmentUiGatewayHasCallToAction(
    "And given",
    establishmentCallToAction,
  );
export const thenTheEstablishmentUiGatewayHasCallToAction = (
  establishmentCallToAction: EstablishementCallToAction,
) =>
  theEstablishmentUiGatewayHasCallToAction("Then", establishmentCallToAction);
export const andThenTheEstablishmentUiGatewayHasCallToAction = (
  establishmentCallToAction: EstablishementCallToAction,
) =>
  theEstablishmentUiGatewayHasCallToAction(
    "And then",
    establishmentCallToAction,
  );

const theEstablishmentUiGatewayHasCallToAction =
  (gherkin: Gherkin, establishmentCallToAction: EstablishementCallToAction) =>
  (application: ClientTestApplication) => {
    it(`${gherkin} the establishment call to action status is set to '${establishmentCallToAction}'.`, () => {
      expect(application.gateways.establishmentsUi.callToAction).toEqual(
        establishmentCallToAction,
      );
    });
  };

export const givenTheEstablishmentUiGatewayNavigateToEstablishementFormWithSiret =
  (siret: SiretDto) =>
    theEstablishmentUiGatewayNavigateToEstablishementFormWithSiret(
      "Given",
      siret,
    );
export const andGivenTheEstablishmentUiGatewayNavigateToEstablishementFormWithSiret =
  (siret: SiretDto) =>
    theEstablishmentUiGatewayNavigateToEstablishementFormWithSiret(
      "And given",
      siret,
    );
export const thenTheEstablishmentUiGatewayNavigateToEstablishementFormWithSiret =
  (siret: SiretDto) =>
    theEstablishmentUiGatewayNavigateToEstablishementFormWithSiret(
      "Then",
      siret,
    );
export const andThenTheEstablishmentUiGatewayNavigateToEstablishementFormWithSiret =
  (siret: SiretDto) =>
    theEstablishmentUiGatewayNavigateToEstablishementFormWithSiret(
      "And then",
      siret,
    );

const theEstablishmentUiGatewayNavigateToEstablishementFormWithSiret =
  (gherkin: Gherkin, siret: SiretDto) =>
  (application: ClientTestApplication): void =>
    it(`${gherkin} application navigates to the Register Establishement Form with siret ${siret}.`, () => {
      if (isGiven(gherkin))
        application.gateways.establishmentsUi.navigateToEstablishementFormState =
          siret;
      expect(
        application.gateways.establishmentsUi.navigateToEstablishementFormState,
      ).toEqual(siret);
    });

export const givenTheEstablishmentUiGatewayDoNotNavigateToEstablishementForm =
  () => theEstablishmentUiGatewayDoNotNavigateToEstablishementForm("Given");
export const andGivenTheEstablishmentUiGatewayDoNotNavigateToEstablishementForm =
  () => theEstablishmentUiGatewayDoNotNavigateToEstablishementForm("And given");
export const thenTheEstablishmentUiGatewayDoNotNavigateToEstablishementForm =
  () => theEstablishmentUiGatewayDoNotNavigateToEstablishementForm("Then");
export const andThenTheEstablishmentUiGatewayDoNotNavigateToEstablishementForm =
  () => theEstablishmentUiGatewayDoNotNavigateToEstablishementForm("And then");
const theEstablishmentUiGatewayDoNotNavigateToEstablishementForm =
  (gherkin: Gherkin) =>
  (application: ClientTestApplication): void =>
    it(`${gherkin} application do not navigate to the Register Establishement Form.`, () => {
      if (isGiven(gherkin))
        application.gateways.establishmentsUi.navigateToEstablishementFormState =
          false;
      expect(
        application.gateways.establishmentsUi.navigateToEstablishementFormState,
      ).toEqual(false);
    });
