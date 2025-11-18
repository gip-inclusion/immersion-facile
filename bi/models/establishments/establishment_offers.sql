{{
  config(
    materialized='table',
    schema='analytics'
  )
}}

select
    offers.siret,
    offers.appellation_code,
    offers.created_at,
    offers.update_date,
    appellations.code_rome,
    appellations.libelle_appellation_long as appellation_label,
    appellations.libelle_appellation_court as appellation_label_short,
    rome.libelle_rome as rome_label
from {{ source('immersion', 'immersion_offers') }} as offers
left join {{ source('immersion', 'public_appellations_data') }} as appellations
    on offers.appellation_code = appellations.ogr_appellation
left join {{ source('immersion', 'public_romes_data') }} as rome
    on appellations.code_rome = rome.code_rome
