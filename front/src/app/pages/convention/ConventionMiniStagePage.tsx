import { useEffect, useMemo, useRef } from "react";
import { MainWrapper, PageHeader } from "react-design-system";
import { useDispatch } from "react-redux";
import { keys } from "shared";
import {
  type ConventionFormMode,
  ConventionFormWrapper,
} from "src/app/components/forms/convention/ConventionFormWrapper";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import type { Route } from "type-route";

export type ConventionMiniStagePageRoute = Route<
  typeof routes.conventionMiniStage
>;

type ConventionMiniStagePageProps = {
  route: ConventionMiniStagePageRoute;
};

export const ConventionMiniStagePage = ({
  route,
}: ConventionMiniStagePageProps) => {
  const dispatch = useDispatch();
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const t = useConventionTexts("mini-stage-cci");
  const initialRouteParams = useRef(route.params).current;
  const { jwt: _, ...routeParamsWithoutJwt } = initialRouteParams;
  const isSharedConvention = useMemo(
    () => keys(routeParamsWithoutJwt).length > 0,
    [routeParamsWithoutJwt],
  );
  const isFTConnected = federatedIdentity?.provider === "peConnect";

  const getMode = (): ConventionFormMode => {
    if ("jwt" in initialRouteParams) return "edit";
    if (isSharedConvention) return "create-from-shared";
    return "create-from-scratch";
  };
  const mode = getMode();

  useEffect(() => {
    if (isFTConnected) {
      dispatch(
        authSlice.actions.fetchLogoutUrlRequested({
          mode: "device-and-oauth",
          feedbackTopic: "auth-global",
        }),
      );
    }
  }, [dispatch, isFTConnected]);

  return (
    <MainWrapper
      layout={"default"}
      vSpacing={3}
      pageHeader={<PageHeader title={t.intro.conventionTitle} />}
    >
      <ConventionFormWrapper internshipKind="mini-stage-cci" mode={mode} />
    </MainWrapper>
  );
};
