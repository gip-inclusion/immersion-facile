export const fillSelectRandomly = ({ element }: { element: string }) => {
  const randomNumber = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  const selector = element;
  const selectorOptions = `${selector} > option`;
  cy.get(selectorOptions).then(($options) => {
    cy.get(selectorOptions)
      .eq(randomNumber(1, $options.length - 1))
      .then(($select) => {
        const label = $select.text();
        cy.get(selector).select(label);
      });
  });
};
