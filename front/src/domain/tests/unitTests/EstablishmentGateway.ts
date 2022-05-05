import { Gherkin, isGiven } from "../Gherkin";
import { ClientTestApplication } from "../../../infra/application/ClientApplication";

export const theEstablishmentGatewayHasRegisteredSiret =
  (gherkin: Gherkin, expectedRegisteredSiret: string | string[]) =>
  (application: ClientTestApplication) => {
    const expectedRegisteredSirets = Array.isArray(expectedRegisteredSiret)
      ? expectedRegisteredSiret
      : [expectedRegisteredSiret];

    return it(`${gherkin} the establishments with SIRET '${expectedRegisteredSirets}' are registered on Immersion Facile.`, () => {
      if (isGiven(gherkin))
        application.gateways.establishments._existingEstablishmentSirets =
          expectedRegisteredSirets;
      expect(
        application.gateways.establishments._existingEstablishmentSirets,
      ).toEqual(expectedRegisteredSirets);
    });
  };

export const theEstablishmentGatewayDontHasRegisteredSiret =
  (gherkin: Gherkin) => (application: ClientTestApplication) =>
    it(`${gherkin} no establishments are registered on Immersion Facile.`, () => {
      if (isGiven(gherkin))
        application.gateways.establishments._existingEstablishmentSirets = [];
      expect(
        application.gateways.establishments._existingEstablishmentSirets,
      ).toEqual([]);
    });

export const theEstablishmentGatewayHasModifyEstablishmentRequestForSiret =
  (gherkin: Gherkin, siret: string) => (application: ClientTestApplication) =>
    it(`${gherkin} there is a modify establishment request for the SIRET '${siret}'.`, () => {
      if (isGiven(gherkin))
        application.gateways.establishments._currentEstablishmentModifyRequest =
          siret;
      expect(
        application.gateways.establishments._currentEstablishmentModifyRequest,
      ).toEqual(siret);
    });

export const theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret =
  (gherkin: Gherkin) => (application: ClientTestApplication) =>
    it(`${gherkin} there is no modify establishment request.`, () => {
      if (isGiven(gherkin))
        application.gateways.establishments._currentEstablishmentModifyRequest =
          undefined;
      expect(
        application.gateways.establishments._currentEstablishmentModifyRequest,
      ).toEqual(undefined);
    });
