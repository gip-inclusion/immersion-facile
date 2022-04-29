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
import { clientScenario } from "../../tests/clientScenario";
import {
  theEstablishmentGatewayDontHasRegisteredSiret,
  theEstablishmentGatewayHasRegisteredSiret,
} from "../../tests/unitTests/EstablishmentGateway";
import { VerifySiretEvent } from "./VerifySiretEvent";
import { theImmersionApplicationGatewayHasSireneRegisteredSirets } from "src/domain/tests/unitTests/ImmersionApplicationGateway";
import { feature } from "src/domain/tests/feature";

feature("SIRET_VERIFICATION_REQUESTED", [
  clientScenario(`Scénario 1 - Existing SIRET - Modify Establishment`, [
    theEstablishmentGatewayHasRegisteredSiret("Given", validSiret),
    theImmersionApplicationGatewayHasSireneRegisteredSirets("And given", {
      [existingOpenSireneResponse.siret]: existingOpenSireneResponse,
    }),
    whenTheEventIsSent(new VerifySiretEvent(validSiret)),
    theEstablishmentUiGatewayHasCallToAction("Then", "MODIFY_ESTABLISHEMENT"),
  ]),
  clientScenario(`Scénario 2 - Unexisting SIRET - Register Establishment`, [
    theEstablishmentGatewayDontHasRegisteredSiret("Given"),
    theImmersionApplicationGatewayHasSireneRegisteredSirets("And given", {
      [existingOpenSireneResponse.siret]: existingOpenSireneResponse,
    }),
    whenTheEventIsSent(new VerifySiretEvent(validSiret)),
    theEstablishmentUiGatewayHasCallToAction("Then", "REGISTER_ESTABLISHEMENT"),
  ]),
  clientScenario(`Scénario 3 - Bad SIRET - too short`, [
    whenTheEventIsSent(new VerifySiretEvent(badSiretTooShort)),
    theEstablishmentUiGatewayHasCallToAction("Then", "BAD_SIRET"),
  ]),
  clientScenario(`Scénario 4 - Bad SIRET - 13 numbers and 1 letter`, [
    whenTheEventIsSent(new VerifySiretEvent(badSiretOneWithLetter)),
    theEstablishmentUiGatewayHasCallToAction("Then", "BAD_SIRET"),
  ]),
  clientScenario(`Scénario 5 - Bad SIRET - too long`, [
    whenTheEventIsSent(new VerifySiretEvent(badSiretTooLong)),
    theEstablishmentUiGatewayHasCallToAction("Then", "BAD_SIRET"),
  ]),
  clientScenario(`Scénario 6 - NOTHING - Empty SIRET`, [
    whenTheEventIsSent(new VerifySiretEvent(emptySiret)),
    theEstablishmentUiGatewayHasCallToAction("Then", "NOTHING"),
  ]),
  clientScenario(`Scénario 7 - Existing SIRET - Closed Sirene Establishment`, [
    theEstablishmentGatewayHasRegisteredSiret("Given", validSiret),
    theImmersionApplicationGatewayHasSireneRegisteredSirets("And given", {
      [existingClosedSireneResponse.siret]: existingClosedSireneResponse,
    }),
    whenTheEventIsSent(new VerifySiretEvent(validSiret)),
    theEstablishmentUiGatewayHasCallToAction(
      "Then",
      "CLOSED_ESTABLISHMENT_ON_SIRENE",
    ),
  ]),
  clientScenario(`Scénario 8 - Existing SIRET - Missing Sirene Establishment`, [
    theEstablishmentGatewayHasRegisteredSiret("Given", validSiret),
    theImmersionApplicationGatewayHasSireneRegisteredSirets("And given", {}),
    whenTheEventIsSent(new VerifySiretEvent(validSiret)),
    theEstablishmentUiGatewayHasCallToAction(
      "Then",
      "MISSING_ESTABLISHMENT_ON_SIRENE",
    ),
  ]),
]);
