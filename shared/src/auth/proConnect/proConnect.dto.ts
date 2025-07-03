import type { SiretDto } from "../../siret/siret";
import type { ExternalId } from "../auth.dto";

export type ProConnectInfos = {
  externalId: ExternalId;
  siret: SiretDto;
};
