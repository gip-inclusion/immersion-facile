import { AgencyDto } from "./agency.dto";
import { AgencyPublicDisplayDto } from "./publicAgency.dto";

export const toAgencyPublicDisplayDto = (
  agency: AgencyDto,
  referedAgency: AgencyDto | null,
): AgencyPublicDisplayDto => {
  if (
    agency.refersToAgencyId &&
    referedAgency &&
    agency.refersToAgencyId !== referedAgency.id
  )
    throw new Error(
      "Agency.refersToAgencyId and referedAgency.id are not identical.",
    );

  return {
    id: agency.id,
    name: agency.name,
    kind: agency.kind,
    address: agency.address,
    position: agency.position,
    signature: agency.signature,
    logoUrl: agency.logoUrl,
    agencySiret: agency.agencySiret,
    refersToAgency:
      agency.refersToAgencyId && referedAgency
        ? {
            id: referedAgency.id,
            address: referedAgency.address,
            kind: referedAgency.kind,
            name: referedAgency.name,
            position: referedAgency.position,
            signature: referedAgency.signature,
            agencySiret: referedAgency.agencySiret,
            logoUrl: referedAgency.logoUrl,
          }
        : null,
  };
};

export const getCounsellorsAndValidatorsEmailsDeduplicated = (
  agency: AgencyDto,
) => {
  const allEmails = [...agency.validatorEmails, ...agency.counsellorEmails].map(
    (email) => email.toLowerCase(),
  );

  return [...new Set(allEmails)];
};
