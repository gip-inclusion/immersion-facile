import React from "react";
import { ConventionReadDto, toDisplayedDate } from "shared";

export const ImmersionDescription = ({
  convention,
}: {
  convention: ConventionReadDto;
}): JSX.Element => {
  const beneficiary = convention.signatories.beneficiary;
  const beneficiaryName = `${beneficiary.firstName} ${beneficiary.lastName}`;
  const dateStart = toDisplayedDate({ date: new Date(convention.dateStart) });
  const dateEnd = toDisplayedDate({ date: new Date(convention.dateEnd) });
  return (
    <p>
      {convention.internshipKind === "immersion"
        ? "L'immersion"
        : "Le mini-stage"}{" "}
      de <strong>{beneficiaryName}</strong> chez{" "}
      <strong>{convention.businessName}</strong>, qui a eu lieu du{" "}
      <strong>{dateStart}</strong> au <strong>{dateEnd}</strong>, touche à sa
      fin. Afin de procéder au bilan, nous vous invitons à compléter ce
      formulaire (moins de 3 minutes). Vos réponses seront partagées avec{" "}
      {beneficiaryName} et son conseiller pour ses futures candidatures.
    </p>
  );
};
