import Bottleneck from "bottleneck";
import { AppellationAndRomeDto } from "shared";
import { AppellationsGateway } from "../../../domains/core/rome/ports/AppellationsGateway";
import { createLogger } from "../../../utils/logger";

const _logger = createLogger(__filename);

const diagorienteMaxCallRatePerSeconds = 10;

export class DiagorienteAppellationsGateway implements AppellationsGateway {
  findAppellations(_query: string): Promise<AppellationAndRomeDto[]> {
    throw new Error("Method not implemented.");
  }
  #limiter = new Bottleneck({
    reservoir: diagorienteMaxCallRatePerSeconds,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: diagorienteMaxCallRatePerSeconds,
  });
}
