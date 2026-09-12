export type TeamKitColors = {
  primary: string;
  secondary: string;
};

const TEAM_KITS: Record<string, TeamKitColors> = {
  México: { primary: '#0b6b3a', secondary: '#b51f2e' },
  Sudáfrica: { primary: '#f5cf24', secondary: '#168447' },
  'República de Corea': { primary: '#e62943', secondary: '#111827' },
  'República Checa': { primary: '#d91f32', secondary: '#174b91' },
  Canadá: { primary: '#d71920', secondary: '#ffffff' },
  'Bosnia y Herzegovina': { primary: '#1e4f9a', secondary: '#f4d125' },
  Catar: { primary: '#7b1734', secondary: '#ffffff' },
  Suiza: { primary: '#d71920', secondary: '#ffffff' },
  Brasil: { primary: '#f7d117', secondary: '#17863c' },
  Marruecos: { primary: '#c91f32', secondary: '#168447' },
  Haití: { primary: '#154da1', secondary: '#d91f32' },
  Escocia: { primary: '#172f5f', secondary: '#ffffff' },
  'Estados Unidos': { primary: '#f7f7f4', secondary: '#1d315d' },
  Paraguay: { primary: '#d72835', secondary: '#ffffff' },
  Australia: { primary: '#f6cc20', secondary: '#174c36' },
  Turquía: { primary: '#c81d32', secondary: '#ffffff' },
  Alemania: { primary: '#f7f7f4', secondary: '#171717' },
  Curazao: { primary: '#1463b8', secondary: '#f2d126' },
  'Costa de Marfil': { primary: '#e77724', secondary: '#168447' },
  Ecuador: { primary: '#f5cf24', secondary: '#173f91' },
  'Países Bajos': { primary: '#ef6b24', secondary: '#171717' },
  Japón: { primary: '#173f91', secondary: '#ffffff' },
  Suecia: { primary: '#f5cf24', secondary: '#1764a5' },
  Túnez: { primary: '#f7f7f4', secondary: '#d71920' },
  Bélgica: { primary: '#b7192c', secondary: '#171717' },
  Egipto: { primary: '#d71920', secondary: '#171717' },
  'RI de Irán': { primary: '#f7f7f4', secondary: '#168447' },
  'Nueva Zelanda': { primary: '#171717', secondary: '#ffffff' },
  España: { primary: '#c8192d', secondary: '#f2c318' },
  'Cabo Verde': { primary: '#174c9a', secondary: '#d71920' },
  'Arabia Saudí': { primary: '#168447', secondary: '#ffffff' },
  Uruguay: { primary: '#72b9e6', secondary: '#171717' },
  Francia: { primary: '#182f65', secondary: '#d71920' },
  Senegal: { primary: '#f7f7f4', secondary: '#168447' },
  Irak: { primary: '#168447', secondary: '#ffffff' },
  Noruega: { primary: '#c91f32', secondary: '#172f5f' },
  Argentina: { primary: '#75b9df', secondary: '#ffffff' },
  Argelia: { primary: '#f7f7f4', secondary: '#168447' },
  Austria: { primary: '#d71920', secondary: '#ffffff' },
  Jordania: { primary: '#f7f7f4', secondary: '#c91f32' },
  Portugal: { primary: '#b7192c', secondary: '#176b3a' },
  'RD de Congo': { primary: '#1764a5', secondary: '#d71920' },
  Uzbekistán: { primary: '#f7f7f4', secondary: '#1764a5' },
  Colombia: { primary: '#f5cf24', secondary: '#172f5f' },
  Inglaterra: { primary: '#f7f7f4', secondary: '#172f5f' },
  Croacia: { primary: '#f7f7f4', secondary: '#d71920' },
  Ghana: { primary: '#f7f7f4', secondary: '#171717' },
  Panamá: { primary: '#d71920', secondary: '#ffffff' },
};

const FALLBACK_KIT: TeamKitColors = {
  primary: '#64748b',
  secondary: '#e2e8f0',
};

export function teamKitColors(teamName: string): TeamKitColors {
  return TEAM_KITS[teamName] ?? FALLBACK_KIT;
}
