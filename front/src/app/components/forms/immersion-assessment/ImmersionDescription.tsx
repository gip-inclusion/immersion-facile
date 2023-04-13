import React from "react";

import { ConventionReadDto, toDisplayedDate } from "shared";

export const ImmersionDescription = ({
  convention,
}: {
  convention: ConventionReadDto;
}): JSX.Element => {
  const beneficiary = convention.signatories.beneficiary;
  const beneficiaryName = `${beneficiary.firstName} ${beneficiary.lastName}`;
  const dateStart = toDisplayedDate(new Date(convention.dateStart));
  const dateEnd = toDisplayedDate(new Date(convention.dateEnd));
  return (
    <p>
      {convention.internshipKind === "immersion"
        ? "L'immersion"
        : "Le mini-stage"}{" "}
      de <strong>{beneficiaryName}</strong> auprès de l'établissement{" "}
      <strong>{convention.businessName}</strong> qui a eu lieu du{" "}
      <strong>{dateStart}</strong> au <strong>{dateEnd}</strong> touche à sa
      fin.
    </p>
  );
};
