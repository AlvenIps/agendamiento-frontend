const APP_SCOPES = [
  'openid',
  'profile',
  'data.write'
];

// Exportamos el Client ID y los scopes ya formateados en un string
export const CLIENT_ID = 'vue-app-client';
export const SCOPES_STRING = APP_SCOPES.join(' ');
