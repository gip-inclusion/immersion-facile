export const MAX_FILE_SIZE_MB = 5;

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
] as const;

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
  ".svg",
] as const;

type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 5MB

const FILE_SIGNATURES: Record<
  string,
  { mimeType: AllowedMimeType; bytes: number[]; extensions: AllowedExtension[] }
> = {
  pdf: {
    mimeType: "application/pdf",
    bytes: [0x25, 0x50, 0x44, 0x46], // %PDF
    extensions: [".pdf"],
  },
  png: {
    mimeType: "image/png",
    bytes: [0x89, 0x50, 0x4e, 0x47], // PNG
    extensions: [".png"],
  },
  jpeg: {
    mimeType: "image/jpeg",
    bytes: [0xff, 0xd8, 0xff], // JPEG
    extensions: [".jpg", ".jpeg"],
  },
  webp: {
    mimeType: "image/webp",
    bytes: [0x52, 0x49, 0x46, 0x46], // RIFF
    extensions: [".webp"],
  },
  svg: {
    mimeType: "image/svg+xml",
    bytes: [0x3c, 0x3f, 0x78, 0x6d, 0x6c], // <?xml
    extensions: [".svg"],
  },
} as const;

export type FileValidationError = {
  code:
    | "INVALID_MIME_TYPE"
    | "INVALID_EXTENSION"
    | "INVALID_SIGNATURE"
    | "FILE_TOO_LARGE";
  message: string;
};

export const validateFile = (
  file: File | { name: string; type: string; size: number },
  fileBytes?: Uint8Array,
): FileValidationError | true => {
  // Check extension
  const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
  if (!ALLOWED_EXTENSIONS.includes(extension as AllowedExtension)) {
    return {
      code: "INVALID_EXTENSION",
      message: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(
        ", ",
      )}`,
    };
  }

  // Check mime type
  if (
    !ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return {
      code: "INVALID_MIME_TYPE",
      message: `Invalid mime type. Allowed types: ${ALLOWED_MIME_TYPES.join(
        ", ",
      )}`,
    };
  }

  const matchingFileSignature = Object.values(FILE_SIGNATURES).find(
    ({ mimeType, extensions }) =>
      mimeType === file.type &&
      extensions.includes(extension as AllowedExtension),
  );

  if (!matchingFileSignature) {
    return {
      code: "INVALID_SIGNATURE",
      message: "File content doesn't match its extension.",
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      code: "FILE_TOO_LARGE",
      message: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
    };
  }

  // Check file signature if bytes are provided
  if (fileBytes) {
    const matchingSignature = Object.values(FILE_SIGNATURES).find(
      ({ bytes, extensions }) =>
        extensions.includes(extension as AllowedExtension) &&
        bytes.every((byte, index) => fileBytes[index] === byte),
    );

    if (!matchingSignature) {
      return {
        code: "INVALID_SIGNATURE",
        message: "File content doesn't match its extension.",
      };
    }
  }

  return true;
};
