import React from "react";
import { NPSForm } from "react-design-system";
import { ConventionReadDto, Role, npsFormIds } from "shared";

type NpsSectionProps = {
  convention: ConventionReadDto;
  roles: Role[];
};
export const NpsSection = ({
  convention,
  roles,
}: NpsSectionProps): JSX.Element => {
  const npsShowStatuses: (typeof convention.status)[] = [
    "IN_REVIEW",
    "ACCEPTED_BY_COUNSELLOR",
    "ACCEPTED_BY_VALIDATOR",
  ];
  return (
    <>
      {!roles.includes("back-office") &&
        npsShowStatuses.includes(convention.status) && (
          <NPSForm
            mode="embed"
            formId={npsFormIds.conventionVerification}
            conventionInfos={{
              id: convention.id,
              role: roles[0], // the tally does not support multiple roles
              status: convention.status,
            }}
          />
        )}
    </>
  );
};
