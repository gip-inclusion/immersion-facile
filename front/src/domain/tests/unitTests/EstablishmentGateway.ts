import { Gherkin, isGiven } from "../Gherkin";
import { ClientTestApplication } from "../../../infra/application/ClientApplication";

export const givenTheEstablishmentGatewayHasRegisteredSiret = (
  expectedRegisteredSiret: string | string[],
) =>
  theEstablishmentGatewayHasRegisteredSiret("Given", expectedRegisteredSiret);
export const andGivenTheEstablishmentGatewayHasRegisteredSiret = (
  expectedRegisteredSiret: string | string[],
) =>
  theEstablishmentGatewayHasRegisteredSiret(
    "And given",
    expectedRegisteredSiret,
  );
export const thenTheEstablishmentGatewayHasRegisteredSiret = (
  expectedRegisteredSiret: string | string[],
) => theEstablishmentGatewayHasRegisteredSiret("Then", expectedRegisteredSiret);
export const andThenTheEstablishmentGatewayHasRegisteredSiret = (
  expectedRegisteredSiret: string | string[],
) =>
  theEstablishmentGatewayHasRegisteredSiret(
    "And then",
    expectedRegisteredSiret,
  );
const theEstablishmentGatewayHasRegisteredSiret =
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

export const givenTheEstablishmentGatewayDontHasRegisteredSiret = () =>
  theEstablishmentGatewayDontHasRegisteredSiret("Given");
export const andGivenTheEstablishmentGatewayDontHasRegisteredSiret = () =>
  theEstablishmentGatewayDontHasRegisteredSiret("And given");
export const thenTheEstablishmentGatewayDontHasRegisteredSiret = () =>
  theEstablishmentGatewayDontHasRegisteredSiret("Then");
export const andThenTheEstablishmentGatewayDontHasRegisteredSiret = () =>
  theEstablishmentGatewayDontHasRegisteredSiret("And then");

const theEstablishmentGatewayDontHasRegisteredSiret =
  (gherkin: Gherkin) => (application: ClientTestApplication) =>
    it(`${gherkin} no establishments are registered on Immersion Facile.`, () => {
      if (isGiven(gherkin))
        application.gateways.establishments._existingEstablishmentSirets = [];
      expect(
        application.gateways.establishments._existingEstablishmentSirets,
      ).toEqual([]);
    });

export const givenTheEstablishmentGatewayHasModifyEstablishmentRequestForSiret =
  (siret: string) =>
    theEstablishmentGatewayHasModifyEstablishmentRequestForSiret(
      "Given",
      siret,
    );
export const andGivenTheEstablishmentGatewayHasModifyEstablishmentRequestForSiret =
  (siret: string) =>
    theEstablishmentGatewayHasModifyEstablishmentRequestForSiret(
      "And given",
      siret,
    );
export const thenTheEstablishmentGatewayHasModifyEstablishmentRequestForSiret =
  (siret: string) =>
    theEstablishmentGatewayHasModifyEstablishmentRequestForSiret("Then", siret);
export const andThenTheEstablishmentGatewayHasModifyEstablishmentRequestForSiret =
  (siret: string) =>
    theEstablishmentGatewayHasModifyEstablishmentRequestForSiret(
      "And then",
      siret,
    );

const theEstablishmentGatewayHasModifyEstablishmentRequestForSiret =
  (gherkin: Gherkin, siret: string) => (application: ClientTestApplication) =>
    it(`${gherkin} there is a modify establishment request for the SIRET '${siret}'.`, () => {
      if (isGiven(gherkin))
        application.gateways.establishments._currentEstablishmentModifyRequest =
          siret;
      expect(
        application.gateways.establishments._currentEstablishmentModifyRequest,
      ).toEqual(siret);
    });

export const givenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret =
  () =>
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Given");
export const andGivenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret =
  () =>
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    );
export const thenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret =
  () =>
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then");
export const andThenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret =
  () =>
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And then",
    );

const theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret =
  (gherkin: Gherkin) => (application: ClientTestApplication) =>
    it(`${gherkin} there is no modify establishment request.`, () => {
      if (isGiven(gherkin))
        application.gateways.establishments._currentEstablishmentModifyRequest =
          undefined;
      expect(
        application.gateways.establishments._currentEstablishmentModifyRequest,
      ).toEqual(undefined);
    });
