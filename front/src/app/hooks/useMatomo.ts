import { useEffect } from "react";
import type { InternshipKind } from "shared";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";

export const useMatomo = (internshipKind: InternshipKind) => {
  const conventionFormFeedback = useFeedbackTopic("convention-form");
  useEffect(() => {
    if (conventionFormFeedback?.level === "success") {
      window._mtm.push({ event: "conventionSubmitSuccess", internshipKind });
    }
  }, [conventionFormFeedback?.level, internshipKind]);
};
