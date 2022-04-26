import { EstablishementCallToAction } from "src/domain/valueObjects/EstablishementCallToAction";
import { ClientTestApplication } from "src/infra/application/ClientApplication";
import { Gherkin } from "../Gherkin";

export const theEstablishmentUiGatewayHasCallToAction = (
  gherkin: Gherkin,
  application: ClientTestApplication,
  callToAction: EstablishementCallToAction,
) => {
  it(`${gherkin} the establishment UI Gateway has call to action set to '${callToAction}'`, () => {
    expect(application.gateways.establishmentsUi.callToAction).toEqual(
      callToAction,
    );
  });
};
