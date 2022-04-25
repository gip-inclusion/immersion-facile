import { Gherkin } from "../Gherkin";
import { ClientTestApplication } from "../../../clientApplication/ClientApplication";

export function theEstablishmentGatewayHasRegisteredSiret(
  gherkin: Gherkin,
  application: ClientTestApplication,
  expectedRegisteredSiret: string | string[],
) {
  const expectedRegisteredSirets = Array.isArray(expectedRegisteredSiret)
    ? expectedRegisteredSiret
    : [expectedRegisteredSiret];
  return it(`${gherkin} the establishment gateway has the registered SIRET '${expectedRegisteredSiret}'`, () => {
    if (gherkin === Gherkin.GIVEN)
      application.gateways.establishments._existingEstablishmentSirets =
        expectedRegisteredSirets;
    expect(
      application.gateways.establishments._existingEstablishmentSirets,
    ).toEqual(expectedRegisteredSirets);
  });
}

export function theEstablishmentGatewayDontHasRegisteredSiret(
  gherkin: Gherkin,
  application: ClientTestApplication,
) {
  return it(`${gherkin} the establishment gateway don't has the registered SIRET.`, () => {
    if (gherkin === Gherkin.GIVEN)
      application.gateways.establishments._existingEstablishmentSirets = [];
    expect(
      application.gateways.establishments._existingEstablishmentSirets,
    ).toEqual([]);
  });
}

export const theEstablishmentGatewayHasModifyEstablishmentRequestForSiret = (
  gherkin: Gherkin,
  application: ClientTestApplication,
  siret: string,
) =>
  it(`${gherkin} the establishment gateway has a modify establishment request for the SIRET '${siret}'`, () => {
    if (gherkin === Gherkin.GIVEN)
      application.gateways.establishments._currentEstablishmentModifyRequest =
        siret;
    expect(
      application.gateways.establishments._currentEstablishmentModifyRequest,
    ).toEqual(siret);
  });

export const theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret =
  (gherkin: Gherkin, application: ClientTestApplication) =>
    it(`${gherkin} the establishment gateway don't has a modify establishment request`, () => {
      if (gherkin === Gherkin.GIVEN)
        application.gateways.establishments._currentEstablishmentModifyRequest =
          undefined;
      expect(
        application.gateways.establishments._currentEstablishmentModifyRequest,
      ).toEqual(undefined);
    });
