export const cypressDoIfElementExists = (selector: string, callback) => {
  cy.get("body").then(($body) => {
    if ($body.find(selector).length) {
      callback();
    }
  });
};
