import { useFormikContext } from "formik";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  ConventionDto,
  EstablishmentRepresentative,
  getSignatoryKey,
} from "shared";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";

export const useConvention = (jwt: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(conventionSlice.actions.conventionRequested(jwt));
  }, []);
};

export const isMentorIsEstablishmentRepresentativeHook = () => {
  const [
    isMentorIsEstablishmentRepresentative,
    setIsMentorIsEstablishmentRepresentative,
  ] = useState<boolean>(true);
  const { values, setFieldValue } = useFormikContext<ConventionDto>();
  const { firstName, lastName, email, phone } = values.mentor;
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
      isMentorIsEstablishmentRepresentative
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
    isMentorIsEstablishmentRepresentative,
    firstName,
    lastName,
    email,
    phone,
  ]);

  return {
    isMentorIsEstablishmentRepresentative,
    setIsMentorIsEstablishmentRepresentative,
  };
};
