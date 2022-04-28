import {
  badSiretOneWithLetter,
  badSiretTooLong,
  badSiretTooShort,
  existingClosedSireneResponse,
  existingOpenSireneResponse,
  validSiret,
} from "src/domain/tests/expectedValues";
import { theEstablishmentUiGatewayHasCallToAction } from "src/domain/tests/unitTests/EstablishmentUiGateway";
import { whenTheEventIsSent } from "src/domain/tests/unitTests/EventGateway";
import { theImmersionApplicationGatewayHasSireneRegisteredSirets } from "src/domain/tests/unitTests/ImmersionApplicationGateway";
import { EstablishementCallToAction } from "../../valueObjects/EstablishementCallToAction";
import { clientScenario } from "../../tests/clientScenario";
import { Gherkin } from "../../tests/Gherkin";
import {
  theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret,
  theEstablishmentGatewayDontHasRegisteredSiret,
  theEstablishmentGatewayHasModifyEstablishmentRequestForSiret,
  theEstablishmentGatewayHasRegisteredSiret,
} from "../../tests/unitTests/EstablishmentGateway";
import { EventType } from "../ApplicationEvent";
import { ModifyEstablishmentEvent } from "./ModifyEstablishmentEvent";

describe(`Feature - ${EventType.MODIFY_ESTABLISHMENT}`, () => {
  clientScenario(`Scénario 1 - Existing & registered/open on Sirene SIRET`, [
    (app) =>
      theEstablishmentGatewayHasRegisteredSiret(Gherkin.GIVEN, app, validSiret),
    (app) =>
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        Gherkin.GIVEN,
        app,
      ),
    (app) =>
      theImmersionApplicationGatewayHasSireneRegisteredSirets(
        Gherkin.GIVEN,
        app,
        { [existingOpenSireneResponse.siret]: existingOpenSireneResponse },
      ),
    (app) => whenTheEventIsSent(app, new ModifyEstablishmentEvent(validSiret)),
    (app) =>
      theEstablishmentGatewayHasModifyEstablishmentRequestForSiret(
        Gherkin.THEN,
        app,
        validSiret,
      ),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION,
      ),
  ]);
  clientScenario(`Scénario 2 - Unexisting SIRET`, [
    (app) => theEstablishmentGatewayDontHasRegisteredSiret(Gherkin.GIVEN, app),
    (app) =>
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        Gherkin.GIVEN,
        app,
      ),
    (app) =>
      theImmersionApplicationGatewayHasSireneRegisteredSirets(
        Gherkin.GIVEN,
        app,
        { [existingOpenSireneResponse.siret]: existingOpenSireneResponse },
      ),
    (app) => whenTheEventIsSent(app, new ModifyEstablishmentEvent(validSiret)),
    (app) =>
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        Gherkin.THEN,
        app,
      ),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.UNREGISTERED_SIRET,
      ),
  ]);
  clientScenario(`Scénario 3 - Bad SIRET - too short`, [
    (app) => theEstablishmentGatewayDontHasRegisteredSiret(Gherkin.GIVEN, app),
    (app) =>
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        Gherkin.GIVEN,
        app,
      ),
    (app) =>
      whenTheEventIsSent(app, new ModifyEstablishmentEvent(badSiretTooShort)),
    (app) =>
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        Gherkin.THEN,
        app,
      ),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.BAD_SIRET,
      ),
  ]);
  clientScenario(`Scénario 4 - Bad SIRET - 13 numbers and 1 letter`, [
    (app) => theEstablishmentGatewayDontHasRegisteredSiret(Gherkin.GIVEN, app),
    (app) =>
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        Gherkin.GIVEN,
        app,
      ),
    (app) =>
      whenTheEventIsSent(
        app,
        new ModifyEstablishmentEvent(badSiretOneWithLetter),
      ),
    (app) =>
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        Gherkin.THEN,
        app,
      ),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.BAD_SIRET,
      ),
  ]);
  clientScenario(`Scénario 5 - Bad SIRET - too long`, [
    (app) => theEstablishmentGatewayDontHasRegisteredSiret(Gherkin.GIVEN, app),
    (app) =>
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        Gherkin.GIVEN,
        app,
      ),
    (app) =>
      whenTheEventIsSent(app, new ModifyEstablishmentEvent(badSiretTooLong)),
    (app) =>
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        Gherkin.THEN,
        app,
      ),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.BAD_SIRET,
      ),
  ]);
  clientScenario(`Scénario 6 - Existing & registered/closed on Sirene SIRET`, [
    (app) =>
      theEstablishmentGatewayHasRegisteredSiret(Gherkin.GIVEN, app, validSiret),
    (app) =>
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        Gherkin.GIVEN,
        app,
      ),
    (app) =>
      theImmersionApplicationGatewayHasSireneRegisteredSirets(
        Gherkin.GIVEN,
        app,
        { [existingClosedSireneResponse.siret]: existingClosedSireneResponse },
      ),
    (app) => whenTheEventIsSent(app, new ModifyEstablishmentEvent(validSiret)),
    (app) =>
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        Gherkin.THEN,
        app,
      ),
    (app) =>
      theEstablishmentUiGatewayHasCallToAction(
        Gherkin.THEN,
        app,
        EstablishementCallToAction.CLOSED_ESTABLISHMENT_ON_SIRENE,
      ),
  ]);
  clientScenario(
    `Scénario 7 - Existing SIRET & Missing establishment on Sirene `,
    [
      (app) =>
        theEstablishmentGatewayHasRegisteredSiret(
          Gherkin.GIVEN,
          app,
          validSiret,
        ),
      (app) =>
        theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
          Gherkin.GIVEN,
          app,
        ),
      (app) =>
        theImmersionApplicationGatewayHasSireneRegisteredSirets(
          Gherkin.GIVEN,
          app,
          {},
        ),
      (app) =>
        whenTheEventIsSent(app, new ModifyEstablishmentEvent(validSiret)),
      (app) =>
        theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
          Gherkin.THEN,
          app,
        ),
      (app) =>
        theEstablishmentUiGatewayHasCallToAction(
          Gherkin.THEN,
          app,
          EstablishementCallToAction.MISSING_ESTABLISHMENT_ON_SIRENE,
        ),
    ],
  );
});
