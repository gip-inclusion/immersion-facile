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
import { clientScenario } from "../../tests/clientScenario";
import {
  givenTheEstablishmentGatewayDontHasRegisteredSiret,
  givenTheEstablishmentGatewayHasRegisteredSiret,
} from "../../tests/unitTests/EstablishmentGateway";
import { VerifySiretEvent } from "./VerifySiretEvent";
import { andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets } from "src/domain/tests/unitTests/ImmersionApplicationGateway";
import { feature } from "src/domain/tests/feature";

feature("SIRET_VERIFICATION_REQUESTED", [
  clientScenario(`Scénario 1 - Existing SIRET - Modify Establishment`, [
    givenTheEstablishmentGatewayHasRegisteredSiret(validSiret),
    andGivenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
    andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({
      [existingOpenSireneResponse.siret]: existingOpenSireneResponse,
    }),
    whenTheEventIsSent(new VerifySiretEvent(validSiret)),
    thenTheEstablishmentUiGatewayHasCallToAction("MODIFY_ESTABLISHEMENT"),
  ]),
  clientScenario(`Scénario 2 - Unexisting SIRET - Register Establishment`, [
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
  ]),
  clientScenario(`Scénario 3 - Bad SIRET - too short`, [
    givenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
    whenTheEventIsSent(new VerifySiretEvent(badSiretTooShort)),
    thenTheEstablishmentUiGatewayHasCallToAction("ERROR_BAD_SIRET"),
  ]),
  clientScenario(`Scénario 4 - Bad SIRET - 13 numbers and 1 letter`, [
    givenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
    whenTheEventIsSent(new VerifySiretEvent(badSiretOneWithLetter)),
    thenTheEstablishmentUiGatewayHasCallToAction("ERROR_BAD_SIRET"),
  ]),
  clientScenario(`Scénario 5 - Bad SIRET - too long`, [
    givenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
    whenTheEventIsSent(new VerifySiretEvent(badSiretTooLong)),
    thenTheEstablishmentUiGatewayHasCallToAction("ERROR_BAD_SIRET"),
  ]),
  clientScenario(`Scénario 6 - NOTHING - Empty SIRET`, [
    givenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
    whenTheEventIsSent(new VerifySiretEvent(emptySiret)),
    thenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
  ]),
  clientScenario(`Scénario 7 - Existing SIRET - Closed Sirene Establishment`, [
    givenTheEstablishmentGatewayHasRegisteredSiret(validSiret),
    andGivenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
    andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({
      [existingClosedSireneResponse.siret]: existingClosedSireneResponse,
    }),
    whenTheEventIsSent(new VerifySiretEvent(validSiret)),
    thenTheEstablishmentUiGatewayHasCallToAction(
      "ERROR_CLOSED_ESTABLISHMENT_ON_SIRENE",
    ),
  ]),
  clientScenario(`Scénario 8 - Existing SIRET - Missing Sirene Establishment`, [
    givenTheEstablishmentGatewayHasRegisteredSiret(validSiret),
    andGivenTheEstablishmentUiGatewayHasCallToAction("NOTHING"),
    andGivenTheSiretGatewayThroughBackHasSireneRegisteredSirets({}),
    whenTheEventIsSent(new VerifySiretEvent(validSiret)),
    thenTheEstablishmentUiGatewayHasCallToAction(
      "ERROR_MISSING_ESTABLISHMENT_ON_SIRENE",
    ),
  ]),
]);
