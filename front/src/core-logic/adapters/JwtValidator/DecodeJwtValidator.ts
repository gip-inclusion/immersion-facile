import { decodeMagicLinkJwtWithoutSignatureCheck } from "shared";
import type {
  JwtValidator,
  SupportedDecodedJwt,
} from "src/core-logic/ports/JwtDecoder";

export class DecodeJwtValidator implements JwtValidator {
  decodeJwt(jwt: string): SupportedDecodedJwt {
    return decodeMagicLinkJwtWithoutSignatureCheck<SupportedDecodedJwt>(jwt);
  }
}
