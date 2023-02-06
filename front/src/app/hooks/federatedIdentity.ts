import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";

export const useConventionFederatedIdentityString = () =>
  useAppSelector(authSelectors.conventionFederatedIdentityString);
