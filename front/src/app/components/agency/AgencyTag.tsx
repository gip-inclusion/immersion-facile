import React from "react";
import { Tag } from "react-design-system";

export const AgencyTag = ({
  refersToAgencyName,
  className,
}: { refersToAgencyName: string | null } & { className?: string }) =>
  refersToAgencyName ? (
    <Tag
      theme={"structureAccompagnement"}
      label={`Structure d'accompagnement liée à ${refersToAgencyName}`}
      className={className}
    />
  ) : (
    <Tag theme={"prescripteur"} className={className} />
  );
