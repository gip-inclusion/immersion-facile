import { EmailType, TemplatedEmail } from "shared";

type CreateEmailVariable<P> = (params: P) => {
  greetings?: string;
  content?: string;
  highlight?: string;
  subContent?: string;
  legals?: string;
  agencyLogoUrl?: string;
  button?: {
    url: string;
    label: string;
  };
};

type CreateEmailSubject<P> = (params: P) => string;

const defaultSignature = `
    Bonne journée !

    L'équipe Immersion Facilitée
`;

const defaultConventionFinalLegals = `<strong>Obligations des parties :</strong>
Le bénéficiaire s’engage à exercer les activités et tâches telles que définies dans la présente convention et à mettre en œuvre l’ensemble des actions lui permettant d’atteindre les objectifs d’insertion socioprofessionnelle attendus, et notamment :
• Respecter le règlement intérieur de la structure d’accueil et les consignes qui lui sont données et informer le conseiller référent de tout retard ou absence en fournissant les documents justificatifs requis ;
• Se conformer à l’ensemble des dispositions et mesures en matière d’hygiène et de sécurité applicables aux salariés dans la structure d’accueil, notamment en matière de port obligatoire des EPI et propres aux activités et tâches confiées ;
• Informer le conseiller référent de tout incident et/ou accident ;
• Informer le conseiller référent et/ou la personne responsable de son accueil et de son suivi des difficultés qu’il pourrait rencontrer dans la mise en œuvre de cette période ; • Auto évaluer l’apport de la période de mise en situation en milieu professionnel dans la construction de son parcours d’insertion socioprofessionnelle.
La structure d’accueil s’engage à prendre l’ensemble des dispositions nécessaires en vue de permettre au bénéficiaire d’exercer les activités et tâches telles que définies dans la présente conven- tion, à l’accompagner afin de lui permettre d’atteindre les objectifs d’insertion socioprofessionnelle attendus, et notamment à :
• Désigner une personne chargée d’accueillir, d’aider, d’informer, de guider et d’évaluer le bénéficiaire pendant la période de mise en situation en milieu professionnel ;
• Ne pas faire exécuter au bénéficiaire une tâche régulière correspondant à un poste de travail permanent, à un accroissement temporaire d’activité, à un emploi saisonnier ou au remplacement d’un salarié en cas d’absence ou de suspension de son contrat de travail ;
• S’assurer que la mise en situation en milieu professionnel respecte les règles applicables à ses salariés pour ce qui a trait aux durées quotidienne et hebdomadaire de présence, à la présence de nuit, au repos quotidien, hebdomadaire et aux jours fériés ;
• Etre couvert par une assurance Multirisque Professionnelle en cours de validité tant à l’encontre de tiers que sur des biens de la structure d’accueil. ;
• Mettre en œuvre toutes les dispositions nécessaires en vue de se conformer aux articles R.4141-3-1 et suivants du code du travail en matière d’information des salariés sur les règles d’hygiène et de sécurité applicables dans son établissement et fournir l’ensemble des EPI nécessaires ;
• Prévenir dès connaissance des faits, et au plus tard dans les 24 heures, la structure d’accompagnement de tout accident survenant soit au cours ou sur le lieu de la mise en situation en milieu professionnel, soit au cours du trajet domicile-structure d’accueil ;
• Donner accès aux moyens de transport et installations collectifs ;
• Libérer, à la demande de la structure d’accompagnement, le bénéficiaire chaque fois que cela s’avère nécessaire.
La structure d’accompagnement s’engage, en la personne du conseiller référent, à assurer la mise en œuvre de la période de mise en situation en milieu professionnel et notamment à :
• Assurer l’accompagnement dans la structure d’accueil du bénéficiaire au travers de visites et d’entretiens sous toute forme ;
• Intervenir, à la demande de la structure d’accueil et/ou du bénéficiaire pour régler toute difficulté pouvant survenir pendant la période de mise en situation en milieu professionnel ;
• Informer sans délai l’organisme prescripteur ou, si le bénéficiaire est salarié, l’employeur de ce dernier, de tout accident survenant au cours ou sur le lieu de la mise en situation en milieu professionnel ou de trajet qui lui serait signalé dans le cadre de cette période ;
• Réaliser le bilan / évaluation de la mise en situation réalisée, transmis, le cas échéant, à l’organisme prescripteur L’organisme prescripteur s’engage, à :
• Analyser la pertinence de la période de mise en situation en milieu professionnel proposée et d’en définir des objectifs adaptés aux besoins, possibilités et capacités tant du bénéficiaire que de la structure d’accueil ;
• Procéder à la déclaration dans les 48 heures de tout accident de travail ou de trajet qui lui serait signalé auprès de la Caisse Primaire d’Assurance Maladie du lieu de résidence du béné- ficiaire dès lors qu’il couvre le risque AT/MP.`;

