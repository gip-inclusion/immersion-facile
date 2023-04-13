import { useEffect } from "react";

import { InternshipKind } from "shared";

import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

export const useMatomo = (internshipKind: InternshipKind) => {
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  useEffect(() => {
    if (submitFeedback.kind === "justSubmitted") {
      matomoPushConventionSubmitSuccessEvent(internshipKind);
    }
  }, [submitFeedback.kind]);
};

const matomoPushConventionSubmitSuccessEvent = (
  internshipKind: InternshipKind,
) => {
  window._mtm.push({ event: "conventionSubmitSuccess", internshipKind });
};
