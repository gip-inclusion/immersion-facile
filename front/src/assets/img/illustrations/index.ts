import contact from "./contact.webp";
import documentsAdministratifs from "./documents-administratifs.webp";
import error from "./error-illustration.webp";
import infosImportantes from "./infos-importantes.webp";
import job from "./job-illustration.webp";
import login from "./login-illustration.webp";
import objective from "./objective-illustration.webp";
import search1 from "./search-illustration-0.webp";
import search2 from "./search-illustration-1.webp";
import search3 from "./search-illustration-2.webp";
import search4 from "./search-illustration-3.webp";
import success from "./success-illustration.webp";

export const commonIllustrations = {
  error,
  warning: infosImportantes,
  job,
  objective,
  success,
};
export const searchIllustrations = [search1, search2, search3, search4];
export const loginIllustration = login;
export const nextStepIllustrations = [
  contact,
  documentsAdministratifs,
  commonIllustrations.warning,
];
