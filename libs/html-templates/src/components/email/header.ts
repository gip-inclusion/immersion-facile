export const renderHeader = (agencyLogoUrl: string | undefined): string => {
  let html = `
    <table width="600">
      <tr>
        <td width="35%">
          <a href="https://immersion-facile.beta.gouv.fr/">
            <img src="https://immersion.cellar-c2.services.clever-cloud.com/ac685d94-401a-4f93-b288-1100a8d96297.png" width="223" height="108" alt="Immersion Facilitée - République Française"/>
          </a>
        </td>`;
  if (agencyLogoUrl && agencyLogoUrl !== "") {
    html += `
      <td width="60%" align="right">
        <img src="${agencyLogoUrl}" alt="" style="max-width: 150px; max-height: 120px; height: auto; margin-left: 20px;"/>
      </td>
    `;
  } else {
    html += `
      <td width="40%">
      <div style="margin-left: 20px;">
      <p style="color: #161616; font-weight: bold; font-size: 20px; margin: 0">Immersion Facilitée</p>
      <p style="color: #3A3A3A; font-size: 14px; margin: 0">Faciliter la réalisation des immersions professionnelles</p>
      </div>
        
      </td>
    `;
  }
  html += `
      </tr>
      <tr>
        <td width="600" height="10" colspan="2"></td>
      </tr>
      <tr>
        <td width="600" height="1" style="background-color:#DDDDDD" colspan="2"></td>
      </tr>
      <tr>
        <td width="600" height="30" colspan="2"></td>
      </tr>
    </table>`;
  return html;
};
