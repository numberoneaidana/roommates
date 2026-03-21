// logic/constants.js
// ─────────────────────────────────────────────────────────────
// Static data constants used across the app.
// ─────────────────────────────────────────────────────────────

export const BASE_URL = "https://roommates-production.up.railway.app";

/** All Kazakhstan regions with coordinates */
export const KZ_REGIONS = [
  { id: "almaty_city",   name: "Алматы (город)",                   lat: 43.238, lng: 76.945 },
  { id: "astana",        name: "Астана",                            lat: 51.18,  lng: 71.446 },
  { id: "shymkent",      name: "Шымкент",                           lat: 42.3,   lng: 69.6   },
  { id: "almaty_region", name: "Алматинская область",               lat: 45.0,   lng: 78.0   },
  { id: "akmola",        name: "Акмолинская область",               lat: 51.5,   lng: 70.0   },
  { id: "aktobe",        name: "Актюбинская область",               lat: 50.28,  lng: 57.21  },
  { id: "atyrau",        name: "Атырауская область",                lat: 47.1,   lng: 51.9   },
  { id: "east_kaz",      name: "Восточно-Казахстанская область",    lat: 49.97,  lng: 82.6   },
  { id: "zhambyl",       name: "Жамбылская область",                lat: 42.9,   lng: 71.4   },
  { id: "west_kaz",      name: "Западно-Казахстанская область",     lat: 51.2,   lng: 51.4   },
  { id: "karaganda",     name: "Карагандинская область",            lat: 49.8,   lng: 73.1   },
  { id: "kostanay",      name: "Костанайская область",              lat: 53.2,   lng: 63.6   },
  { id: "kyzylorda",     name: "Кызылординская область",            lat: 44.85,  lng: 65.5   },
  { id: "mangystau",     name: "Мангистауская область",             lat: 43.6,   lng: 51.2   },
  { id: "north_kaz",     name: "Северо-Казахстанская область",      lat: 54.0,   lng: 69.0   },
  { id: "pavlodar",      name: "Павлодарская область",              lat: 52.3,   lng: 76.95  },
  { id: "turkestan",     name: "Туркестанская область",             lat: 41.3,   lng: 68.3   },
  { id: "abai",          name: "Область Абай",                      lat: 50.41,  lng: 80.25  },
  { id: "zhetisu",       name: "Область Жетісу",                    lat: 45.02,  lng: 78.37  },
  { id: "ulytau",        name: "Область Ұлытау",                    lat: 48.3,   lng: 67.5   },
];
