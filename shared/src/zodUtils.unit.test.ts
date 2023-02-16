import { zEmail } from "./zodUtils";

describe("zEmail validation utils", () => {
  const validEmailsSet = [
    "capitainehaddock@gmail.com",
    "capitaine.haddock@gmail.com",
    "capitaine+haddock@gmail.com",
    "capitaine+haddock@gmail59.com",
    "capitaine.haddock@beta.gouv.fr",
    "capitaine_haddock@beta.go.uv.fr",
    "capitaine.had.dock@beta.gouv.fr",
    "capitaine_haddock_99@beta.gouv.fr",
    "789@haddock.com",
  ];
  it.each(validEmailsSet)("email address %s should be valid", (email) => {
    expect(zEmail.parse(email)).toBeTruthy();
  });

  const invalidEmailsSet = [
    "capitaine.haddock@beta_gouv.fr",
    "capitaine.haddock@beta_go__uv.fr",
    "capitaine!!haddock@beta!gouv.fr",
    "capitaine!!haddock@beta!gouv.fr",
    "capitaine!!haddock@betagouvfr",
    "yolo_c-pa_un-mail",
    "cap`pitaine{haddock@gmail.com",
  ];

  it.each(invalidEmailsSet)("email address %s should not be valid", (email) => {
    expect(() => zEmail.parse(email)).toThrow();
  });
});
