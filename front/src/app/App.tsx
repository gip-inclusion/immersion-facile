import React, { useLayoutEffect } from "react";
import { CrispChat } from "react-design-system/immersionFacile";
import { useDispatch } from "react-redux";
import { useFetchFeatureFlags } from "src/app/utils/useFeatureFlags";
import { appIsReadyAction } from "src/core-logic/domain/actions";
import { ENV } from "src/environmentVariables";
import { Router } from "./routing/Router";
import { SkipLinks, SkipLink } from "react-design-system";

const useAppIsReady = () => {
  const dispatch = useDispatch();
  useLayoutEffect(() => {
    dispatch(appIsReadyAction());
  }, []);
};
const skipLinks: SkipLink[] = [
  {
    label: "Contenu principal",
    anchor: "main-content",
  },
  {
    label: "Aide et contact",
    anchor: "over-footer",
  },
  {
    label: "Pied de page",
    anchor: "main-footer",
  },
];
export const App = () => {
  useFetchFeatureFlags();
  useAppIsReady();

  return (
    <>
      <SkipLinks links={skipLinks}></SkipLinks>
      <Router />
      {ENV.crispWebSiteId && <CrispChat crispWebsiteId={ENV.crispWebSiteId} />}
    </>
  );
};
