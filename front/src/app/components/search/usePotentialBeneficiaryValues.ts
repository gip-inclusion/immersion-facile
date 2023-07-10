import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { AppellationDto, ContactEstablishmentRequestDto } from "shared";

export const usePotentialBeneficiaryValues = <
  T extends ContactEstablishmentRequestDto,
>(
  initialValues: T,
  methods: UseFormReturn<T>,
  appellations: AppellationDto[],
) => {
  useEffect(() => {
    const values = methods.getValues();
    const resetValues = {
      ...initialValues,
      potentialBeneficiaryEmail: values.potentialBeneficiaryEmail,
      potentialBeneficiaryFirstName: values.potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName: values.potentialBeneficiaryLastName,
      ...(values.contactMode === "EMAIL" && {
        message: values.message,
        immersionObjective: values.immersionObjective,
        potentialBeneficiaryPhone: values.potentialBeneficiaryPhone,
        potentialBeneficiaryResumeLink: values.potentialBeneficiaryResumeLink,
      }),
    };

    methods.reset(resetValues);
  }, [appellations]);
};
