import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import { WithAgencyDto } from "shared";

export const AgencyTag = ({ agency }: WithAgencyDto) =>
  agency.refersToAgencyId ? (
    <Tag className={fr.cx("fr-my-4w")}>
      Structure d'accompagnement liée à {agency.refersToAgencyName}
    </Tag>
  ) : (
    <Tag className={fr.cx("fr-my-4w")}>Prescripteur</Tag>
  );
