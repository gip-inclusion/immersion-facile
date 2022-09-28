import { NavigationGateway } from "src/core-logic/ports/NavigationGateway";
import { SiretDto } from "shared";
import { routes } from "src/app/routing/routes";

export class ReactNavigationGateway implements NavigationGateway {
  navigateToEstablishmentForm(siret: SiretDto): void {
    routes.formEstablishment({ siret }).push();
  }
}
