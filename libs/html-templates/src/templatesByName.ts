import { EmailType, TemplatedEmail } from "shared";

type CreateEmailVariable<P> = (params: P) => {
  content?: string;
  greetings?: string;
  agencyLogoUrl?: string;
};

const ifExists = (str: string | undefined, cb: (str: string) => string) =>
  str ? cb(str) : "";

export const templateByName: {
  [K in EmailType]: {
    subject: string;
    createEmailVariables: CreateEmailVariable<
      Extract<TemplatedEmail, { type: K }>["params"]
    >;
    tags?: string[];
  };
} = {
  AGENCY_WAS_ACTIVATED: {
    subject: "Votre agence a été activée",
    createEmailVariables: ({ agencyName, agencyLogoUrl }) => ({
      content: `<strong>Votre structure prescriptrice d'immersion est activée !</strong> 

        Nous avons bien activé l'accès à la demande de convention dématérialisée pour des immersions professionnelles pour: ${agencyName}.

        Merci à vous !`,
      agencyLogoUrl,
    }),
  },
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
    tags: ["lala"],
  },
  NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  NEW_CONVENTION_AGENCY_NOTIFICATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  REJECTED_CONVENTION_NOTIFICATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  MAGIC_LINK_RENEWAL: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    subject: "Confirmez une demande d'immersion",
    createEmailVariables: ({
      signatoryName,
      beneficiaryName,
      businessName,
      establishmentRepresentativeName,
      beneficiaryRepresentativeName,
      magicLink,
    }) => ({
      greetings: `Bonjour ${signatoryName},`,
      content: `Une demande de convention d'immersion vient d'être enregistrée. Vous devez maintenant la confirmer.
        
        Pour rappel, cette demande concerne : 
           - Le bénéficiaire ${beneficiaryName}${ifExists(
        beneficiaryRepresentativeName,
        (str) => `\n- ${str}`,
      )}
           - L'entreprise ${businessName}
           - Le tuteur dans l'entreprise ${establishmentRepresentativeName}
        
        Votre confirmation est indispensable pour permettre la validation définitive de la convention par un conseiller.  
        
        <strong>Vous devez maintenant confirmer votre demande. 
        
        <a href="${magicLink}">Pour la confirmer, cliquez ici</a>. 
        
        Votre confirmation est obligatoire</strong> pour permettre à votre conseiller de valider la convention. Merci  !
        
        La décision de votre conseiller vous sera transmise par mail.
        
        Attention, ne démarrez pas votre immersion tant que vous n'avez pas reçu cette validation ! Vous n'auriez pas de couverture en cas d'accident.  
        
        Bonne journée !
        
        L'équipe de l'Immersion Facilitée`,
    }),
  },
  CONTACT_BY_EMAIL_REQUEST: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  CONTACT_BY_PHONE_INSTRUCTIONS: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  CONTACT_IN_PERSON_INSTRUCTIONS: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  SHARE_DRAFT_CONVENTION_BY_LINK: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  SUGGEST_EDIT_FORM_ESTABLISHMENT: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  EDIT_FORM_ESTABLISHMENT_LINK: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  CREATE_IMMERSION_ASSESSMENT: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
};
