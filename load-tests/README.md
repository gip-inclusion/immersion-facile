# Load tests

Ce package contient les scripts de tests de charge.

## Prérequis local

Le binaire `k6` doit être installé sur la machine pour lancer les scripts en local.

Documentation officielle d'installation : https://grafana.com/docs/k6/latest/set-up/install-k6/

## Commandes

```bash
pnpm --dir load-tests k6:ramping-arrival
```

Pour générer un dashboard HTML local :

```bash
pnpm --dir load-tests k6:ramping-arrival:dashboard
```

Les tests de charge peuvent aussi être lancés depuis GitHub Actions via le workflow `Load tests`.
