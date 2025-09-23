import type { AbsoluteUrl } from "shared";
import type { NavigationGateway } from "src/core-logic/ports/NavigationGateway";

export class InMemoryNavigationGateway implements NavigationGateway {
  // test purpose

  #wentToUrls: AbsoluteUrl[] = [];

  public goToUrl(url: AbsoluteUrl) {
    this.#wentToUrls.push(url);
  }

  public get wentToUrls(): AbsoluteUrl[] {
    return this.#wentToUrls;
  }
}
