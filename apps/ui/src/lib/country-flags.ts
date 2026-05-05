const FLAGS: Record<string, string> = {
  'México': '🇲🇽',
  'Sudáfrica': '🇿🇦',
  'República de Corea': '🇰🇷',
  'República Checa': '🇨🇿',
  'Canadá': '🇨🇦',
  'Bosnia y Herzegovina': '🇧🇦',
  'Catar': '🇶🇦',
  'Suiza': '🇨🇭',
  'Brasil': '🇧🇷',
  'Marruecos': '🇲🇦',
  'Haití': '🇭🇹',
  'Escocia': '🏴',
  'Estados Unidos': '🇺🇸',
  'Paraguay': '🇵🇾',
  'Australia': '🇦🇺',
  'Turquía': '🇹🇷',
  'Alemania': '🇩🇪',
  'Curazao': '🇨🇼',
  'Costa de Marfil': '🇨🇮',
  'Ecuador': '🇪🇨',
  'Países Bajos': '🇳🇱',
  'Japón': '🇯🇵',
  'Suecia': '🇸🇪',
  'Túnez': '🇹🇳',
  'Bélgica': '🇧🇪',
  'Egipto': '🇪🇬',
  'RI de Irán': '🇮🇷',
  'Nueva Zelanda': '🇳🇿',
  'España': '🇪🇸',
  'Cabo Verde': '🇨🇻',
  'Arabia Saudí': '🇸🇦',
  'Uruguay': '🇺🇾',
  'Francia': '🇫🇷',
  'Senegal': '🇸🇳',
  'Irak': '🇮🇶',
  'Noruega': '🇳🇴',
  'Argentina': '🇦🇷',
  'Argelia': '🇩🇿',
  'Austria': '🇦🇹',
  'Jordania': '🇯🇴',
  'Portugal': '🇵🇹',
  'RD de Congo': '🇨🇩',
  'Uzbekistán': '🇺🇿',
  'Colombia': '🇨🇴',
  'Inglaterra': '🏴',
  'Croacia': '🇭🇷',
  'Ghana': '🇬🇭',
  'Panamá': '🇵🇦',
};

export function countryFlag(name: string | undefined | null): string {
  if (!name) return '';
  return FLAGS[name] || '';
}

export function countryWithFlag(name: string | undefined | null): string {
  if (!name) return '';
  const flag = countryFlag(name);
  return flag ? `${flag} ${name}` : name;
}
