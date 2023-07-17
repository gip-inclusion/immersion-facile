import { FormEstablishmentParamsInUrl } from "src/app/routes/routeParams/formEstablishment";
import { NavigationGateway } from "src/core-logic/ports/NavigationGateway";

export class InMemoryNavigationGateway implements NavigationGateway {
  public navigateToEstablishmentForm(
    formEstablishment: FormEstablishmentParamsInUrl,
  ): void {
    this.navigatedToEstablishmentForm = formEstablishment;
  }

  // test purpose
  public navigatedToEstablishmentForm: null | FormEstablishmentParamsInUrl =
    null;
}
