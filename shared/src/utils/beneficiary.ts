import {
  Beneficiary,
  BeneficiaryRepresentative,
} from "../convention/convention.dto";

const getEmergencyContactInfos = ({
  fullName,
  phone,
  email,
}: {
  fullName?: string;
  phone?: string;
  email?: string;
}) => {
  let infos = "";
  if (fullName) {
    infos += `${fullName} `;
  }
  if (phone || email) {
    infos += "(";
    if (phone) {
      infos += phone;
      if (email) {
        infos += " - ";
      }
    }
    if (email) {
      infos += email;
    }
    infos += ")";
  }
  return infos;
};

export const displayEmergencyContactInfos = ({
  beneficiary,
  beneficiaryRepresentative,
}: {
  beneficiaryRepresentative?: BeneficiaryRepresentative;
  beneficiary: Beneficiary;
}) =>
  beneficiaryRepresentative
    ? getEmergencyContactInfos({
        fullName: `${beneficiaryRepresentative.firstName} ${beneficiaryRepresentative.lastName}`,
        email: beneficiaryRepresentative.email,
        phone: beneficiaryRepresentative.phone,
      })
    : getEmergencyContactInfos({
        fullName: beneficiary.emergencyContact,
        email: beneficiary.emergencyContactEmail,
        phone: beneficiary.emergencyContactPhone,
      });
