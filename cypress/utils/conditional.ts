export const cypressDoIfElementExists = (
  selector: string,
  callback: () => void,
) => {
  cy.get("body").then(($body) => {
    if ($body.find(selector).length) {
      callback();
    }
  });
};
