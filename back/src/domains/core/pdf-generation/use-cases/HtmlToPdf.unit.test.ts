import {
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

const htmlContent = "<h1>Hello world</h1><p>test</p>";
const immersionFacileDomain = "immersion-facile.beta.gouv.fr";

describe("HtmlToPdf", () => {
  const conventionId = "convention-id";
  let htmlToPdf: HtmlToPdf;
  beforeEach(() => {
    htmlToPdf = makeHtmlToPdf({
      deps: {
        pdfGeneratorGateway: new InMemoryPdfGeneratorGateway(),
        immersionFacileDomain,
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

  it("keeps app-domain link tags and strips external ones", async () => {
    const appLink = `<link rel="stylesheet" href="https://${immersionFacileDomain}/assets/dsfr.css">`;
    const externalLink =
      '<link rel="stylesheet" href="https://evil.com/inject.css">';
    const htmlWithLinks = `<html><head>${appLink}${externalLink}</head><body><p>Hello</p></body></html>`;
    const expectedHtml = `<html><head>${appLink}</head><body><p>Hello</p></body></html>`;
    const base64Pdf = await htmlToPdf.execute(
      { htmlContent: htmlWithLinks, conventionId },
      jwtPayload,
    );
    expectToEqual(
      base64Pdf,
      `PDF_OF convention convention-id >> "${expectedHtml}"`,
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
