import { ClientTestApplication } from "src/infra/application/ClientApplication";
import { GetSiretResponseDto, SiretDto } from "shared/src/siret";
import { Gherkin, isGiven } from "../Gherkin";

export const givenTheSiretGatewayThroughBackHasSireneRegisteredSirets =
  (expectedRegisteredSirets: { [siret: SiretDto]: GetSiretResponseDto }) =>
    theSiretGatewayThroughBackHasSireneRegisteredSirets(
      "Given",
      expectedRegisteredSirets,
    );
export const andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets =
  (expectedRegisteredSirets: { [siret: SiretDto]: GetSiretResponseDto }) =>
    theSiretGatewayThroughBackHasSireneRegisteredSirets(
      "And given",
      expectedRegisteredSirets,
    );
export const thenTheSiretGatewayThroughBackHasSireneRegisteredSirets =
  (expectedRegisteredSirets: { [siret: SiretDto]: GetSiretResponseDto }) =>
    theSiretGatewayThroughBackHasSireneRegisteredSirets(
      "Then",
      expectedRegisteredSirets,
    );
export const andThenTheSiretGatewayThroughBackHasSireneRegisteredSirets =
  (expectedRegisteredSirets: { [siret: SiretDto]: GetSiretResponseDto }) =>
    theSiretGatewayThroughBackHasSireneRegisteredSirets(
      "And then",
      expectedRegisteredSirets,
    );

const theSiretGatewayThroughBackHasSireneRegisteredSirets =
  (
    gherkin: Gherkin,
    expectedRegisteredSirets: { [siret: SiretDto]: GetSiretResponseDto },
  ) =>
  (application: ClientTestApplication) =>
    it(message(gherkin, expectedRegisteredSirets), () => {
      if (isGiven(gherkin)) {
        application.gateways.siretGatewayThroughBack.sireneEstablishments =
          expectedRegisteredSirets;
      }

      expect(
        application.gateways.siretGatewayThroughBack.sireneEstablishments,
      ).toEqual(expectedRegisteredSirets);
    });

const message = (
  gherkin: Gherkin,
  expectedRegisteredSirets: { [siret: SiretDto]: GetSiretResponseDto },
): string => {
  const prettyRegisteredSirets = Object.values(expectedRegisteredSirets).map(
    (value) => JSON.stringify(value),
  );
  const linebreakWithTab = "\n        ";

  return prettyRegisteredSirets.length === 0
    ? `${gherkin} there is no establishments registered on SIRENE.`
    : `${gherkin} the following establishments are registered on SIRENE:${
        linebreakWithTab + prettyRegisteredSirets.join(linebreakWithTab)
      }`;
};
