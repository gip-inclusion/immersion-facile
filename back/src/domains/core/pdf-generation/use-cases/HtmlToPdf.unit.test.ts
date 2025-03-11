import {
  type ConventionJwtPayload,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { InMemoryPdfGeneratorGateway } from "../adapters/InMemoryPdfGeneratorGateway";
import { HtmlToPdf } from "./HtmlToPdf";

const jwtPayload: ConventionJwtPayload = {
  applicationId: "conventionId",
  role: "establishment-tutor",
  emailHash: "",
  version: 1,
};

const htmlContent = "<h1>Hello world</h1><p>test</p>";

describe("HtmlToPdf", () => {
  const conventionId = "convention-id";
  let htmlToPdf: HtmlToPdf;
  beforeEach(() => {
    htmlToPdf = new HtmlToPdf(new InMemoryPdfGeneratorGateway());
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

  it("returns an error if the html content is empty", async () => {
    await expectPromiseToFailWithError(
      htmlToPdf.execute({ htmlContent: "", conventionId }, jwtPayload),
      errors.inputs.badSchema({
        flattenErrors: ["htmlContent : Obligatoire"],
      }),
    );
  });

  it("returns an error if no JWT is provided", async () => {
    await expectPromiseToFailWithError(
      htmlToPdf.execute({ htmlContent, conventionId }),
      errors.user.unauthorized(),
    );
  });
});
