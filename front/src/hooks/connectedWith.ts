import { useAppSelector } from "src/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";

export const useConnectedWith = () =>
  useAppSelector(authSelectors.connectedWith);
