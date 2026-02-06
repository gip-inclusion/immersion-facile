import { decodeMagicLinkJwtWithoutSignatureCheck } from "shared";
import type { JwtDecoder } from "src/core-logic/ports/JwtDecoder";
import type {
  ConnectedUserJwtPayload,
  ConventionJwtPayload,
  EmailAuthCodeJwtPayload,
} from "../../../../../shared/src/tokens/payload.dto";

export class DecodeJwtDecoder implements JwtDecoder {
  decodeJwt(
    jwt: string,
  ): ConventionJwtPayload | ConnectedUserJwtPayload | EmailAuthCodeJwtPayload {
    return decodeMagicLinkJwtWithoutSignatureCheck<
      ConventionJwtPayload | ConnectedUserJwtPayload | EmailAuthCodeJwtPayload
    >(jwt);
  }
}
