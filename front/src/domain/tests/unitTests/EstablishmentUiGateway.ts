import { EstablishementCallToAction } from "src/domain/valueObjects/EstablishementCallToAction";
import { ClientTestApplication } from "src/infra/application/ClientApplication";
import { Gherkin } from "../Gherkin";

export const theEstablishmentUiGatewayHasCallToAction =
  (gherkin: Gherkin, establishmentCallToAction: EstablishementCallToAction) =>
  (application: ClientTestApplication) => {
    it(`${gherkin} the establishment call to action status is set to '${establishmentCallToAction}'.`, () => {
      expect(application.gateways.establishmentsUi.callToAction).toEqual(
        establishmentCallToAction,
      );
    });
  };
