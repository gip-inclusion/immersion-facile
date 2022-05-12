import { SiretDto } from "shared/src/siret";

export interface NavigationGateway {
  navigateToEstablishementForm(siret: SiretDto): Promise<void>;
}
