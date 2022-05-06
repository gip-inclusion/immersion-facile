import {
  badSiretOneWithLetter,
  badSiretTooLong,
  badSiretTooShort,
  emptySiret,
  existingClosedSireneResponse,
  existingOpenSireneResponse,
  validSiret,
} from "src/domain/tests/expectedValues";
import {
  andGivenTheEstablishmentUiGatewayHasCallToAction,
  andThenTheEstablishmentUiGatewayNavigateToEstablishementFormWithSiret,
  givenTheEstablishmentUiGatewayHasCallToAction,
  thenTheEstablishmentUiGatewayHasCallToAction,
} from "src/domain/tests/unitTests/EstablishmentUiGateway";
import { whenTheEventIsSent } from "src/domain/tests/unitTests/EventGateway";
import { andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets } from "src/domain/tests/unitTests/ImmersionApplicationGateway";
import { executeTestSuite } from "../../tests/clientScenario";
import {
  givenTheEstablishmentGatewayDontHasRegisteredSiret,
  givenTheEstablishmentGatewayHasRegisteredSiret,
} from "../../tests/unitTests/EstablishmentGateway";
import { VerifySiretEvent } from "./VerifySiretEvent";

describe(`Feature - "SIRET_VERIFICATION_REQUESTED"`, () => {
  describe(`Scénario 1 - Existing SIRET - Modify Establishment`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayHasRegisteredSiret(validSiret),
      andGivenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
      andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({
        [existingOpenSireneResponse.siret]: existingOpenSireneResponse,
      }),
      whenTheEventIsSent(new VerifySiretEvent(validSiret)),
      thenTheEstablishmentUiGatewayHasCallToAction("MODIFY_ESTABLISHEMENT"),
    ]);
  });
  describe(`Scénario 2 - Unexisting SIRET - Register Establishment`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayDontHasRegisteredSiret(),
      andGivenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
      andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({
        [existingOpenSireneResponse.siret]: existingOpenSireneResponse,
      }),
      whenTheEventIsSent(new VerifySiretEvent(validSiret)),
      thenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
      andThenTheEstablishmentUiGatewayNavigateToEstablishementFormWithSiret(
        validSiret,
      ),
    ]);
  });
  describe(`Scénario 3 - Bad SIRET - too short`, () => {
    executeTestSuite([
      givenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
      whenTheEventIsSent(new VerifySiretEvent(badSiretTooShort)),
      thenTheEstablishmentUiGatewayHasCallToAction("ERROR_BAD_SIRET"),
    ]);
  });
  describe(`Scénario 4 - Bad SIRET - 13 numbers and 1 letter`, () => {
    executeTestSuite([
      givenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
      whenTheEventIsSent(new VerifySiretEvent(badSiretOneWithLetter)),
      thenTheEstablishmentUiGatewayHasCallToAction("ERROR_BAD_SIRET"),
    ]);
  });
  describe(`Scénario 5 - Bad SIRET - too long`, () => {
    executeTestSuite([
      givenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
      whenTheEventIsSent(new VerifySiretEvent(badSiretTooLong)),
      thenTheEstablishmentUiGatewayHasCallToAction("ERROR_BAD_SIRET"),
    ]);
  });
  describe(`Scénario 6 - NOTHING - Empty SIRET`, () => {
    executeTestSuite([
      givenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
      whenTheEventIsSent(new VerifySiretEvent(emptySiret)),
      thenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
    ]);
  });
  describe(`Scénario 7 - Existing SIRET - Closed Sirene Establishment`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayHasRegisteredSiret(validSiret),
      andGivenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
      andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({
        [existingClosedSireneResponse.siret]: existingClosedSireneResponse,
      }),
      whenTheEventIsSent(new VerifySiretEvent(validSiret)),
      thenTheEstablishmentUiGatewayHasCallToAction(
        "ERROR_CLOSED_ESTABLISHMENT_ON_SIRENE",
      ),
    ]);
  });
  describe(`Scénario 8 - Existing SIRET - Missing Sirene Establishment`, () => {
    executeTestSuite([
      givenTheEstablishmentGatewayHasRegisteredSiret(validSiret),
      andGivenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
      andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({}),
      whenTheEventIsSent(new VerifySiretEvent(validSiret)),
      thenTheEstablishmentUiGatewayHasCallToAction(
        "ERROR_MISSING_ESTABLISHMENT_ON_SIRENE",
      ),
    ]);
  });
});
