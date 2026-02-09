import type {
  ConnectedUserJwtPayload,
  ConventionJwtPayload,
  EmailAuthCodeJwtPayload,
} from "../../../../shared/src/tokens/payload.dto";

export type SupportedDecodedJwt =
  | ConventionJwtPayload
  | ConnectedUserJwtPayload
  | EmailAuthCodeJwtPayload;

export interface JwtValidator {
  decodeJwt(jwt: string): SupportedDecodedJwt;
}
