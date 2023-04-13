import { SiretDto } from "shared";

import { NavigationGateway } from "src/core-logic/ports/NavigationGateway";

export class InMemoryNavigationGateway implements NavigationGateway {
  public navigateToEstablishmentForm(siret: SiretDto): void {
    this.navigatedToEstablishmentForm = siret;
  }

  // test purpose
  public navigatedToEstablishmentForm: null | SiretDto = null;
}