const advices = `
      <strong>Nos conseils pour cette première prise de contact !</strong>
      
       
      Comment présenter votre demande ? 
      
      <ul>
        <li>Soyez direct, concret et courtois.</li>
        <li>Présentez-vous, indiquez que vous avez eu le nom et le numéro de téléphone de votre interlocutrice ou interlocuteur grâce à Immersion Facilitée puis présentez simplement votre projet et l’objectif que vous recherchez en effectuant une immersion. 
      
        Par exemple : “Je souhaite devenir mécanicien auto et je voudrais découvrir comment ce métier se pratique dans un garage comme le vôtre. Ca me permettra de vérifier que ce métier           correspond à l'idée que j'en ai. 

        La personne qui m’accueillera et me présentera le métier pourra aussi vérifier si ce métier est fait pour moi.” 
        </li>
        <li>Votre interlocutrice ou interlocuteur sait dans les grandes lignes ce qu’est une immersion professionnelle. Vous pouvez lui rappeler que cette immersion sera encadrée par une convention signée par l'organisme qui vous suit, par elle/lui et par vous.</li>
        <li>Indiquez lui le moment où vous aimeriez faire une immersion et pourquoi vous voulez la faire à cette date.
            Par exemple : “il faudrait que je fasse une immersion avant de m’inscrire à une formation. “
        </li>
        <li>
        Indiquez également le nombre de semaines que vous aimeriez faire en immersion si vous le savez déjà.
        </li>
        <li>Concluez en lui demandant un rendez-vous  pour qu’il/elle se rende compte du sérieux de votre projet.</li>
      </ul>
           
      
      Quelle est la durée d’une immersion ?

      
        <li>Les immersions se font le plus souvent pendant une semaine ou deux. Une immersion peut être reconduite une fois.</li>
        <li>Il n’est pas possible de dépasser un mois.</li>
        <li>Il est possible de faire une immersion de seulement un ou deux jours mais vous ne découvrirez pas parfaitement un métier.</li>
      </ul>
          
      
       Comment expliquer simplement ce qu’est une immersion ? 
       <ul>
        <li>C’est un stage d’observation, strictement encadré d’un point de vue juridique qui permet de découvrir un métier, confirmer son projet professionnel ou se faire connaître auprès d'un recruteur.</li>
        <li>Vous conservez votre statut et êtes couvert par votre Pôle emploi, votre Mission Locale ou le Conseil départemental, Cap Emploi, etc. (en fonction de votre situation).</li>
        <li>Pendant la durée de l'immersion, vous conservez votre indemnité habituelle. L'entreprise n'a pas à vous défrayer.</li>
        <li>Le rôle de celui qui vous accueillera est de vous présenter le métier et de vérifier avec vous que ce métier vous convient en vous faisant des retours les plus objectifs possibles.</li>
        <li>Pendant la durée de votre présence, vous pouvez aider les salariés en donnant un coup de main.</li>
      </ul>


      Bon à savoir  
      <ul>
        <li>L'entreprise qui vous accueille n'a pas besoin de votre numéro de sécurité sociale ou de votre date de naissance. Elle n'a pas besoin non plus d'un justificatif de domicile ou d'une feuille d'imposition.</li>
        <li>Si on vous les demande, indiquez à l'entreprise de se mettre en relation avec votre conseiller emploi qui attestera de votre identité.</li>
      </ul>
`;

