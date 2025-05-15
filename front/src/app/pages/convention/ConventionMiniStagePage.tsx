import { useMemo, useRef } from "react";
import { MainWrapper } from "react-design-system";
import { keys } from "shared";
import {
  type ConventionFormMode,
  ConventionFormWrapper,
} from "src/app/components/forms/convention/ConventionFormWrapper";
import type { routes } from "src/app/routes/routes";
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
  const initialRouteParams = useRef(route.params).current;
  const { jwt: _, ...routeParamsWithoutJwt } = initialRouteParams;
  const isSharedConvention = useMemo(
    () => keys(routeParamsWithoutJwt).length > 0,
    [routeParamsWithoutJwt],
  );

  const getMode = (): ConventionFormMode => {
    if ("jwt" in initialRouteParams) return "edit";
    if (isSharedConvention) return "create-from-shared";
    return "create-from-scratch";
  };
  const mode = getMode();

  return (
    <MainWrapper layout={"default"} vSpacing={3}>
      <ConventionFormWrapper internshipKind="mini-stage-cci" mode={mode} />
    </MainWrapper>
  );
};
