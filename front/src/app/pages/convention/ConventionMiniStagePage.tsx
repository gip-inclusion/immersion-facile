import { useMemo, useRef } from "react";
import { MainWrapper, PageHeader } from "react-design-system";
import { type frontRoutes, keys } from "shared";
import {
  type ConventionFormMode,
  ConventionFormWrapper,
} from "src/app/components/forms/convention/ConventionFormWrapper";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import type { Route } from "type-route";

export type ConventionMiniStagePageRoute = Route<
  typeof frontRoutes.conventionMiniStage
>;

type ConventionMiniStagePageProps = {
  route: ConventionMiniStagePageRoute;
};

export const ConventionMiniStagePage = ({
  route,
}: ConventionMiniStagePageProps) => {
  const t = useConventionTexts("mini-stage-cci");
  const initialRouteParams = useRef(route.params).current;
  const { jwt: _, ...routeParamsWithoutJwt } = initialRouteParams;
  const isSharedConvention = useMemo(
    () => keys(routeParamsWithoutJwt).length > 0,
    [routeParamsWithoutJwt],
  );

  const getMode = (): ConventionFormMode => {
    if ("jwt" in initialRouteParams) return "edit-convention";
    if (isSharedConvention) return "create-convention-from-shared";
    return "create-convention-from-scratch";
  };
  const mode = getMode();

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
