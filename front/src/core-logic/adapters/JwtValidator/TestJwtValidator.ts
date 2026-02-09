import type {
  JwtValidator,
  SupportedDecodedJwt,
} from "src/core-logic/ports/JwtDecoder";

export class TestJwtValidator implements JwtValidator {
  public nextDecodeJwtResult: SupportedDecodedJwt | Error = new Error(
    "JWT Decode failed",
  );

  decodeJwt(_jwt: string): SupportedDecodedJwt {
    if (this.nextDecodeJwtResult instanceof Error)
      throw this.nextDecodeJwtResult;
    return this.nextDecodeJwtResult;
  }
}
