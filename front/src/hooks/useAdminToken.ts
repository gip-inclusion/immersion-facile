import { useAppSelector } from "src/hooks/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";

// this hook should be use only in admin route
export const useAdminToken = () => {
  const rawToken = useAppSelector(adminSelectors.auth.token);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return rawToken!;
};
