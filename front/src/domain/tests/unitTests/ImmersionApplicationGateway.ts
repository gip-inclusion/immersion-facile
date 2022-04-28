import { ClientTestApplication } from "src/infra/application/ClientApplication";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { Gherkin } from "../Gherkin";

export function theImmersionApplicationGatewayHasSireneRegisteredSirets(
  gherkin: Gherkin,
  application: ClientTestApplication,
  expectedRegisteredSirets: { [siret: SiretDto]: GetSiretResponseDto },
) {
  return it(`${gherkin} the establishment gateway has Sirene registered SIRETs '${JSON.stringify(
    expectedRegisteredSirets,
  )}'`, () => {
    if (gherkin === Gherkin.GIVEN)
      application.gateways.immersionApplication._sireneEstablishments =
        expectedRegisteredSirets;
    expect(
      application.gateways.immersionApplication._sireneEstablishments,
    ).toEqual(expectedRegisteredSirets);
  });
}
