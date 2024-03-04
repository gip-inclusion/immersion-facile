import { AppellationAndRomeDto } from "shared";
import { DiagorienteAccessTokenResponse } from "../adapters/DiagorienteAppellationsGateway";

export interface AppellationsGateway {
  searchAppellations(query: string): Promise<AppellationAndRomeDto[]>;
  getAccessToken(): Promise<DiagorienteAccessTokenResponse>;
}
