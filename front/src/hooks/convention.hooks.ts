import { useFormikContext } from "formik";
import { useEffect, useState } from "react";
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

export const isEstablishmentTutorIsEstablishmentRepresentativeHook = () => {
  const { values, setFieldValue } = useFormikContext<ConventionDto>();
  const { firstName, lastName, email, phone } = values.establishmentTutor;
  const setEstablishmentRepresentative = (
    establishmentRepresentative: EstablishmentRepresentative,
  ) => {
    setFieldValue(
      getSignatoryKey("signatories.establishmentRepresentative"),
      establishmentRepresentative,
    );
  };

  const [
    isEstablishmentTutorIsEstablishmentRepresentativeValue,
    setIsEstablishmentTutorIsEstablishmentRepresentative,
  ] = useState<boolean>(
    isEstablishmentTutorIsEstablishmentRepresentative(values),
  );

  const [previousIsSame, setPreviousIsSame] = useState<boolean>(
    isEstablishmentTutorIsEstablishmentRepresentative(values),
  );

  useEffect(() => {
    if (isEstablishmentTutorIsEstablishmentRepresentativeValue) {
      setEstablishmentRepresentative({
        role: "establishment-representative",
        firstName,
        lastName,
        phone,
        email,
      });
    } else if (previousIsSame) {
      setEstablishmentRepresentative({
        role: "establishment-representative",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
      });
    }

    setPreviousIsSame(isEstablishmentTutorIsEstablishmentRepresentativeValue);
  }, [
    isEstablishmentTutorIsEstablishmentRepresentativeValue,
    firstName,
    lastName,
    email,
    phone,
  ]);

  return {
    isEstablishmentTutorIsEstablishmentRepresentativeValue,
    setIsEstablishmentTutorIsEstablishmentRepresentative,
  };
};
