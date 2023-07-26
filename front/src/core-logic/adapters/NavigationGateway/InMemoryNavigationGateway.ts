import { FormEstablishmentParamsInUrl } from "src/app/routes/routeParams/formEstablishment";
import { NavigationGateway } from "src/core-logic/ports/NavigationGateway";

export class InMemoryNavigationGateway implements NavigationGateway {
  // test purpose
  public navigatedToEstablishmentForm: FormEstablishmentParamsInUrl | null =
    null;

  public navigateToEstablishmentForm(
    formEstablishment: FormEstablishmentParamsInUrl,
  ): void {
    this.navigatedToEstablishmentForm = formEstablishment;
  }
}
