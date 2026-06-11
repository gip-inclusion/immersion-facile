import {
  type ConventionJwtPayload,
  type ConventionSupportedJwt,
  decodeMagicLinkJwtWithoutSignatureCheck,
  type frontRoutes,
} from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import type { Route } from "type-route";

export const useJwt = (
  route: Route<
    | typeof frontRoutes.conventionDocument
    | typeof frontRoutes.assessmentDocument
  >,
) => {
  const jwtQueryParam: ConventionSupportedJwt | undefined = route.params?.jwt;
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const jwt: ConventionSupportedJwt = jwtQueryParam ?? connectedUserJwt ?? "";
  const jwtPayload =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(jwt ?? "");

  return {
    jwt,
    jwtPayload,
  };
};
