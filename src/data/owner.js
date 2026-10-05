/*
 * Provider details for the Impressum (§ 5 DDG) and the privacy policy.
 *
 * They must be the real name and a postal address where the operator can be
 * served – a P.O. box is not enough. The production deploy refuses to run
 * while any value still contains a [PLACEHOLDER] (scripts/check-legal.mjs).
 * Kept free of browser code so that check can import it in Node.
 */
export const OWNER = {
  name: '[AD SOYAD / FİRMA]',
  street: '[SOKAK NO]',
  city: '[PLZ] Berlin',
  phone: '[TELEFON]',
  email: 'berlinkonusuyor@outlook.de',
  // Person responsible for journalistic content (§ 18 Abs. 2 MStV).
  editor: '[AD SOYAD]',
};
