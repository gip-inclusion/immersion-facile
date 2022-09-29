import { useDispatch } from "react-redux";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  conventionSlice,
  ConventionSubmitFeedback,
} from "src/core-logic/domain/convention/convention.slice";

export const useConventionSubmitFeedback = () => {
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const dispatch = useDispatch();
  return {
    submitFeedback,
    setSubmitFeedback: (feedback: ConventionSubmitFeedback) =>
      dispatch(
        conventionSlice.actions.conventionSubmitFeedbackChanged(feedback),
      ),
  };
};
