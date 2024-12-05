import { AbsoluteUrl } from "shared";
import { FormEstablishmentParamsInUrl } from "src/app/routes/routeParams/formEstablishment";

export interface NavigationGateway {
  navigateToEstablishmentForm(
    formEstablishmentParamsInUrl: FormEstablishmentParamsInUrl | null,
  ): void;
  goToUrl(url: AbsoluteUrl): void;
}
