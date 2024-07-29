import { DateRange } from "shared";
import { TimeGateway } from "../domains/core/time-gateway/ports/TimeGateway";
import { OpacifiedLogger } from "../utils/logger";

export const getDateRangeFromScriptParams = ({
  timeGateway,
  logger,
  scriptParams,
}: {
  timeGateway: TimeGateway;
  logger: OpacifiedLogger;
  scriptParams: string[];
}): DateRange | null => {
  const args = scriptParams.slice(2);
  const from = args[0] ? new Date(args[0]) : null;
  const to = args[1] ? new Date(args[1]) : null;
  let errorMessage = null;

  if (
    (from && Number.isNaN(from.getTime())) ||
    (to && Number.isNaN(to.getTime())) ||
    (from && to && from >= to)
  ) {
    errorMessage =
      "Les dates fournies en entrées du script ne sont pas corrrectes.";
  }

  if (to && to > timeGateway.now()) {
    errorMessage = "La date de fin doit être au plus tard à aujourd'hui.";
  }

  if (errorMessage) {
    logger.error({ message: errorMessage });
    throw new Error(errorMessage);
  }

  return (
    from &&
    to && {
      from,
      to,
    }
  );
};
