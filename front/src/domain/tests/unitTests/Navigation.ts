import { ClientTestApplication } from "src/infra/application/ClientApplication";
import { SiretDto } from "shared/src/siret";
import { Gherkin, isGiven } from "../Gherkin";

export const givenTheEstablishmentUiGatewayNavigateToEstablishementFormWithSiret =
  (siret: SiretDto) =>
    theEstablishmentUiGatewayNavigateToEstablishementFormWithSiret(
      "Given",
      siret,
    );
export const andGivenTheEstablishmentUiGatewayNavigateToEstablishementFormWithSiret =
  (siret: SiretDto) =>
    theEstablishmentUiGatewayNavigateToEstablishementFormWithSiret(
      "And given",
      siret,
    );
export const thenTheEstablishmentUiGatewayNavigateToEstablishementFormWithSiret =
  (siret: SiretDto) =>
    theEstablishmentUiGatewayNavigateToEstablishementFormWithSiret(
      "Then",
      siret,
    );
export const andThenTheEstablishmentUiGatewayNavigateToEstablishementFormWithSiret =
  (siret: SiretDto) =>
    theEstablishmentUiGatewayNavigateToEstablishementFormWithSiret(
      "And then",
      siret,
    );

const theEstablishmentUiGatewayNavigateToEstablishementFormWithSiret =
  (gherkin: Gherkin, siret: SiretDto) =>
  (application: ClientTestApplication): void =>
    it(`${gherkin} application navigates to the Register Establishement Form with siret ${siret}.`, () => {
      if (isGiven(gherkin))
        application.gateways.navigation.navigatedToEstablishmentForm = siret;
      expect(
        application.gateways.navigation.navigatedToEstablishmentForm,
      ).toEqual(siret);
    });

export const givenTheEstablishmentUiGatewayDoNotNavigateToEstablishementForm =
  () => theEstablishmentUiGatewayDoNotNavigateToEstablishementForm("Given");
export const andGivenTheEstablishmentUiGatewayDoNotNavigateToEstablishementForm =
  () => theEstablishmentUiGatewayDoNotNavigateToEstablishementForm("And given");
export const thenTheEstablishmentUiGatewayDoNotNavigateToEstablishementForm =
  () => theEstablishmentUiGatewayDoNotNavigateToEstablishementForm("Then");
export const andThenTheEstablishmentUiGatewayDoNotNavigateToEstablishementForm =
  () => theEstablishmentUiGatewayDoNotNavigateToEstablishementForm("And then");
const theEstablishmentUiGatewayDoNotNavigateToEstablishementForm =
  (gherkin: Gherkin) =>
  (application: ClientTestApplication): void =>
    it(`${gherkin} application do not navigate to the Register Establishement Form.`, () => {
      if (isGiven(gherkin))
        application.gateways.navigation.navigatedToEstablishmentForm = null;
      expect(
        application.gateways.navigation.navigatedToEstablishmentForm,
      ).toEqual(false);
    });
