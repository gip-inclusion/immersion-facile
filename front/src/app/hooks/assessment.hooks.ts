import { useDispatch } from "react-redux";
import { AssessmentDto } from "shared";
import { assessmentSlice } from "src/core-logic/domain/assessment/assessment.slice";

export const useAssessment = (jwt: string) => {
  const dispatch = useDispatch();
  return {
    createAssessment: (assessment: AssessmentDto): void => {
      dispatch(assessmentSlice.actions.creationRequested({ assessment, jwt }));
    },
  };
};
