import { EstablishementCallToAction } from "src/domain/valueObjects/EstablishementCallToAction";
import { ClientTestApplication } from "src/infra/application/ClientApplication";
import { SiretDto } from "shared/src/siret";
import { Gherkin, isGiven } from "../Gherkin";

export const theEstablishmentUiGatewayHasCallToAction =
  (gherkin: Gherkin, establishmentCallToAction: EstablishementCallToAction) =>
  (application: ClientTestApplication) => {
    it(`${gherkin} the establishment call to action status is set to '${establishmentCallToAction}'.`, () => {
      expect(application.gateways.establishmentsUi.callToAction).toEqual(
        establishmentCallToAction,
      );
    });
  };

export const theEstablishmentUiGatewayNavigateToEstablishementFormWithSiret =
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
export const theEstablishmentUiGatewayDoNotNavigateToEstablishementForm =
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
