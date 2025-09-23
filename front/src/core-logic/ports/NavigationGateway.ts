import type { AbsoluteUrl } from "shared";

export interface NavigationGateway {
  goToUrl(url: AbsoluteUrl): void;
}
