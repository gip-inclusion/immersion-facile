import { useFormikContext } from "formik";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  ConventionDto,
  EstablishmentRepresentative,
  getSignatoryKey,
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
    dispatch(conventionSlice.actions.conventionRequested(jwt));
  }, []);

  return { convention, submitFeedback, fetchConventionError, isLoading };
};

export const isEstablishmentTutorIsEstablishmentRepresentativeHook = () => {
  const [
    isEstablishmentTutorIsEstablishmentRepresentative,
    setIsEstablishmentTutorIsEstablishmentRepresentative,
  ] = useState<boolean>(true);
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

  useEffect(() => {
    setEstablishmentRepresentative(
      isEstablishmentTutorIsEstablishmentRepresentative
        ? {
            role: "establishment-representative",
            firstName,
            lastName,
            phone,
            email,
          }
        : {
            role: "establishment-representative",
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
          },
    );
  }, [
    isEstablishmentTutorIsEstablishmentRepresentative,
    firstName,
    lastName,
    email,
    phone,
  ]);

  return {
    isEstablishmentTutorIsEstablishmentRepresentative,
    setIsEstablishmentTutorIsEstablishmentRepresentative,
  };
};
