import { SiretDto } from "shared";
import {
  TooManyRequestApiError,
  UnavailableApiError,
} from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { SireneEstablishmentProps } from "../valueObjects/SireneEstablishmentVO";

const logger = createLogger(__filename);

export type SireneGatewayAnswer = {
  header: {
    statut: number;
    message: string;
    total: number;
    debut: number;
    nombre: number;
  };
  etablissements: SireneEstablishmentProps[];
};

export type GetSiretCall = (
  siret: SiretDto,
  includeClosedEstablishments?: boolean,
) => Promise<SireneGatewayAnswer | undefined>;

export abstract class SireneGateway {
  public get(
    siret: SiretDto,
    includeClosedEstablishments?: boolean,
  ): Promise<SireneGatewayAnswer | undefined> {
    return this._get(siret, includeClosedEstablishments).catch((error) => {
      const serviceName = "Sirene API";
      logger.error({ siret, error }, "Error fetching siret");
      if (error?.initialError?.status === 429)
        throw new TooManyRequestApiError(serviceName);
      throw new UnavailableApiError(serviceName);
    });
  }

  protected abstract _get: GetSiretCall;
}
