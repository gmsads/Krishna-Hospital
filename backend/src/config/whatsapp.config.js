export const WHATSAPP_CONFIG = {
  ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  APP_SECRET: process.env.WHATSAPP_APP_SECRET || '',
  VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'krishna_hospital_whatsapp_verify_token_2026',
  BASE_URL: 'https://graph.facebook.com/v22.0',
  API_VERSION: 'v22.0',
  DEFAULT_TEMPLATE: process.env.WHATSAPP_DEFAULT_TEMPLATE || 'hello_world',
  REENGAGEMENT_TEMPLATE: process.env.WHATSAPP_REENGAGEMENT_TEMPLATE || '',
  DEFAULT_COUNTRY_CODE: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '91',
  WABA_ID: process.env.WHATSAPP_WABA_ID || '',
};
