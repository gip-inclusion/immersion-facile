import {
  ConventionJwtPayload,
  ConventionSupportedJwt,
  decodeMagicLinkJwtWithoutSignatureCheck,
} from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { Route } from "type-route";

// this hook should be use only in admin route
export const useAdminToken = () => {
  const rawToken = useAppSelector(adminSelectors.auth.token);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return rawToken;
};

export const useJwt = (route: Route<typeof routes.conventionDocument>) => {
  const jwtQueryParam: ConventionSupportedJwt | undefined = route.params?.jwt;
  const adminJwt = useAdminToken();
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const jwt = jwtQueryParam ?? adminJwt ?? inclusionConnectedJwt ?? "";
  const jwtPayload =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(jwt ?? "");

  return {
    jwt,
    jwtPayload,
  };
};
