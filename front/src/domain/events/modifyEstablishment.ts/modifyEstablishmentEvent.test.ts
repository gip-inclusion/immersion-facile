import {
  apiSirenNotAvailableSiret,
  apiSirenUnexpectedError,
  tooManySirenRequestsSiret,
} from "shared/src/siret";
import {
  badSiretOneWithLetter,
  badSiretTooLong,
  badSiretTooShort,
  existingClosedSireneResponse,
  existingOpenSireneResponse,
  validSiret,
} from "src/domain/tests/expectedValues";
import { andThenTheEstablishmentUiGatewayHasCallToAction } from "src/domain/tests/unitTests/EstablishmentUiGateway";
import { whenTheEventIsSent } from "src/domain/tests/unitTests/EventGateway";
import { andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets } from "src/domain/tests/unitTests/ImmersionApplicationGateway";

import { executeTestSuite } from "../../tests/testSuit";
import {
  andGivenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret,
  givenTheEstablishmentGatewayDontHasRegisteredSiret,
  givenTheEstablishmentGatewayHasRegisteredSiret,
  thenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret,
  thenTheEstablishmentGatewayHasModifyEstablishmentRequestForSiret,
} from "../../tests/unitTests/EstablishmentGateway";
import { ModifyEstablishmentEvent } from "./ModifyEstablishmentEvent";

describe(`Feature - "ESTABLISHMENT_MODIFICATION_REQUESTED"`, () => {
  describe(`Scénario 1 - Existing & registered/open on Sirene SIRET`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayHasRegisteredSiret(validSiret),
      andGivenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({
        [existingOpenSireneResponse.siret]: existingOpenSireneResponse,
      }),
      whenTheEventIsSent(new ModifyEstablishmentEvent(validSiret)),
      thenTheEstablishmentGatewayHasModifyEstablishmentRequestForSiret(
        validSiret,
      ),
      andThenTheEstablishmentUiGatewayHasCallToAction(
        "MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION",
      ),
    ]);
  });
  describe(`Scénario 2 - Unexisting SIRET`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayDontHasRegisteredSiret(),
      andGivenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({
        [existingOpenSireneResponse.siret]: existingOpenSireneResponse,
      }),
      whenTheEventIsSent(new ModifyEstablishmentEvent(validSiret)),
      thenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andThenTheEstablishmentUiGatewayHasCallToAction(
        "ERROR_UNREGISTERED_SIRET",
      ),
    ]);
  });
  describe(`Scénario 3 - Bad SIRET - too short`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayDontHasRegisteredSiret(),
      andGivenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      whenTheEventIsSent(new ModifyEstablishmentEvent(badSiretTooShort)),
      thenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andThenTheEstablishmentUiGatewayHasCallToAction("ERROR_BAD_SIRET"),
    ]);
  });
  describe(`Scénario 4 - Bad SIRET - 13 numbers and 1 letter`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayDontHasRegisteredSiret(),
      andGivenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      whenTheEventIsSent(new ModifyEstablishmentEvent(badSiretOneWithLetter)),
      thenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andThenTheEstablishmentUiGatewayHasCallToAction("ERROR_BAD_SIRET"),
    ]);
  });
  describe(`Scénario 5 - Bad SIRET - too long`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayDontHasRegisteredSiret(),
      andGivenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      whenTheEventIsSent(new ModifyEstablishmentEvent(badSiretTooLong)),
      thenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andThenTheEstablishmentUiGatewayHasCallToAction("ERROR_BAD_SIRET"),
    ]);
  });

  describe(`Scénario 6 - Existing & registered/closed on Sirene SIRET`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayHasRegisteredSiret(validSiret),
      andGivenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({
        [existingClosedSireneResponse.siret]: existingClosedSireneResponse,
      }),
      whenTheEventIsSent(new ModifyEstablishmentEvent(validSiret)),
      thenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andThenTheEstablishmentUiGatewayHasCallToAction(
        "ERROR_CLOSED_ESTABLISHMENT_ON_SIRENE",
      ),
    ]);
  });
  describe(`Scénario 7 - Existing SIRET & Missing establishment on Sirene`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayHasRegisteredSiret(validSiret),
      andGivenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({}),
      whenTheEventIsSent(new ModifyEstablishmentEvent(validSiret)),
      thenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andThenTheEstablishmentUiGatewayHasCallToAction(
        "ERROR_MISSING_ESTABLISHMENT_ON_SIRENE",
      ),
    ]);
  });
  describe(`Scénario 9 - Existing SIRET & too many request en SIRENE`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayHasRegisteredSiret(tooManySirenRequestsSiret),
      andGivenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({
        [tooManySirenRequestsSiret]: {
          siret: tooManySirenRequestsSiret,
          businessAddress: "",
          businessName: "",
          isOpen: true,
        },
      }),
      whenTheEventIsSent(
        new ModifyEstablishmentEvent(tooManySirenRequestsSiret),
      ),
      thenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andThenTheEstablishmentUiGatewayHasCallToAction(
        "ERROR_TOO_MANY_REQUESTS_ON_SIRET_API",
      ),
    ]);
  });
  describe(`Scénario 10 - Existing SIRET & API Sirene unavailable`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayHasRegisteredSiret(apiSirenNotAvailableSiret),
      andGivenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({
        [apiSirenNotAvailableSiret]: {
          siret: apiSirenNotAvailableSiret,
          businessAddress: "",
          businessName: "",
          isOpen: true,
        },
      }),
      whenTheEventIsSent(
        new ModifyEstablishmentEvent(apiSirenNotAvailableSiret),
      ),
      thenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andThenTheEstablishmentUiGatewayHasCallToAction(
        "ERROR_SIRENE_API_UNAVAILABLE",
      ),
    ]);
  });
  describe(`Scénario 11 - Existing SIRET & API Sirene unexpected error`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayHasRegisteredSiret(apiSirenUnexpectedError),
      andGivenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({
        [apiSirenUnexpectedError]: {
          siret: apiSirenUnexpectedError,
          businessAddress: "",
          businessName: "",
          isOpen: true,
        },
      }),
      whenTheEventIsSent(new ModifyEstablishmentEvent(apiSirenUnexpectedError)),
      thenTheEstablishmentGatewayDontHasModifyEstablishmentRequestForSiret(),
      andThenTheEstablishmentUiGatewayHasCallToAction("ERROR_UNEXPECTED_ERROR"),
    ]);
  });
});
