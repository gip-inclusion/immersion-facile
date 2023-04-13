import { SiretDto } from "shared";

import { routes } from "src/app/routes/routes";
import { NavigationGateway } from "src/core-logic/ports/NavigationGateway";

export class ReactNavigationGateway implements NavigationGateway {
  navigateToEstablishmentForm(siret: SiretDto): void {
    routes.formEstablishment({ siret }).push();
  }
}
