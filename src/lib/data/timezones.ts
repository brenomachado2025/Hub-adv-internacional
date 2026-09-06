// Lista curada de fusos horários IANA relevantes para negócios internacionais,
// com país (ISO 3166 alpha-2) associado para cruzar com a API de feriados.

export type TimezoneOption = {
  tz: string;
  label: string;
  countryCode: string;
};

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { tz: "America/New_York", label: "Nova York (EUA, ET)", countryCode: "US" },
  { tz: "America/Chicago", label: "Chicago (EUA, CT)", countryCode: "US" },
  { tz: "America/Denver", label: "Denver (EUA, MT)", countryCode: "US" },
  { tz: "America/Los_Angeles", label: "Los Angeles (EUA, PT)", countryCode: "US" },
  { tz: "America/Anchorage", label: "Anchorage (EUA, AK)", countryCode: "US" },
  { tz: "Pacific/Honolulu", label: "Honolulu (EUA, HI)", countryCode: "US" },
  { tz: "America/Toronto", label: "Toronto (Canadá)", countryCode: "CA" },
  { tz: "America/Vancouver", label: "Vancouver (Canadá)", countryCode: "CA" },
  { tz: "America/Mexico_City", label: "Cidade do México", countryCode: "MX" },
  { tz: "America/Sao_Paulo", label: "São Paulo (Brasil)", countryCode: "BR" },
  { tz: "America/Bogota", label: "Bogotá (Colômbia)", countryCode: "CO" },
  { tz: "America/Argentina/Buenos_Aires", label: "Buenos Aires (Argentina)", countryCode: "AR" },
  { tz: "Europe/London", label: "Londres (Reino Unido)", countryCode: "GB" },
  { tz: "Europe/Lisbon", label: "Lisboa (Portugal)", countryCode: "PT" },
  { tz: "Europe/Madrid", label: "Madri (Espanha)", countryCode: "ES" },
  { tz: "Europe/Paris", label: "Paris (França)", countryCode: "FR" },
  { tz: "Europe/Berlin", label: "Berlim (Alemanha)", countryCode: "DE" },
  { tz: "Europe/Zurich", label: "Zurique (Suíça)", countryCode: "CH" },
  { tz: "Europe/Moscow", label: "Moscou (Rússia)", countryCode: "RU" },
  { tz: "Africa/Johannesburg", label: "Joanesburgo (África do Sul)", countryCode: "ZA" },
  { tz: "Asia/Dubai", label: "Dubai (Emirados Árabes)", countryCode: "AE" },
  { tz: "Asia/Kolkata", label: "Mumbai/Nova Deli (Índia)", countryCode: "IN" },
  { tz: "Asia/Shanghai", label: "Xangai (China)", countryCode: "CN" },
  { tz: "Asia/Singapore", label: "Singapura", countryCode: "SG" },
  { tz: "Asia/Tokyo", label: "Tóquio (Japão)", countryCode: "JP" },
  { tz: "Asia/Hong_Kong", label: "Hong Kong", countryCode: "HK" },
  { tz: "Australia/Sydney", label: "Sydney (Austrália)", countryCode: "AU" },
];