export const templateByName: {
  [K in EmailType]: {
    subject: CreateEmailSubject<Extract<TemplatedEmail, { type: K }>["params"]>;
    niceName: string;
    createEmailVariables: CreateEmailVariable<
      Extract<TemplatedEmail, { type: K }>["params"]
    >;
    tags?: string[];
  };
} = {
  AGENCY_WAS_ACTIVATED: {
    subject: () => `Immersion Facilitée : Votre agence a été activée`,
    niceName: "AGENCY_WAS_ACTIVATED",
    createEmailVariables: ({ agencyName, agencyLogoUrl }) => ({
      content: `<strong>Votre structure prescriptrice d'immersion est activée !</strong> 

        Nous avons bien activé l'accès à la demande de convention dématérialisée pour des immersions professionnelles pour: ${agencyName}. 
        
        Merci à vous !`,
      agencyLogoUrl,
    }),
    tags: ["exemples", "de", "tags"],
  },
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
    subject: () =>
      "Immersion Facilitée : votre confirmation pour votre demande d'immersion est enregistrée",
    niceName: "NEW_CONVENTION_BENEFICIARY_CONFIRMATION",
    createEmailVariables: ({ firstName, lastName }) => ({
      greetings: `Bonjour ${firstName} ${lastName},`,
      content: `
        Merci d'avoir confirmé votre demande d'immersion. Elle va être transmise à votre conseiller référent. 

        Il vous informera par mail de la validation ou non de l'immersion. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.
      `,
      highlight: `Attention, ne démarrez pas cette immersion tant que vous n'avez pas reçu cette validation !`,
      subContent: defaultSignature,
    }),
    tags: ["lala"],
  },
  NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
    subject: () =>
      "Immersion Facilitée : Demande d'immersion professionnelle confirmée",
    niceName: "NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION",
    createEmailVariables: ({
      establishmentTutorName,
      beneficiaryFirstName,
      beneficiaryLastName,
    }) => ({
      greetings: `Bonjour ${establishmentTutorName},`,
      content: `
      Vous venez de confirmer la demande d'immersion professionnelle pour 

      ${beneficiaryFirstName} ${beneficiaryLastName}  au sein de votre entreprise. 

      

      Cette demande va être transmise à son conseiller référent. 

      Il vous informera prochainement par mail de la validation ou non de l'immersion. 
      `,
      highlight:
        "Attention, ne démarrez pas cette immersion tant que vous n'avez pas reçu la validation !",
      subContent: defaultSignature,
    }),
  },
  NEW_CONVENTION_AGENCY_NOTIFICATION: {
    subject: ({ businessName, firstName, lastName, agencyName }) =>
      `Immersion Facilitée : une demande de convention d'immersion est déposée : ${firstName}, ${lastName} - ${businessName} - ${agencyName}.`,
    niceName: "NEW_CONVENTION_AGENCY_NOTIFICATION",
    createEmailVariables: ({
      magicLink,
      dateStart,
      dateEnd,
      firstName,
      lastName,
      businessName,
      agencyName,
    }) => ({
      content: `
      <strong>Une nouvelle demande d'immersion a été enregistrée.</strong>
      ­

      Vous pouvez prendre connaissance de la demande en <a href="${magicLink}">cliquant ici</a>.

      

      Vous pouvez dès maintenant demander des modifications ou la refuser si nécessaire.  

      Vous ne pouvez pas la valider tant que le bénéficiaire et l'entreprise n'ont pas confirmé chacun leur accord pour cette demande. 

      Vous avez connaissance du mail et du téléphone de chacun. Vous pouvez les relancer en cas de besoin.  

      

      Dates de l'immersion: 

      du ${dateStart}

      au ${dateEnd}

      

      Bénéficiaire:

      ${firstName} ${lastName}

      

      Entreprise:

      ${businessName}
      

      Structure d'accompagnement:

      ${agencyName}
      `,
      subContent: defaultSignature,
    }),
  },
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
    subject: ({ immersionAppellationLabel, businessName }) =>
      `Immersion facilitée : Validation et convention de l'immersion pour observer l'activité de ${immersionAppellationLabel} au sein de ${businessName}`,
    niceName: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
    createEmailVariables: ({
      beneficiaryFirstName,
      beneficiaryLastName,
      dateStart,
      dateEnd,
      businessName,
      establishmentTutorName,
      signature,
      beneficiaryRepresentativeName,
      establishmentRepresentativeName,
      immersionAddress,
      scheduleText,
      immersionActivities,
      immersionAppellationLabel,
      immersionSkills,
      workConditions,
      sanitaryPrevention,
      individualProtection,
    }) => ({
      greetings: "Bonjour,",
      content: `
      Bonne nouvelle ! 


      La demande faite par ${beneficiaryFirstName} ${beneficiaryLastName} pour réaliser une immersion du ${dateStart} au ${dateEnd}, au sein de ${businessName} et encadrée par ${establishmentTutorName} a été validée et la convention est bien enregistrée. 
      
      L'immersion peut donc démarrer aux dates convenues. 
      
       
      
      À la fin de l'immersion, nous vous remercions de compléter la fiche d'évaluation de l'immersion <a href="https://immersion.cellar-c2.services.clever-cloud.com/bilan-immersion-professionnelle-inscriptible.pdf">à télécharger ici</a>, et de l'envoyer au conseiller qui a signé la convention (Pôle Emploi, Mission Locale…). Cette évaluation doit être complétée par le tuteur, si possible en présence du bénéficiaire de l'immersion.
      
       
      
      En cas de difficulté, prévenez au plus vite votre conseiller pour qu'il vous conseille au mieux.
      
       
      
      Bien cordialement, 
      
      ${signature}
      
       
      
      Vous trouverez ci-dessous la convention d'immersion.
      
       
      
       
      
      <strong>Convention d'immersion professionnelle</strong>
      
       
      
      Cette convention est établie entre :

      <ul>
        <li>${beneficiaryFirstName} ${beneficiaryLastName}</li>
        <li>${beneficiaryRepresentativeName}</li>
        <li>${establishmentRepresentativeName}</li>
        <li>${signature}</li>
      </ul>

      Toutes ces parties ont signé cette convention par le moyen d'une signature électronique, dans le cadre d'une téléprocédure créée par l'Etat. 
      
       
      
      Cette immersion se déroulera au sein de ${businessName}, à l'adresse suivante ${immersionAddress}.
      
       
      
      L'immersion se déroulera du du ${dateStart} au ${dateEnd}. 
      
      Les horaires de l'immersion seront :
      
      ${scheduleText}
      
      
       
      
      L'immersion aura pour objectif de découvrir les activités nécessaire pour être ${immersionAppellationLabel}. 
       
      
      Ces activités sont : ${immersionActivities}.
      
      Les compétences et savoir être observés sont : ${immersionSkills}.
      
      Cette immersion se déroulera dans les conditions réelles d'exercice de ce métier. 
      
      Il peut y avoir des conditions particulières d'exercice du métier. S'il y en a, ce sont ${workConditions}
      
      ${beneficiaryFirstName} ${beneficiaryLastName} sera encadré(e) par ${establishmentTutorName}.
      
       
      
       
      
      Dans le cadre de cette immersion, 
      
      - des mesures de prévention sanitaire sont prévues :      
      ${sanitaryPrevention}.

      - un équipement de protection est fourni : ${individualProtection}.
      
       
      
       
      
      ${beneficiaryFirstName} ${beneficiaryLastName}, ${beneficiaryRepresentativeName} et ${establishmentRepresentativeName} en signant cette convention, s'engagent à respecter les obligations réglementaires de la Période de Mise en Situation Professionnelle, rappelées ci-après.
      `,
      subContent: defaultSignature,
      legals: defaultConventionFinalLegals,
    }),
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: {
    subject: ({ beneficiaryFirstName, beneficiaryLastName }) =>
      `Immersion Facilitée : la demande de convention d'immersion envoyée par ${beneficiaryFirstName} ${beneficiaryLastName} est totalement signée. A vous de la valider !`,
    niceName: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
    createEmailVariables: ({
      beneficiaryEmail,
      beneficiaryFirstName,
      beneficiaryLastName,
      businessName,
      advisorFirstName,
      advisorLastName,
      magicLink,
      dateEnd,
      dateStart,
      immersionAddress,
    }) => ({
      greetings: `Bonjour ${advisorFirstName} ${advisorLastName}`,
      content: `
      <strong>La demande d'immersion de ${beneficiaryFirstName} ${beneficiaryLastName} est signée. 
      A vous de l'étudier !</strong>
      `,
      button: {
        url: magicLink,
        label: "Voir la demande",
      },
      subContent: `
      Vous pouvez  demander des modifications ou la refuser,  si nécessaire  ou la valider si cette demande correspond au projet de ${beneficiaryFirstName} ${beneficiaryLastName}, ${beneficiaryEmail}.
      
       
      
      N'hésitez pas à le joindre ou à appeler l'entreprise. Leurs coordonnées sont présentes dans la demande de convention.        
      
       
      
      Dates de l'immersion : 
      
      du ${dateStart}
      
      au ${dateEnd}     
       
      
       
      
      Entreprise  d'accueil :
      
      ${businessName}
      
      ${immersionAddress}


      ${defaultSignature}
      `,
    }),
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: {
    subject: ({ beneficiaryFirstName, beneficiaryLastName }) =>
      `Immersion Facilitée : une demande de convention d'immersion vous est directement adressée par: ${beneficiaryFirstName} ${beneficiaryLastName}`,
    niceName: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION",
    createEmailVariables: ({
      advisorFirstName,
      advisorLastName,
      magicLink,
      dateStart,
      dateEnd,
      beneficiaryEmail,
      beneficiaryFirstName,
      beneficiaryLastName,
      businessName,
      immersionAddress,
    }) => ({
      greetings: `Bonjour ${advisorFirstName} ${advisorLastName},`,
      content: `
      <strong>Une nouvelle demande d'immersion a été enregistrée.</strong>


      Nous vous transmettons une demande de convention d'immersion (PMSMP) qui vient d'être faite par un demandeur d'emploi que vous suivez.

      

      <strong>Etape 1</strong> : Si le demandeur d’emploi n’est pas reconnu par CVM, procédez à son identification afin de pouvoir traiter le mail. Vous avez les informations à la fin de cet email. 
      Consultez la procédure à suivre pour clôturer cet email : <a href="https://drive.google.com/file/d/1tWL68ua1f-NgYnPkXs979_CkukPtlGRU/view?usp=sharing">Comment traiter un mail Immersion Facilitée dans CVM ?</a>
      

      <strong>Etape 2</strong> : 


      <a href="${magicLink}">Vous pouvez y accéder en cliquant ici</a>

      

      Tant que cette demande n'est pas encore confirmée par <strong>l'entreprise et par la/le bénéficiaire</strong>, vous pouvez demander des modifications ou la refuser, si nécessaire.

      

      <strong>La demande de modification et le refus sont à réaliser depuis l’écran Immersion Facilitée.</strong>

      

      Quand leur accord respectif sera enregistré, vous pourrez alors la valider. 

      

      Pensez à relancer celui qui n'a pas confirmé si son accord tarde à venir !  

      

      <strong>Ne répondez pas à ce mail, il ne sera ni adressé au bénéficiaire, ni à l’entreprise.</strong>
      

      Vous pouvez retrouver les coordonnées de chacun sur l’écran Immersion Facilitée.

      



      <strong>Résumé de la demande :</strong>
      

      Dates de l'immersion : 

      du ${dateStart}

      au ${dateEnd}

      

      Demandeur d'emploi  :

      ${beneficiaryFirstName} ${beneficiaryLastName}

      Courriel  : ${beneficiaryEmail}

      

      Entreprise accueillant la PMSMP :

      ${businessName}

      ${immersionAddress}

      `,
      subContent: defaultSignature,
    }),
  },
  REJECTED_CONVENTION_NOTIFICATION: {
    subject: ({ immersionProfession, businessName }) =>
      `Refus de la demande d'immersion pour observer l'activité de ${immersionProfession} au sein de ${businessName}`,
    niceName: "REJECTED_CONVENTION_NOTIFICATION",
    createEmailVariables: ({
      beneficiaryFirstName,
      beneficiaryLastName,
      rejectionReason,
      agency,
      businessName,
      signature,
    }) => ({
      greetings: "Bonjour,",
      content: `
      Bonjour, 


      Nous vous informons que la demande d'immersion professionnelle de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} a été refusée par ${agency}.
      
      
      Les raisons en sont ${rejectionReason} par ${agency}.
      
       
      
      Vous pouvez vous rapprocher de votre conseiller pour en échanger. 
      
      
      Bien cordialement, 
      
      ${signature} 
      `,
    }),
  },
  CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: {
    subject: () =>
      "Immersion Facilitée : veuillez modifier cette demande d'immersion",
    niceName: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
    createEmailVariables: ({
      agency,
      reason,
      beneficiaryFirstName,
      beneficiaryLastName,
      businessName,
      magicLink,
      signature,
    }) => ({
      content: `${agency} vous informe que la demande d'immersion de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} nécessite d'être modifiée pour la raison suivante :

 

      ${reason}
      
       
      
      <a href="${magicLink}">Veuillez suivre ce lien pour modifier votre demande</a>.
      
       
      
      Après avoir corrigé votre demande, il vous faudra de nouveau confirmer votre accord. 
      
      Pensez à surveiller votre boite mail et à consulter vos spams si vous ne recevez pas le mail de demande de confirmation. 
      
      
      Bien cordialement, 
      
      ${signature}`,
    }),
  },
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
    subject: ({ beneficiaryFirstName, beneficiaryLastName, businessName }) =>
      `Demande d'immersion à étudier: ${beneficiaryFirstName} ${beneficiaryLastName} - ${businessName}`,
    niceName: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
    createEmailVariables: ({
      beneficiaryFirstName,
      beneficiaryLastName,
      possibleRoleAction,
      businessName,
      magicLink,
    }) => ({
      content: `
      <strong>Une nouvelle demande d'immersion a été enregistrée.</strong>
­

      Bonjour,  

      

      Une demande d'immersion de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} vous est envoyée pour que vous l'examiniez. 

      

      Nous vous remercions d'en prendre connaissance pour ${possibleRoleAction}.
      `,
      button: {
        label: "Consulter la demande",
        url: magicLink,
      },
      subContent: defaultSignature,
    }),
  },
  MAGIC_LINK_RENEWAL: {
    subject: () =>
      "Immersion Facilitée : voici votre nouveau lien magique pour accéder à la demande d'immersion",
    niceName: "MAGIC_LINK_RENEWAL",
    createEmailVariables: ({ magicLink }) => ({
      greetings: "Bonjour,",

      content: `
      Vous venez de demander le renouvellement d'un lien pour accéder à une demande d'immersion. Veuillez le trouver ci-dessous :
      `,
      button: {
        url: magicLink,
        label: "Voir ma demande d'immersion",
      },
      subContent: defaultSignature,
      highlight:
        "Si vous n'êtes pas à l'origine de cette demande, veuillez contacter notre équipe.",
    }),
  },
  BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION: {
    subject: () =>
      "Immersion Facilitée : à vous de confirmer votre demande de convention",
    niceName:
      "BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION",
    createEmailVariables: ({
      beneficiaryFirstName,
      beneficiaryLastName,
      immersionProfession,
      businessName,
      establishmentRepresentativeName,
      existingSignatureName,
      magicLink,
    }) => ({
      greetings: "Bonjour,",
      content: `
      La demande de convention pour l'immersion de ${beneficiaryFirstName} ${beneficiaryLastName} pour le métier de ${immersionProfession} dans l'entreprise ${businessName} encadré par ${establishmentRepresentativeName} vient d'être signée par ${existingSignatureName}.


      <strong>À vous maintenant de la confirmer !</strong>
      `,
      button: {
        url: magicLink,
        label: "Confirmer ma demande de convention",
      },
      subContent: `
      Ensuite, il vous suffira d'attendre le mail de validation de l'organisme d'accompagnement.

      <strong>Attention, ne démarrez pas l'immersion sans ce mail de validation. Sinon, le risque “accident du travail” ne sera pas couvert.</strong>
      
      ${defaultSignature}
      `,
    }),
  },
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    subject: () => "Immersion Facilitée : Confirmez une demande d'immersion",
    niceName: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
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
           - Le bénéficiaire ${beneficiaryName}${
        beneficiaryRepresentativeName
          ? `\n- ${beneficiaryRepresentativeName}`
          : ""
      }
           - L'entreprise ${businessName}
           - Le tuteur dans l'entreprise ${establishmentRepresentativeName}
        
        Votre confirmation est indispensable pour permettre la validation définitive de la convention par un conseiller.  
        
        Vous devez maintenant confirmer votre demande.`,
      button: { url: magicLink, label: "Pour la confirmer, cliquez ici" },
      highlight: `
        Attention, ne démarrez pas votre immersion tant que vous n'avez pas reçu cette validation ! Vous n'auriez pas de couverture en cas d'accident.`,
      subContent: `      
      <strong>Votre confirmation est obligatoire</strong> pour permettre à votre conseiller de valider la convention. Merci  !
        
        La décision de votre conseiller vous sera transmise par mail.
        

        ${defaultSignature}
      `,
    }),
  },
  CONTACT_BY_EMAIL_REQUEST: {
    subject: ({ jobLabel }) =>
      `Immersion Facilitée : un candidat vous contacte pour une demande d'immersion pour le métier de ${jobLabel}`,
    niceName: "CONTACT_BY_EMAIL_REQUEST",
    createEmailVariables: ({
      contactFirstName,
      contactLastName,
      potentialBeneficiaryEmail,
      potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName,
      jobLabel,
      businessName,
      message,
    }) => ({
      greetings: `Bonjour ${contactFirstName} ${contactLastName},`,
      content: `
      ${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName} cherche à vous contacter pour une demande d'immersion. 

      L'immersion souhaitée porte sur le métier de ${jobLabel} dans votre entreprise ${businessName}


      <strong>Voici son message :</strong>

      ${message}


      Vous pouvez le joindre par mail  : ${potentialBeneficiaryEmail}


      <strong>Les points essentiels pour étudier une demande d'immersion professionnelle :</strong>

 
      <ul>
        <li>Vérifiez avec qu'elle/il est bien suivi/e par un conseiller emploi (ex: Pôle emploi, Mission Locale, Cap Emploi, Chargé d'Insertion Professionnelle) ou un conseiller en évolution professionnelle. </li>
        <li>Échangez sur vos objectifs réciproques, vos besoins, votre calendrier possible. Il est possible de faire une immersion pour découvrir un métier, confirmer un projet professionnel ou initier un recrutement.  Une immersion se fait en général pendant une à deux semaines et ne peut jamais dépasser un mois. Ce n'est pas un stage d'application fait pendant une formation. 
        </li>
        <li>Si vous mettez d'accord, complétez la demande de convention. Elle sera adressée automatiquement à la structure d'accompagnement du bénéficiaire. </li>
        <li>Vous souhaitez suspendre votre visibilité sur la plateforme, le temps d'étudier sereinement cette demande ? Cliquer sur <a href="https://immersion-facile.beta.gouv.fr/">“modifier votre entreprise”</a>.</li>
      </ul>

      Voici quelques conseils pour préparer ce premier échange :
      `,
      button: {
        url: "https://immersion.cellar-c2.services.clever-cloud.com/e6d2a82b-2169-4a92-badc-8fc37c2c5a0e.pdf",
        label: "Voir nos conseils",
      },
      subContent: defaultSignature,
    }),
  },
  CONTACT_BY_PHONE_INSTRUCTIONS: {
    subject: () =>
      `Immersion Facilitée : coordonnées téléphoniques pour faire votre demande d'immersion`,
    niceName: "CONTACT_BY_PHONE_INSTRUCTIONS",
    createEmailVariables: ({
      businessName,
      contactFirstName,
      contactLastName,
      contactPhone,
      potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName,
    }) => ({
      greetings: `Bonjour ${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName}`,
      content: `
      Vous avez manifesté de l’intérêt pour réaliser une immersion professionnelle au sein de l’entreprise ${businessName}.
      Cette entreprise a souhaité être contactée par téléphone. 


      Voici ses coordonnées :

        <ul>
          <li>Personne à contacter : ${contactFirstName} ${contactLastName}</li>
          <li>Numéro de téléphone  :  ${contactPhone}</li>
        </ul>       
      
      
      Ces informations sont personnelles et confidentielles. Elles ne peuvent pas être communiquées à d’autres personnes. 
      Merci !

      ${advices}
      `,
    }),
  },
  CONTACT_IN_PERSON_INSTRUCTIONS: {
    subject: () =>
      "Immersion Facilitée : coordonnées de l'entreprise pour faire votre demande d'immersion",
    niceName: "CONTACT_IN_PERSON_INSTRUCTIONS",
    createEmailVariables: ({
      potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName,
      contactFirstName,
      contactLastName,
      businessAddress,
      businessName,
    }) => ({
      greetings: `Bonjour ${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName},`,
      content: `

    Vous avez manifesté de l’intérêt pour réaliser une immersion professionnelle au sein de l’entreprise ${businessName}.

    Cette entreprise souhaite que vous vous rendiez sur place pour présenter votre demande. 


    Voici les coordonnées :
      <ul>
        <li>Personne à contacter : <strong>${contactFirstName} ${contactLastName}</strong></li>
        <li>Adresse de l'entreprise : <strong>${businessAddress}</strong></li>
      </ul>
    `,
      highlight:
        "Ces informations sont personnelles et confidentielles. Elles ne peuvent pas être communiquées à d’autres personnes. ",
      subContent: defaultSignature,
    }),
  },
  SHARE_DRAFT_CONVENTION_BY_LINK: {
    subject: () =>
      "Immersion Facilitée : Une demande de convention préremplie vous est transmise pour que vous la complétiez",
    niceName: "SHARE_DRAFT_CONVENTION_BY_LINK",
    createEmailVariables: ({ additionalDetails, conventionFormUrl }) => ({
      greetings: "Bonjour,",
      content: `
        <strong>Une demande de convention d'immersion doit être complétée :</strong>

        ${additionalDetails}
      `,
      button: {
        label: "Compléter la demande",
        url: conventionFormUrl,
      },
      subContent: defaultSignature,
    }),
  },
  SUGGEST_EDIT_FORM_ESTABLISHMENT: {
    subject: () => "TODO",
    niceName: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  EDIT_FORM_ESTABLISHMENT_LINK: {
    subject: () =>
      "Immersion Facilitée : Modification de la fiche de votre entreprise",
    niceName: "EDIT_FORM_ESTABLISHMENT_LINK",
    createEmailVariables: ({ editFrontUrl }) => ({
      greetings: "Bonjour,",
      content: `
      Vous avez demandé à modifier les informations concernant votre entreprise. 

      Vous pouvez ajouter ou supprimer des métiers, modifier l'adresse de l'entreprise,  les coordonnées du référent “Immersion” dans votre entreprise ou le mode de contact souhaité…  
      `,
      button: {
        label: "Modifier ma fiche entreprise",
        url: editFrontUrl,
      },
      highlight: `Si vous n'êtes pas à l'origine de cette demande, nous vous recommandons de nous contacter rapidement par mail : contact@immersion-facile.beta.gouv.fr.`,
      subContent: defaultSignature,
    }),
  },
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: {
    subject: ({ businessName }) =>
      `Confirmation de création de votre établissement ${businessName} pour accueillir des immersions`,
    niceName: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
    createEmailVariables: ({
      businessName,
      contactFirstName,
      contactLastName,
    }) => ({
      greetings: "Bonjour,",
      content: `
      <strong>Félicitations !</strong>

 

      Vous venez d'enregistrer votre établissement ${businessName} pour accueillir des immersions professionnelles.
      

      ${contactFirstName} ${contactLastName} recevra bien les demandes d'immersion.

      

      Pour ces demandes, il n'est pas utile de demander un CV. Il s'agit seulement de passer quelques jours ensemble pour une découverte réciproque. 

      

      Si vous avez des projets de recrutement et si, grâce à une immersion, vous retenez un profil qui vous convient, un conseiller emploi vous proposera, si nécessaire,  un plan de formation sur mesure. 

      

      Merci d'avoir rejoint la communauté des “entreprises s'engagent” et de contribuer ainsi à l'accès à l'emploi de tous les publics.
      `,
      subContent: defaultSignature,
    }),
  },
  CREATE_IMMERSION_ASSESSMENT: {
    subject: () => "Immersion Facilitée : Comment s'est déroulée l'immersion ?",
    niceName: "CREATE_IMMERSION_ASSESSMENT",
    createEmailVariables: ({
      establishmentTutorName,
      beneficiaryFirstName,
      beneficiaryLastName,
      immersionAssessmentCreationLink,
    }) => ({
      content: `
      Bonjour ${establishmentTutorName},

 

      L'immersion  professionnelle de {{params.BENEFICIARY_FIRST_NAME}} {{params.BENEFICIARY_LAST_NAME}} au sein de votre entreprise est en passe de s'achever. 


      Nous vous remercions de votre accueil. 


      Pouvez-nous indiquer si cette immersion s'est bien déroulée jusqu'à sa date de fin prévue ?  

      Pour cela, 
      `,
      button: {
        label: "Evaluer cette immersion",
        url: immersionAssessmentCreationLink,
      },
      subContent: `
      Cette information est importante pour la suite de son parcours professionnel.
 

      N'oubliez pas non plus de compléter avec ${beneficiaryFirstName} ${beneficiaryLastName} le <a href="https://immersion.cellar-c2.services.clever-cloud.com/0a57f38d-1dbe-4eb4-8835-9b8fc48a13d8.pdf">bilan de l'immersion en PDF</a>. 
     

      Merci  !
      
      
      ${defaultSignature}
      `,
    }),
  },
  FULL_PREVIEW_EMAIL: {
    subject: () => "Test contenant toutes les blocs email",
    niceName: "Preview email complet (tous les blocs)",
    createEmailVariables: ({ beneficiaryName }) => ({
      greetings: `Bonjour ${beneficiaryName}`,
      content: `Merci d'avoir confirmé votre demande d'immersion. Elle va être transmise à votre conseiller référent.
      
      Il vous informera par mail de la validation ou non de l'immersion. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.`,
      legals: `<strong>Obligations des parties :</strong>
      Le bénéficiaire s’engage à exercer les activités et tâches telles que définies dans la présente convention et à mettre en œuvre l’ensemble des actions lui permettant d’atteindre les objectifs d’insertion socioprofessionnelle attendus, et notamment :
      • Respecter le règlement intérieur de la structure d’accueil et les consignes qui lui sont données et informer le conseiller référent de tout retard ou absence en fournissant les documents justificatifs requis ;
      • Se conformer à l’ensemble des dispositions et mesures en matière d’hygiène et de sécurité applicables aux salariés dans la structure d’accueil, notamment en matière de port obligatoire des EPI et propres aux activités et tâches confiées ;
      • Informer le conseiller référent de tout incident et/ou accident ;
      • Informer le conseiller référent et/ou la personne responsable de son accueil et de son suivi des difficultés qu’il pourrait rencontrer dans la mise en œuvre de cette période ; • Auto évaluer l’apport de la période de mise en situation en milieu professionnel dans la construction de son parcours d’insertion socioprofessionnelle.
      La structure d’accueil s’engage à prendre l’ensemble des dispositions nécessaires en vue de permettre au bénéficiaire d’exercer les activités et tâches telles que définies dans la présente conven- tion, à l’accompagner afin de lui permettre d’atteindre les objectifs d’insertion socioprofessionnelle attendus, et notamment à :
      • Désigner une personne chargée d’accueillir, d’aider, d’informer, de guider et d’évaluer le bénéficiaire pendant la période de mise en situation en milieu professionnel ;
      • Ne pas faire exécuter au bénéficiaire une tâche régulière correspondant à un poste de travail permanent, à un accroissement temporaire d’activité, à un emploi saisonnier ou au remplacement d’un salarié en cas d’absence ou de suspension de son contrat de travail ;
      • S’assurer que la mise en situation en milieu professionnel respecte les règles applicables à ses salariés pour ce qui a trait aux durées quotidienne et hebdomadaire de présence, à la présence de nuit, au repos quotidien, hebdomadaire et aux jours fériés ;
      • Etre couvert par une assurance Multirisque Professionnelle en cours de validité tant à l’encontre de tiers que sur des biens de la structure d’accueil. ;
      • Mettre en œuvre toutes les dispositions nécessaires en vue de se conformer aux articles R.4141-3-1 et suivants du code du travail en matière d’information des salariés sur les règles d’hygiène et de sécurité applicables dans son établissement et fournir l’ensemble des EPI nécessaires ;
      • Prévenir dès connaissance des faits, et au plus tard dans les 24 heures, la structure d’accompagnement de tout accident survenant soit au cours ou sur le lieu de la mise en situation en milieu professionnel, soit au cours du trajet domicile-structure d’accueil ;
      • Donner accès aux moyens de transport et installations collectifs ;
      • Libérer, à la demande de la structure d’accompagnement, le bénéficiaire chaque fois que cela s’avère nécessaire.
      La structure d’accompagnement s’engage, en la personne du conseiller référent, à assurer la mise en œuvre de la période de mise en situation en milieu professionnel et notamment à :
      • Assurer l’accompagnement dans la structure d’accueil du bénéficiaire au travers de visites et d’entretiens sous toute forme ;
      • Intervenir, à la demande de la structure d’accueil et/ou du bénéficiaire pour régler toute difficulté pouvant survenir pendant la période de mise en situation en milieu professionnel ;
      • Informer sans délai l’organisme prescripteur ou, si le bénéficiaire est salarié, l’employeur de ce dernier, de tout accident survenant au cours ou sur le lieu de la mise en situation en milieu professionnel ou de trajet qui lui serait signalé dans le cadre de cette période ;
      • Réaliser le bilan / évaluation de la mise en situation réalisée, transmis, le cas échéant, à l’organisme prescripteur L’organisme prescripteur s’engage, à :
      • Analyser la pertinence de la période de mise en situation en milieu professionnel proposée et d’en définir des objectifs adaptés aux besoins, possibilités et capacités tant du bénéficiaire que de la structure d’accueil ;
      • Procéder à la déclaration dans les 48 heures de tout accident de travail ou de trajet qui lui serait signalé auprès de la Caisse Primaire d’Assurance Maladie du lieu de résidence du béné- ficiaire dès lors qu’il couvre le risque AT/MP.`,
      button: {
        label: "Label de bouton",
        url: "http://www.example.com",
      },
      subContent: `Il vous informera par mail de la validation ou non de l'immersion. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.
      
      Bonne journée,
      L'équipe Immersion Facilitée
      `,
      highlight:
        "Attention, ne démarrez pas cette immersion tant que vous n'avez pas reçu cette validation !",
    }),
  },
};
