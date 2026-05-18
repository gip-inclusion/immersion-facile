{{
  config(
    materialized='table',
    schema='analytics',
    post_hook=[
      "CREATE INDEX IF NOT EXISTS idx_naf_nomenclature_naf_code ON {{ this }} (naf_code)",
      "CREATE INDEX IF NOT EXISTS idx_naf_nomenclature_naf_label ON {{ this }} (naf_label)",
      "CREATE INDEX IF NOT EXISTS idx_naf_nomenclature_section_label ON {{ this }} (naf_section_label)"
    ]
  )
}}

select
    nullif(trim(nsc.naf_code), '') as naf_code,
    nullif(trim(nsc.code), '') as naf_code_with_dot,
    nsc.libelle as naf_label,
    nullif(trim(nn.code_section), '') as naf_section_code,
    ns.libelle as naf_section_label
from {{ source('immersion', 'public_naf_rev2_sous_classes') }} as nsc
left join {{ source('immersion', 'public_naf_rev2_niveaux') }} as nn
    on trim(nn.code_sous_classe) = trim(nsc.code)
left join {{ source('immersion', 'public_naf_rev2_sections') }} as ns
    on trim(ns.code) = trim(nn.code_section)
