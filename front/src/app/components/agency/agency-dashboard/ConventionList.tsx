import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserConventionsToManageSlice } from "src/core-logic/domain/connected-user/conventionsToManage/connectedUserConventionsToManage.slice";

export const ConventionList = () => {
  const dispatch = useDispatch();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);

  useEffect(() => {
    if (connectedUserJwt) {
      dispatch(
        connectedUserConventionsToManageSlice.actions.getConventionsForConnectedUserRequested(
          {
            params: {
              sortBy: "dateStart",
              sortDirection: "asc",
              page: 1,
              perPage: 10,
            },
            jwt: connectedUserJwt,
            feedbackTopic: "connected-user-conventions",
          },
        ),
      );
    }
  }, [dispatch, connectedUserJwt]);

  return "OTO";
};
