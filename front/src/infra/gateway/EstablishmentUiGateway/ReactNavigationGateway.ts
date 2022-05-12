import { NavigationGateway } from "src/core-logic/ports/NavigationGateway";
import { SiretDto } from "shared/src/siret";
import { routes } from "src/app/routing/routes";

export class ReactNavigationGateway implements NavigationGateway {
  navigateToEstablishementForm(siret: SiretDto): Promise<void> {
    routes.formEstablishment({ siret }).push();
    return Promise.resolve();
  }
}
