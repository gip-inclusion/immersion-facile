import { expectToEqual } from "../test.helpers";
import { MAX_FILE_SIZE_MB, validateFile } from "./file.validators";

describe("validateFile", () => {
  describe("wrong paths", () => {
    it("should return an error if extension is not allowed", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      expectToEqual(validateFile(file), {
        code: "INVALID_EXTENSION",
        message:
          "Invalid file extension. Allowed extensions: .pdf, .jpeg, .jpg, .png, .webp, .svg",
      });
    });

    it("should return an error if mime type is not allowed", () => {
      const file = new File(["test"], "test.pdf", {
        type: "application/octet-stream",
      });
      expectToEqual(validateFile(file), {
        code: "INVALID_MIME_TYPE",
        message:
          "Invalid mime type. Allowed types: application/pdf, image/jpeg, image/png, image/jpg, image/webp, image/svg+xml",
      });
    });

    it("should return an error if file is too large", () => {
      // Create a file larger than 5MB
      const largeFileContent = new Uint8Array(
        (MAX_FILE_SIZE_MB + 1) * 1024 * 1024,
      ); // 6MB
      const file = new File([largeFileContent], "test.pdf", {
        type: "application/pdf",
      });
      expectToEqual(validateFile(file), {
        code: "FILE_TOO_LARGE",
        message: "File is too large. Maximum size is 5MB.",
      });
    });

    it("should return an error if file extension and mime type are not matching", () => {
      const file = new File(["test"], "test.svg", { type: "image/jpeg" });
      expectToEqual(validateFile(file), {
        code: "INVALID_SIGNATURE",
        message: "File content doesn't match its extension.",
      });
    });

    it("should return an error if file is not a valid pdf (first bytes)", () => {
      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      const fileBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]); // Invalid PDF signature

      expectToEqual(validateFile(file, fileBytes), {
        code: "INVALID_SIGNATURE",
        message: "File content doesn't match its extension.",
      });
    });
  });
  describe("right paths", () => {
    it("should return true if file is valid", () => {
      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      expectToEqual(validateFile(file), true);
    });
  });
});
