import { SiretDto } from "shared";

export interface NavigationGateway {
  navigateToEstablishmentForm(siret: SiretDto): void;
}
