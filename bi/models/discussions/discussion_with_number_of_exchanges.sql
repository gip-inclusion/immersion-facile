{{
  config(
    materialized='table',
    schema='analytics',
    post_hook=[
      "CREATE INDEX IF NOT EXISTS idx_discussions_id ON {{ this }} (id)",
      "CREATE INDEX IF NOT EXISTS idx_discussions_siret ON {{ this }} (siret)",
      "CREATE INDEX IF NOT EXISTS idx_discussions_status ON {{ this }} (status)",
      "CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON {{ this }} (created_at)",
      "CREATE INDEX IF NOT EXISTS idx_discussions_convention_id ON {{ this }} (convention_id)"
    ]
  )
}}

with exchange_counts as (
  select
    discussion_id,
    count(*) as number_of_exchanges
  from {{ source('immersion', 'exchanges') }}
  group by discussion_id
)

select
  d.*,
  pad.libelle_appellation_long as appellation_label,
  prd.code_rome as rome_code,
  prd.libelle_rome as rome_label,
  coalesce(ec.number_of_exchanges, 0) as number_of_exchanges
from {{ source('immersion', 'discussions') }} d
left join exchange_counts ec
  on d.id = ec.discussion_id
inner join {{ source('immersion', 'public_appellations_data') }} as pad
    on pad.ogr_appellation = d.appellation_code
inner join {{ source('immersion', 'public_romes_data') }} as prd
    on pad.code_rome::bpchar = prd.code_rome
