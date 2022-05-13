import { expectToEqual } from "shared/src/expectToEqual";
import { EstablishementCallToAction } from "src/domain/valueObjects/EstablishementCallToAction";
import { ClientTestApplication } from "src/infra/application/ClientApplication";
import { Gherkin } from "../Gherkin";

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
      expectToEqual(
        application.store.getState().homeEstablishmentSlice.status,
        establishmentCallToAction,
      );
    });
  };
