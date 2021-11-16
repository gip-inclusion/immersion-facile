INSERT INTO public.agencies (
  id,
  name,
  counsellor_emails,
  validator_emails,
  admin_emails,
  questionnaire_url,
  email_signature
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Test Agency 1 (db)',
  '["counsellor@agency1.fr"]',
  '["validator@agency1.fr"]',
  '["admin@agency1.fr"]',
  'http://questionnaire.agency1.fr',
  'Signature of Test Agency 1'
),
(
  '22222222-2222-2222-2222-222222222222',
  'Test Agency 2 (db)',
  '["counsellor1@agency2.fr", "counsellor2@agency2.fr"]',
  '["validator1@agency2.fr", "validator2@agency2.fr"]',
  '["admin1@agency2.fr", "admin2@agency2.fr"]',
  'http://questionnaire.agency2.fr',
  'Signature of Test Agency 2'
),
(
  '33333333-3333-3333-3333-333333333333',
  'Test Agency 3 (db)',
  '[]',
  '["validator@agency3.fr"]',
  '["admin@agency3.fr"]',
  'http://questionnaire.agency3.fr',
  'Signature of Test Agency 3'
);
