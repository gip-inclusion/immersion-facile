Cypress.Commands.add(
  "doIfElementExists",
  (selector: string, callback: () => void) => {
    return cy.get("body").then(($body) => {
      if ($body.find(selector).length) {
        callback();
      }
    });
  },
);

Cypress.Commands.add("fillSelect", ({ element, predicateValue }) => {
  const randomNumber = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  const selector = element;
  const selectorOptions = `${selector} > option`;
  return cy.get(selectorOptions).then(($options) => {
    const selectedIndex = predicateValue
      ? $options
          .toArray()
          .findIndex(
            (option: HTMLOptionElement) => option.value === predicateValue,
          )
      : randomNumber(1, $options.length - 1);
    return cy
      .get(selectorOptions)
      .eq(selectedIndex)
      .then(($select) => {
        const label = $select.text();
        cy.get(selector).select(label);
        return cy.get(selector);
      });
  });
});
