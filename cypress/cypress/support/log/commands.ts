Cypress.Commands.add("disableUrlLogging", () => {
  cy.on("log:added", () => {
    const logs = window.top.document.querySelectorAll(".command-name-new-url");
    logs.forEach((log) => log.classList.add("hidden"));
  });
});
