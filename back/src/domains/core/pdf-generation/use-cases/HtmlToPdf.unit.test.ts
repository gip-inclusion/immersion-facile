import {
  type AbsoluteUrl,
  type ConventionJwtPayload,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { InMemoryPdfGeneratorGateway } from "../adapters/InMemoryPdfGeneratorGateway";
import { type HtmlToPdf, makeHtmlToPdf } from "./HtmlToPdf";

const jwtPayload: ConventionJwtPayload = {
  applicationId: "conventionId",
  role: "establishment-tutor",
  emailHash: "",
  version: 1,
};

const immersionFacileBaseUrl: AbsoluteUrl =
  "https://immersion-facile.beta.gouv.fr";
const htmlContent = "<h1>Hello world</h1><p>test</p>";

describe("HtmlToPdf", () => {
  const conventionId = "convention-id";
  let htmlToPdf: HtmlToPdf;
  beforeEach(() => {
    htmlToPdf = makeHtmlToPdf({
      deps: {
        pdfGeneratorGateway: new InMemoryPdfGeneratorGateway(),
        immersionFacileBaseUrl,
      },
    });
  });

  it("renders a pdf from a html content", async () => {
    const base64Pdf = await htmlToPdf.execute(
      { htmlContent, conventionId },
      jwtPayload,
    );
    expectToEqual(
      base64Pdf,
      `PDF_OF convention convention-id >> "${htmlContent}"`,
    );
  });

  it("strips browser-injected resources (scripts, external CSS, chrome annotations) before generating pdf", async () => {
    const htmlWithInjectedContent = [
      "<html><head>",
      '<link rel="stylesheet" href="/assets/app.css">',
      `<link rel="stylesheet" href="${immersionFacileBaseUrl}/assets/dsfr.css">`,
      '<link rel="stylesheet" href="https://gc.kis.v2.scr.kaspersky-labs.com/main.css">',
      '<link rel="dns-prefetch" href="https://client.crisp.chat">',
      '<link rel="preconnect" href="https://client.crisp.chat">',
      '<link rel="stylesheet" href="https://external.com/inject.css">',
      "</head><body>",
      "<p>Hello <chrome_annotation>world</chrome_annotation></p>",
      '<script>console.log("injected")</script>',
      '<script type="text/javascript" src="https://ext.com/inject.js"></script>',
      "</body></html>",
    ].join("");

    const expectedSanitizedContent = [
      "<html><head>",
      '<link rel="stylesheet" href="/assets/app.css">',
      `<link rel="stylesheet" href="${immersionFacileBaseUrl}/assets/dsfr.css">`,
      "</head><body>",
      "<p>Hello world</p>",
      "</body></html>",
    ].join("");

    const base64Pdf = await htmlToPdf.execute(
      { htmlContent: htmlWithInjectedContent, conventionId },
      jwtPayload,
    );
    expectToEqual(
      base64Pdf,
      `PDF_OF convention ${conventionId} >> "${expectedSanitizedContent}"`,
    );
  });

  it("strips nested/overlapping script injections", async () => {
    const nestedScriptHtml =
      '<p>ok</p><scr<script>alert("x")</script>ipt>alert("y")</script><p>end</p>';

    const base64Pdf = await htmlToPdf.execute(
      { htmlContent: nestedScriptHtml, conventionId },
      jwtPayload,
    );
    expectToEqual(
      base64Pdf,
      `PDF_OF convention ${conventionId} >> "<p>ok</p><p>end</p>"`,
    );
  });

  it("returns an error if the html content is empty", async () => {
    await expectPromiseToFailWithError(
      htmlToPdf.execute({ htmlContent: "", conventionId }, jwtPayload),
      errors.inputs.badSchema({
        useCaseName: "HtmlToPdf",
        flattenErrors: ["htmlContent : Ce champ est obligatoire"],
      }),
    );
  });
});
