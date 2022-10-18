export const renderHighlight = (
  content: string | undefined,
): string | undefined =>
  content &&
  `<table style="margin-top: 20px; margin-bottom: 20px;">
    <tr>
      <td align="center" width="4" style="background-color: #6A6AF4;">
      </td>
      <td width="25">
      </td>
      <td>
       <p style="color: #000093; font-weight: bold;">
        ${content}
       </p>
      </td>
    </tr>
  </table>`;
