import { AppellationAndRomeDto } from "shared";

export interface AppellationsGateway {
  findAppellations(query: string): Promise<AppellationAndRomeDto[]>;
}
