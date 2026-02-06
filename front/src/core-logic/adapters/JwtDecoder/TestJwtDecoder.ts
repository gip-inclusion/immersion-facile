import type {
  ConnectedUserJwtPayload,
  ConventionJwtPayload,
  EmailAuthCodeJwtPayload,
} from "shared";
import type { JwtDecoder } from "src/core-logic/ports/JwtDecoder";

export class TestJwtDecoder implements JwtDecoder {
  public nextDecodeJwtResult:
    | ConventionJwtPayload
    | ConnectedUserJwtPayload
    | EmailAuthCodeJwtPayload
    | Error = new Error("JWT Decode failed");

  decodeJwt(
    _jwt: string,
  ): ConventionJwtPayload | ConnectedUserJwtPayload | EmailAuthCodeJwtPayload {
    if (this.nextDecodeJwtResult instanceof Error)
      throw this.nextDecodeJwtResult;
    return this.nextDecodeJwtResult;
  }
}
