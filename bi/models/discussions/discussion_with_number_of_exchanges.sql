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
  d.id,
  d.siret::text as siret,
  d.contact_method,
  d.kind,
  d.created_at,
  d.updated_at,
  d.potential_beneficiary_first_name,
  d.potential_beneficiary_last_name,
  d.potential_beneficiary_email,
  d.potential_beneficiary_phone_id,
  pn.phone_number as potential_beneficiary_phone,
  d.potential_beneficiary_resume_link,
  d.potential_beneficiary_experience_additional_information,
  d.potential_beneficiary_date_preferences,
  d.potential_beneficiary_level_of_education,
  d.appellation_code,
  d.immersion_objective,
  d.street_number_and_address,
  d.postcode,
  d.department_code,
  d.city,
  d.business_name,
  d.convention_id,
  d.status,
  d.rejection_kind,
  d.rejection_reason,
  d.candidate_warned_method,
  d.acquisition_campaign,
  d.acquisition_keyword,
  pad.libelle_appellation_long as appellation_label,
  prd.code_rome as rome_code,
  prd.libelle_rome as rome_label,
  coalesce(ec.number_of_exchanges, 0) as number_of_exchanges
from {{ source('immersion', 'discussions') }} d
left join exchange_counts ec
  on d.id = ec.discussion_id
left join {{ source('immersion', 'phone_numbers') }} as pn
  on pn.id = d.potential_beneficiary_phone_id
inner join {{ source('immersion', 'public_appellations_data') }} as pad
    on pad.ogr_appellation = d.appellation_code
inner join {{ source('immersion', 'public_romes_data') }} as prd
    on pad.code_rome::bpchar = prd.code_rome