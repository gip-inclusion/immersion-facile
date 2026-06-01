---
name: context-github
description: Contexte GitHub Immersion Facilitée — repo gip-inclusion, board tickets, epics, conventions branches et PRs. Use when working on issues, PRs, or GitHub workflows for immersion-facile.
---

# Context GitHub

Invoquer avec `@context-github`. Skill local : `.cursor/skills/context-github/`.

## Liens

| Ressource | URL |
|-----------|-----|
| **Repo** | https://github.com/gip-inclusion/immersion-facile |
| **Issues** | https://github.com/gip-inclusion/immersion-facile/issues |
| **Board tickets** | https://github.com/orgs/gip-inclusion/projects/10 |
| **Board epics** | https://github.com/orgs/gip-inclusion/projects/13 |

**Organisation :** `gip-inclusion`  

## Conventions GitHub

- Branche : `{numero-issue}-kebab-case`
- Titre PR : `#ID - Message clair en français` (`#ID - Tech -` si sans impact utilisateur)
- Body PR : `Fixes #ID` + `.github/PULL_REQUEST_TEMPLATE.md`
- Issue en **RfR** sur le [board tickets](https://github.com/orgs/gip-inclusion/projects/10) avant merge

```bash
git checkout -b {numero-issue}-description
git push -u origin HEAD
gh pr create --draft --base main --assignee @me --title "#ID - ..." --body "Fixes #ID\n\n..."
```
