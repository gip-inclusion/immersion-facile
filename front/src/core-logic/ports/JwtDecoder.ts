import type {
  ConnectedUserJwtPayload,
  ConventionJwtPayload,
  EmailAuthCodeJwtPayload,
} from "../../../../shared/src/tokens/payload.dto";

type SupportedDecodedJwt =
  | ConventionJwtPayload
  | ConnectedUserJwtPayload
  | EmailAuthCodeJwtPayload;

export interface JwtDecoder {
  decodeJwt(jwt: string): SupportedDecodedJwt;
}
