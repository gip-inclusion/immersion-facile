export const emailAttachements = {
  memoAgencyGeneral:
    "https://immersion.cellar-c2.services.clever-cloud.com/Fiche-memo-prescripteur-générale-immersionfacilitée2024.pdf",
  memoAgencyRolesAndRisks:
    "https://immersion.cellar-c2.services.clever-cloud.com/Fiche memo prescripteur-Role-des-prescripteurs-et-couverture-des risques-immersionfacilitee2024.pdf",
  memoBeneficiary:
    "https://immersion.cellar-c2.services.clever-cloud.com/Fiche memo-beneficiaire-immersionfacilitée2024.pdf",
};

export const emailReplySeparator =
  "##- Veuillez répondre au-dessus de cette ligne -##";

export const emailExchangeSplitters = [
  /<br>\s*(De(?:&nbsp;|\u00A0|\s)*:|Le&nbsp;.*?,)?\s*Immersion Facilitée\s*(?:<|&lt;)ne-pas-ecrire-a-cet-email@immersion-facile\.beta\.gouv\.fr(?:>|&gt;)[^<]*<br>/i,
  emailReplySeparator,
];
