import {
  badSiretOneWithLetter,
  badSiretTooLong,
  badSiretTooShort,
  validSiret,
} from "src/core-logic/tests/expectedValues";
import { theEstablishmentUiGatewayHasCallToAction } from "src/core-logic/tests/unitTests/EstablishmentUiGateway";
import { whenTheEventIsSent } from "src/core-logic/tests/unitTests/EventGateway";
import { EstablishementCallToAction } from "../../domain/establishments/EstablishementCallToAction";
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
  clientScenario(`Scénario 1 - Existing SIRET`, [
    (app) =>
      theEstablishmentGatewayHasRegisteredSiret(Gherkin.GIVEN, app, validSiret),
    (app) =>
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        Gherkin.GIVEN,
        app,
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
});
