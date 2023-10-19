import { useAppSelector } from "src/app/hooks/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";

// this hook should be use only in admin route
export const useAdminToken = () => useAppSelector(adminSelectors.auth.token);
