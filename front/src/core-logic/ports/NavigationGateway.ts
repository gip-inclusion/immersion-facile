import { SiretDto } from "shared/src/siret";

export interface NavigationGateway {
  navigateToEstablishmentForm(siret: SiretDto): void;
}
