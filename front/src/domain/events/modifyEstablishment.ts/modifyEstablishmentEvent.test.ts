import {
  badSiretOneWithLetter,
  badSiretTooLong,
  badSiretTooShort,
  existingClosedSireneResponse,
  existingOpenSireneResponse,
  validSiret,
} from "src/domain/tests/expectedValues";
import { feature } from "src/domain/tests/feature";
import { theEstablishmentUiGatewayHasCallToAction } from "src/domain/tests/unitTests/EstablishmentUiGateway";
import { whenTheEventIsSent } from "src/domain/tests/unitTests/EventGateway";
import { theSiretGatewayThroughBackHasSireneRegisteredSirets } from "src/domain/tests/unitTests/ImmersionApplicationGateway";
import {
  apiSirenNotAvailableSiret,
  apiSirenUnexpectedError,
  tooManySirenRequestsSiret,
} from "shared/src/siret";
import { clientScenario } from "../../tests/clientScenario";
import {
  theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret,
  theEstablishmentGatewayDontHasRegisteredSiret,
  theEstablishmentGatewayHasModifyEstablishmentRequestForSiret,
  theEstablishmentGatewayHasRegisteredSiret,
} from "../../tests/unitTests/EstablishmentGateway";
import { ModifyEstablishmentEvent } from "./ModifyEstablishmentEvent";

feature("ESTABLISHMENT_MODIFICATION_REQUESTED", [
  clientScenario(`Scénario 1 - Existing & registered/open on Sirene SIRET`, [
    theEstablishmentGatewayHasRegisteredSiret("Given", validSiret),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    theSiretGatewayThroughBackHasSireneRegisteredSirets("And given", {
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
    theSiretGatewayThroughBackHasSireneRegisteredSirets("And given", {
      [existingOpenSireneResponse.siret]: existingOpenSireneResponse,
    }),
    whenTheEventIsSent(new ModifyEstablishmentEvent(validSiret)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction(
      "And then",
      "ERROR_UNREGISTERED_SIRET",
    ),
  ]),
  clientScenario(`Scénario 3 - Bad SIRET - too short`, [
    theEstablishmentGatewayDontHasRegisteredSiret("Given"),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    whenTheEventIsSent(new ModifyEstablishmentEvent(badSiretTooShort)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction("And then", "ERROR_BAD_SIRET"),
  ]),
  clientScenario(`Scénario 4 - Bad SIRET - 13 numbers and 1 letter`, [
    theEstablishmentGatewayDontHasRegisteredSiret("Given"),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    whenTheEventIsSent(new ModifyEstablishmentEvent(badSiretOneWithLetter)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction("And then", "ERROR_BAD_SIRET"),
  ]),
  clientScenario(`Scénario 5 - Bad SIRET - too long`, [
    theEstablishmentGatewayDontHasRegisteredSiret("Given"),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    whenTheEventIsSent(new ModifyEstablishmentEvent(badSiretTooLong)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction("And then", "ERROR_BAD_SIRET"),
  ]),
  clientScenario(`Scénario 6 - Existing & registered/closed on Sirene SIRET`, [
    theEstablishmentGatewayHasRegisteredSiret("Given", validSiret),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    theSiretGatewayThroughBackHasSireneRegisteredSirets("And given", {
      [existingClosedSireneResponse.siret]: existingClosedSireneResponse,
    }),
    whenTheEventIsSent(new ModifyEstablishmentEvent(validSiret)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction(
      "And then",
      "ERROR_CLOSED_ESTABLISHMENT_ON_SIRENE",
    ),
  ]),
  clientScenario(
    `Scénario 7 - Existing SIRET & Missing establishment on Sirene`,
    [
      theEstablishmentGatewayHasRegisteredSiret("Given", validSiret),
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
        "And given",
      ),
      theSiretGatewayThroughBackHasSireneRegisteredSirets("And given", {}),
      whenTheEventIsSent(new ModifyEstablishmentEvent(validSiret)),
      theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
      theEstablishmentUiGatewayHasCallToAction(
        "And then",
        "ERROR_MISSING_ESTABLISHMENT_ON_SIRENE",
      ),
    ],
  ),
  clientScenario(`Scénario 9 - Existing SIRET & too many request en SIRENE`, [
    theEstablishmentGatewayHasRegisteredSiret(
      "Given",
      tooManySirenRequestsSiret,
    ),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    theSiretGatewayThroughBackHasSireneRegisteredSirets("And given", {
      [tooManySirenRequestsSiret]: {
        siret: tooManySirenRequestsSiret,
        businessAddress: "",
        businessName: "",
        isOpen: true,
      },
    }),
    whenTheEventIsSent(new ModifyEstablishmentEvent(tooManySirenRequestsSiret)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction(
      "And then",
      "ERROR_TOO_MANY_REQUESTS_ON_SIRET_API",
    ),
  ]),
  clientScenario(`Scénario 10 - Existing SIRET & API Sirene unavailable`, [
    theEstablishmentGatewayHasRegisteredSiret(
      "Given",
      apiSirenNotAvailableSiret,
    ),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    theSiretGatewayThroughBackHasSireneRegisteredSirets("And given", {
      [apiSirenNotAvailableSiret]: {
        siret: apiSirenNotAvailableSiret,
        businessAddress: "",
        businessName: "",
        isOpen: true,
      },
    }),
    whenTheEventIsSent(new ModifyEstablishmentEvent(apiSirenNotAvailableSiret)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction(
      "And then",
      "ERROR_SIRENE_API_UNAVAILABLE",
    ),
  ]),
  clientScenario(`Scénario 11 - Existing SIRET & API Sirene unexpected error`, [
    theEstablishmentGatewayHasRegisteredSiret("Given", apiSirenUnexpectedError),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(
      "And given",
    ),
    theSiretGatewayThroughBackHasSireneRegisteredSirets("And given", {
      [apiSirenUnexpectedError]: {
        siret: apiSirenUnexpectedError,
        businessAddress: "",
        businessName: "",
        isOpen: true,
      },
    }),
    whenTheEventIsSent(new ModifyEstablishmentEvent(apiSirenUnexpectedError)),
    theEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret("Then"),
    theEstablishmentUiGatewayHasCallToAction(
      "And then",
      "ERROR_UNEXPECTED_ERROR",
    ),
  ]),
]);
