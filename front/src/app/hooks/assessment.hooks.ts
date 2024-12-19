import { useDispatch } from "react-redux";
import { AssessmentDto } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { assessmentSelectors } from "src/core-logic/domain/assessment/assessment.selectors";
import { assessmentSlice } from "src/core-logic/domain/assessment/assessment.slice";

export const useAssessment = (jwt: string) => {
  const dispatch = useDispatch();
  return {
    isLoading: useAppSelector(assessmentSelectors.isLoading),
    currentAssessment: useAppSelector(assessmentSelectors.currentAssessment),
    createAssessment: (assessment: AssessmentDto): void => {
      dispatch(
        assessmentSlice.actions.creationRequested({
          assessmentAndJwt: {
            assessment,
            jwt,
          },
          feedbackTopic: "assessment",
        }),
      );
    },
  };
};
