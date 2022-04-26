import {
  badSiretOneWithLetter,
  badSiretTooLong,
  badSiretTooShort,
  emptySiret,
  existingClosedSireneResponse,
  existingOpenSireneResponse,
  validSiret,
} from "src/domain/tests/expectedValues";
import { theEstablishmentUiGatewayHasCallToAction } from "src/domain/tests/unitTests/EstablishmentUiGateway";
import { whenTheEventIsSent } from "src/domain/tests/unitTests/EventGateway";
import { EstablishementCallToAction } from "../../valueObjects/EstablishementCallToAction";
import { clientScenario } from "../../tests/clientScenario";
import { Gherkin } from "../../tests/Gherkin";
import {
  theEstablishmentGatewayDontHasRegisteredSiret,
  theEstablishmentGatewayHasRegisteredSiret,
} from "../../tests/unitTests/EstablishmentGateway";
import { VerifySiretEvent } from "./VerifySiretEvent";
import { theImmersionApplicationGatewayHasSireneRegisteredSirets } from "src/domain/tests/unitTests/ImmersionApplicationGateway";

describe("Feature - Verify SIRET", () => {
  clientScenario(`Scénario 1 - Existing SIRET - Modify Establishment`, [
    (app) =>
      theEstablishmentGatewayHasRegisteredSiret(Gherkin.GIVEN, app, validSiret),
    (app) =>
      theImmersionApplicationGatewayHasSireneRegisteredSirets(
        Gherkin.GIVEN,
        app,
        {[existingOpenSireneResponse.siret]: existingOpenSireneResponse},
      ),
    (app) => whenTheEventIsSent(app, new VerifySiretEvent(validSiret)),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.MODIFY_ESTABLISHEMENT,
      ),
  ]);
  clientScenario(`Scénario 2 - Unexisting SIRET - Register Establishment`, [
    (app) => theEstablishmentGatewayDontHasRegisteredSiret(Gherkin.GIVEN, app),
    (app) =>
      theImmersionApplicationGatewayHasSireneRegisteredSirets(
        Gherkin.GIVEN,
        app,
        {[existingOpenSireneResponse.siret]: existingOpenSireneResponse},
      ),
    (app) => whenTheEventIsSent(app, new VerifySiretEvent(validSiret)),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.REGISTER_ESTABLISHEMENT,
      ),
  ]);
  clientScenario(`Scénario 3 - Bad SIRET - too short`, [
    (app) => whenTheEventIsSent(app, new VerifySiretEvent(badSiretTooShort)),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.BAD_SIRET,
      ),
  ]);
  clientScenario(`Scénario 4 - Bad SIRET - 13 numbers and 1 letter`, [
    (app) =>
      whenTheEventIsSent(app, new VerifySiretEvent(badSiretOneWithLetter)),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.BAD_SIRET,
      ),
  ]);
  clientScenario(`Scénario 5 - Bad SIRET - too long`, [
    (app) => whenTheEventIsSent(app, new VerifySiretEvent(badSiretTooLong)),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.BAD_SIRET,
      ),
  ]);
  clientScenario(`Scénario 6 - NOTHING - Empty SIRET`, [
    (app) => whenTheEventIsSent(app, new VerifySiretEvent(emptySiret)),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.NOTHING,
      ),
  ]);
  clientScenario(`Scénario 7 - Existing SIRET - Closed Sirene Establishment`, [
    (app) =>
      theEstablishmentGatewayHasRegisteredSiret(Gherkin.GIVEN, app, validSiret),
    (app) =>
      theImmersionApplicationGatewayHasSireneRegisteredSirets(
        Gherkin.GIVEN,
        app,
        {[existingClosedSireneResponse.siret]: existingClosedSireneResponse},
      ),
    (app) => whenTheEventIsSent(app, new VerifySiretEvent(validSiret)),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.CLOSED_ESTABLISHMENT_ON_SIRENE,
      ),
  ]);
  clientScenario(`Scénario 8 - Existing SIRET - Missing Sirene Establishment`, [
    (app) =>
      theEstablishmentGatewayHasRegisteredSiret(Gherkin.GIVEN, app, validSiret),
    (app) =>
      theImmersionApplicationGatewayHasSireneRegisteredSirets(
        Gherkin.GIVEN,
        app,
        {}
      ),
    (app) => whenTheEventIsSent(app, new VerifySiretEvent(validSiret)),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.MISSING_ESTABLISHMENT_ON_SIRENE,
      ),
  ]);
});
