Cette ADR a pour but de décrire l'organisation des fichiers dans le projet que l'on se fixe au 27/02/2024.

```
|-- back
	|-- src
		|-- config
			|-- db
			|   |-- migrations
			|   |-- static-data
			|   |-- kysely-utils            
		|-- domains
			|-- core
			|	|-- event-bus
			|	|	|-- adapters
			|	|	|-- ports
			|	|	|-- domain
			|	|	|-- events
			|	|-- time-gateway
			|		|-- adapters
			|			|-- CustomTimeGateway.ts
			|			|-- RealTimeGateway.ts
			|		|-- ports
			|			|-- TimeGateway.ts
			|-- convention
			|   |-- adapters
			|   |-- ports
			|   |-- domain
			|   	|-- helpers
			|   	|-- use-cases
			|   		|-- AddConvention.ts
			|   		|-- AddConvention.unit.test.ts	
			|-- establishment
			|	|-- adapters
			|	|-- domain
			|-- agency
			|	|-- adapters
			|	|-- domain
			|-- delegation
				|-- adapters
				|-- domain
```

Cette arbo nous parait bien mais il faut tester en vrai pour constater quelles sont les problèmes que l'on rencontre.

Nous allons partir sur une convention de nommage des dossiers en kebab-case.

Apprové à l'unanimité (4 votants) le 27/02/2024 (absence de Benjamin).
