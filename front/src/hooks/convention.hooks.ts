import { useFormikContext } from "formik";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  ConventionDto,
  EstablishmentRepresentative,
  getSignatoryKey,
  isEstablishmentTutorIsEstablishmentRepresentative,
} from "shared";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";

export const useConvention = (jwt: string) => {
  const convention = useAppSelector(conventionSelectors.convention);
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const fetchConventionError = useAppSelector(conventionSelectors.fetchError);
  const isLoading = useAppSelector(conventionSelectors.isLoading);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(conventionSlice.actions.fetchConventionRequested(jwt));
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
  const { values, setFieldValue } = useFormikContext<ConventionDto>();
  const setEstablishmentRepresentative = (
    establishmentRepresentative: EstablishmentRepresentative,
  ) =>
    setFieldValue(
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

    if (!convention) {
      setEstablishmentRepresentative({
        role: "establishment-representative",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      });
      return;
    }

    if (!isEstablishmentTutorIsEstablishmentRepresentative(convention))
      setEstablishmentRepresentative(
        convention.signatories.establishmentRepresentative,
      );
  }, [isTutorEstablismentRepresentative, firstName, lastName, email, phone]);

  return setEstablishmentRepresentative;
};
