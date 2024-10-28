import Tag from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import { WithAgencyDto } from "shared";

export const AgencyTag = ({
  agency,
  className,
}: WithAgencyDto & { className?: string }) =>
  agency.refersToAgencyId ? (
    <Tag className={className}>
      Structure d'accompagnement liée à {agency.refersToAgencyName}
    </Tag>
  ) : (
    <Tag className={className}>Prescripteur</Tag>
  );
