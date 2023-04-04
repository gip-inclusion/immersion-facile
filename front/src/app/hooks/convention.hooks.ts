import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  ConventionReadDto,
  EstablishmentRepresentative,
  getSignatoryKey,
  isEstablishmentTutorIsEstablishmentRepresentative,
} from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  conventionSlice,
  FetchConventionRequestedPayload,
} from "src/core-logic/domain/convention/convention.slice";

export const useConvention = (payload: FetchConventionRequestedPayload) => {
  const convention = useAppSelector(conventionSelectors.convention);
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const fetchConventionError = useAppSelector(conventionSelectors.fetchError);
  const isLoading = useAppSelector(conventionSelectors.isLoading);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(conventionSlice.actions.fetchConventionRequested(payload));
    return () => {
      dispatch(conventionSlice.actions.clearFeedbackTriggered());
    };
  }, []);

  return { convention, submitFeedback, fetchConventionError, isLoading };
};

export const useTutorIsEstablishmentRepresentative = () => {
  const isTutorEstablismentRepresentative = useAppSelector(
    conventionSelectors.isTutorEstablishmentRepresentative,
  );
  const convention = useAppSelector(conventionSelectors.convention);
  const { getValues, setValue } = useFormContext<ConventionReadDto>();
  const values = getValues();
  const setEstablishmentRepresentative = (
    establishmentRepresentative: EstablishmentRepresentative,
  ) =>
    setValue(
      getSignatoryKey("signatories.establishmentRepresentative"),
      establishmentRepresentative,
    );

  const { firstName, lastName, email, phone } = values.establishmentTutor;

  useEffect(() => {
    if (isTutorEstablismentRepresentative) {
      setEstablishmentRepresentative({
        role: "establishment-representative",
        firstName,
        lastName,
        phone,
        email,
      });
      return;
    }

    if (!convention) return;

    if (!isEstablishmentTutorIsEstablishmentRepresentative(convention))
      setEstablishmentRepresentative(
        convention.signatories.establishmentRepresentative,
      );
  }, [isTutorEstablismentRepresentative, firstName, lastName, email, phone]);

  return setEstablishmentRepresentative;
};
