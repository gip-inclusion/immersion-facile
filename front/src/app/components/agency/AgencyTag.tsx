import React from "react";
import { Tag } from "react-design-system";
import { WithAgencyDto } from "shared";

export const AgencyTag = ({
  agency,
  className,
}: WithAgencyDto & { className?: string }) =>
  agency.refersToAgencyId ? (
    <Tag
      theme={"structureAccompagnement"}
      label={`Structure d'accompagnement liée à ${agency.refersToAgencyName}`}
      className={className}
    />
  ) : (
    <Tag theme={"prescripteur"} className={className} />
  );
