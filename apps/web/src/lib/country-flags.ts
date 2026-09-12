const FLAGS: Record<string, { iso: string }> = {
  México: { iso: 'mx' },
  Sudáfrica: { iso: 'za' },
  'República de Corea': { iso: 'kr' },
  'República Checa': { iso: 'cz' },
  Canadá: { iso: 'ca' },
  'Bosnia y Herzegovina': { iso: 'ba' },
  Catar: { iso: 'qa' },
  Suiza: { iso: 'ch' },
  Brasil: { iso: 'br' },
  Marruecos: { iso: 'ma' },
  Haití: { iso: 'ht' },
  Escocia: { iso: 'gb-sct' },
  'Estados Unidos': { iso: 'us' },
  Paraguay: { iso: 'py' },
  Australia: { iso: 'au' },
  Turquía: { iso: 'tr' },
  Alemania: { iso: 'de' },
  Curazao: { iso: 'cw' },
  'Costa de Marfil': { iso: 'ci' },
  Ecuador: { iso: 'ec' },
  'Países Bajos': { iso: 'nl' },
  Japón: { iso: 'jp' },
  Suecia: { iso: 'se' },
  Túnez: { iso: 'tn' },
  Bélgica: { iso: 'be' },
  Egipto: { iso: 'eg' },
  'RI de Irán': { iso: 'ir' },
  'Nueva Zelanda': { iso: 'nz' },
  España: { iso: 'es' },
  'Cabo Verde': { iso: 'cv' },
  'Arabia Saudí': { iso: 'sa' },
  Uruguay: { iso: 'uy' },
  Francia: { iso: 'fr' },
  Senegal: { iso: 'sn' },
  Irak: { iso: 'iq' },
  Noruega: { iso: 'no' },
  Argentina: { iso: 'ar' },
  Argelia: { iso: 'dz' },
  Austria: { iso: 'at' },
  Jordania: { iso: 'jo' },
  Portugal: { iso: 'pt' },
  'RD de Congo': { iso: 'cd' },
  Uzbekistán: { iso: 'uz' },
  Colombia: { iso: 'co' },
  Inglaterra: { iso: 'gb-eng' },
  Croacia: { iso: 'hr' },
  Ghana: { iso: 'gh' },
  Panamá: { iso: 'pa' },
};

export function countryIsoCode(name: string | undefined | null): string {
  if (!name) return '';
  return FLAGS[name]?.iso || '';
}

export function countryTranslationKey(name: string | undefined | null): string {
  if (!name) return '';
  const iso = countryIsoCode(name);
  return iso ? `countries.${iso}` : '';
}

export function countryDisplayName(name: string | undefined | null, t: (key: string) => string): string {
  if (!name) return '';
  const key = countryTranslationKey(name);
  if (!key) return name;
  const translated = t(key);
  return translated === key ? name : translated;
}
