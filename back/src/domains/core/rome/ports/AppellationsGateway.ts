import { AppellationDto } from "shared";

export interface AppellationsGateway {
  searchAppellations(query: string): Promise<AppellationDto[]>;
}
