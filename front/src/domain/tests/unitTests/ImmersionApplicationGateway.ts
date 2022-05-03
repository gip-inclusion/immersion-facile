import { ClientTestApplication } from "src/infra/application/ClientApplication";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { Gherkin, isGiven } from "../Gherkin";

export const theSiretGatewayThroughBackHasSireneRegisteredSirets =
  (
    gherkin: Gherkin,
    expectedRegisteredSirets: { [siret: SiretDto]: GetSiretResponseDto },
  ) =>
  (application: ClientTestApplication) =>
    it(message(gherkin, expectedRegisteredSirets), () => {
      if (isGiven(gherkin))
        application.gateways.siretGatewayThroughBack.sireneEstablishments =
          expectedRegisteredSirets;
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
