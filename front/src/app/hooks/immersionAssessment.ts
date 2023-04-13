import { useDispatch } from "react-redux";
import { ImmersionAssessmentDto } from "shared";
import { immersionAssessmentSlice } from "src/core-logic/domain/immersionAssessment/immersionAssessment.slice";

export const useImmersionAssessment = (jwt: string) => {
  const dispatch = useDispatch();
  return {
    createAssessment: (assessment: ImmersionAssessmentDto): void => {
      dispatch(
        immersionAssessmentSlice.actions.creationRequested({ assessment, jwt }),
      );
    },
  };
};
