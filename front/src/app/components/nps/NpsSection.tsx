import React from "react";
import { NPSForm } from "react-design-system";
import { ConventionReadDto, Role } from "shared";

type NpsSectionProps = {
  convention: ConventionReadDto;
  role: Role;
};
export const NpsSection = ({
  convention,
  role,
}: NpsSectionProps): JSX.Element => {
  const npsShowStatuses: (typeof convention.status)[] = [
    "IN_REVIEW",
    "ACCEPTED_BY_COUNSELLOR",
    "ACCEPTED_BY_VALIDATOR",
  ];
  return (
    <>
      {role !== "admin" && npsShowStatuses.includes(convention.status) && (
        <NPSForm
          conventionInfos={{
            id: convention.id,
            role,
            status: convention.status,
          }}
        />
      )}
    </>
  );
};
