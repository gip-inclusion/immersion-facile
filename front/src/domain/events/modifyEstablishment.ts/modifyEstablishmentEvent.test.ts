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
import { clientScenario } from "../../tests/clientScenario";
import {
  theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret,
  theEstablishmentGatewayDontHasRegisteredSiret,
  theEstablishmentGatewayHasModifyEstablishmentRequestForSiret,
  theEstablishmentGatewayHasRegisteredSiret,
} from "../../tests/unitTests/EstablishmentGateway";
import { ModifyEstablishmentEvent } from "./ModifyEstablishmentEvent";
import { feature } from "src/domain/tests/feature";

feature("ESTABLISHMENT_MODIFICATION_REQUESTED", [
  clientScenario(`Scénario 1 - Existing & registered/open on Sirene SIRET`, [
    theEstablishmentGatewayHasRegisteredSiret("Given", validSiret),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    theImmersionApplicationGatewayHasSireneRegisteredSirets("And given", {
      [existingOpenSireneResponse.siret]: existingOpenSireneResponse,
    }),
    whenTheEventIsSent(new ModifyEstablishmentEvent(validSiret)),
    theEstablishmentGatewayHasModifyEstablishmentRequestForSiret(
      "Then",
      validSiret,
    ),
    theEstablishmentUiGatewayHasCallToAction(
      "And then",
      "MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION",
    ),
  ]),
  clientScenario(`Scénario 2 - Unexisting SIRET`, [
    theEstablishmentGatewayDontHasRegisteredSiret("Given"),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    theImmersionApplicationGatewayHasSireneRegisteredSirets("And given", {
      [existingOpenSireneResponse.siret]: existingOpenSireneResponse,
    }),
    whenTheEventIsSent(new ModifyEstablishmentEvent(validSiret)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction("And then", "UNREGISTERED_SIRET"),
  ]),
  clientScenario(`Scénario 3 - Bad SIRET - too short`, [
    theEstablishmentGatewayDontHasRegisteredSiret("Given"),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    whenTheEventIsSent(new ModifyEstablishmentEvent(badSiretTooShort)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction("And then", "BAD_SIRET"),
  ]),
  clientScenario(`Scénario 4 - Bad SIRET - 13 numbers and 1 letter`, [
    theEstablishmentGatewayDontHasRegisteredSiret("Given"),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    whenTheEventIsSent(new ModifyEstablishmentEvent(badSiretOneWithLetter)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction("And then", "BAD_SIRET"),
  ]),
  clientScenario(`Scénario 5 - Bad SIRET - too long`, [
    theEstablishmentGatewayDontHasRegisteredSiret("Given"),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    whenTheEventIsSent(new ModifyEstablishmentEvent(badSiretTooLong)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction("And then", "BAD_SIRET"),
  ]),
  clientScenario(`Scénario 6 - Existing & registered/closed on Sirene SIRET`, [
    theEstablishmentGatewayHasRegisteredSiret("Given", validSiret),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    theImmersionApplicationGatewayHasSireneRegisteredSirets("And given", {
      [existingClosedSireneResponse.siret]: existingClosedSireneResponse,
    }),
    whenTheEventIsSent(new ModifyEstablishmentEvent(validSiret)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction(
      "And then",
      "CLOSED_ESTABLISHMENT_ON_SIRENE",
    ),
  ]),
  clientScenario(
    `Scénario 7 - Existing SIRET & Missing establishment on Sirene `,
    [
      theEstablishmentGatewayHasRegisteredSiret("Given", validSiret),
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        "And given",
      ),
      theImmersionApplicationGatewayHasSireneRegisteredSirets("And given", {}),
      whenTheEventIsSent(new ModifyEstablishmentEvent(validSiret)),
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
      theEstablishmentUiGatewayHasCallToAction(
        "And then",
        "MISSING_ESTABLISHMENT_ON_SIRENE",
      ),
    ],
  ),
]);
