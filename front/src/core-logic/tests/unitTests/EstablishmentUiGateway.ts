
import { ClientTestApplication } from "src/clientApplication/ClientApplication"
import { EstablishementCallToAction } from "src/core-logic/domain/establishments/EstablishementCallToAction"
import { Gherkin } from "../Gherkin"

export const theEstablishmentUiGatewayHasCallToAction = (gherkin:Gherkin, application:ClientTestApplication, callToAction:EstablishementCallToAction) => {
  it(`${gherkin} the establishment UI Gateway has call to action set to '${callToAction}'`,()=>{
    expect(application.gateways.establishmentsUi.callToAction).toEqual(callToAction)
  })
}