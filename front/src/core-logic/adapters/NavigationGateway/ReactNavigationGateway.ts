import type { AbsoluteUrl } from "shared";
import type { NavigationGateway } from "src/core-logic/ports/NavigationGateway";

export class ReactNavigationGateway implements NavigationGateway {
  public goToUrl(url: AbsoluteUrl): void {
    window.location.href = url;
  }
}
