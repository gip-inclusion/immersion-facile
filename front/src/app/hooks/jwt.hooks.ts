import {
  ConventionJwtPayload,
  ConventionSupportedJwt,
  decodeMagicLinkJwtWithoutSignatureCheck,
} from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { Route } from "type-route";

// this hook should be use only in admin route
export const useAdminToken = () => {
  const rawToken = useAppSelector(authSelectors.inclusionConnectToken);
  return rawToken;
};

export const useJwt = (route: Route<typeof routes.conventionDocument>) => {
  const jwtQueryParam: ConventionSupportedJwt | undefined = route.params?.jwt;
  const inclusionConnectJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const jwt = jwtQueryParam ?? inclusionConnectJwt ?? "";
  const jwtPayload =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(jwt ?? "");

  return {
    jwt,
    jwtPayload,
  };
};
