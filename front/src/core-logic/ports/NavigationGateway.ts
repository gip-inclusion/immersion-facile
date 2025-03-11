import type { AbsoluteUrl } from "shared";
import type { FormEstablishmentParamsInUrl } from "src/app/routes/routeParams/formEstablishment";

export interface NavigationGateway {
  navigateToEstablishmentForm(
    formEstablishmentParamsInUrl: FormEstablishmentParamsInUrl | null,
  ): void;
  goToUrl(url: AbsoluteUrl): void;
}
