/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    connectToAdmin(): void;
    submitBasicConventionForm(): void;
    disableUrlLogging(): void;
    doIfElementExists(
      selector: string,
      callback: () => void,
    ): Chainable<JQuery<HTMLElement>>;
    fillSelect({
      element,
      predicateValue,
    }: {
      element: string;
      predicateValue?: string;
    }): Chainable<JQuery<HTMLElement>>;
    openEmailInAdmin({
      emailType,
      elementIndex,
    }: {
      emailType: string;
      elementIndex: number;
    }): Chainable<JQuery<HTMLElement>>;
    getMagicLinkInEmailWrapper(
      $element: JQuery<HTMLElement>,
    ): Chainable<JQuery<HTMLElement>>;
  }
}
