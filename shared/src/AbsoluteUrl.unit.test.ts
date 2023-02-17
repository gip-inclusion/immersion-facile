import { toAbsoluteUrl } from "./AbsoluteUrl";

describe("toAbsoluteUrl conversion", () => {
  const urlsToCheck = [
    ["beta.gouv.fr", "https://beta.gouv.fr"],
    ["mon-site.fr.st", "https://mon-site.fr.st"],
    ["super-site.com", "https://super-site.com"],
    ["www.un-autre-site.com", "https://www.un-autre-site.com"],
    ["super-site.com/avec/un/path", "https://super-site.com/avec/un/path"],
    [
      "www.un-autre-site.com/avec/un/path?et&des=params",
      "https://www.un-autre-site.com/avec/un/path?et&des=params",
    ],
    ["http://un-autre-site-en-http.com", "http://un-autre-site-en-http.com"],
    [
      "https://un-autre-site-en-https.com",
      "https://un-autre-site-en-https.com",
    ],
  ];
  it.each(urlsToCheck)("url %s should equal to %s", (url, expectedUrl) => {
    expect(toAbsoluteUrl(url)).toBe(expectedUrl);
  });
});
