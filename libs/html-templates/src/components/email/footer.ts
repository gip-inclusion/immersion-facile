export const renderFooter = (customFooter: (() => string) | undefined) =>
  customFooter ? customFooter() : defaultImmersionFooter();

const defaultImmersionFooter = () => `<table>
  <tr>
    <td height="30"></td>
  </tr>
  <tr>
    <td width="600" style="background-color: #F5F5FE; text-align: center; padding: 20px 50px; ">
      <p style="font-size: 14px;">Vous recevez cet email, car cette adresse email a été renseigné dans une demande de convention sur le site Immersion Facilitée. Si vous rencontrez un problème, la plupart des solutions sont disponibles sur notre <a href="https://aide.immersion-facile.beta.gouv.fr/fr/">centre d'aide</a>. Vous y trouverez également un formulaire de contact pour joindre notre équipe support, qui vous répondra sous les meilleurs délais.</p>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding: 20px;">
      <img src="https://immersion.cellar-c2.services.clever-cloud.com/email_footer.png" alt=""/>
    </td>
  </tr>
</table>`;

export const cciCustomHtmlFooter = () => `<table>
  <tr>
    <td height="30"></td>
  </tr>
  <tr>
    <td width="600" style="background-color: #F5F5FE; text-align: center; padding: 20px 50px; ">
      <p style="font-size: 14px;">Vous recevez cet email, car cette adresse email a été renseigné dans une demande de convention sur le site Immersion Facilitée. Si vous rencontrez un problème, la plupart des solutions sont disponibles sur notre <a href="https://aide.immersion-facile.beta.gouv.fr/fr/">centre d'aide</a>. Vous y trouverez également un formulaire de contact pour joindre notre équipe support, qui vous répondra sous les meilleurs délais.</p>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding: 20px;">
      <img src="https://immersion.cellar-c2.services.clever-cloud.com/logo-cci-blanc.png" alt="Chambre de Commerce et d'Industrie"/>
    </td>
  </tr>
</table>`;
