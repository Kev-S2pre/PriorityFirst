/**
 * PriorityFirst (PF) — Verified institution lookup (Philippines only)
 * - Schools: the official CHED masterlist of higher education institutions, bundled with the app
 * - Companies, government agencies, organizations: Wikidata (the open database behind
 *   Wikipedia), limited to entries located in the Philippines
 * Profiles can only hold institutions picked from these sources.
 */

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

// ---- Schools: official CHED list ----

let chedPromise = null;
const normalize = (text) => String(text || '').toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// Loaded on first use so it doesn't slow down the app's start
function loadChedSchools() {
  if (!chedPromise) {
    chedPromise = import('../data/chedInstitutions.json').then(module => {
      const data = module.default || module;
      return data.institutions.map(([id, name, type, city, province]) => ({
        id,
        name,
        type,
        location: [city, province].filter(Boolean).join(', '),
        searchWords: normalize(`${name} ${acronyms(name).join(' ')} ${city} ${province}`).split(' '),
        nameWords: normalize(`${name} ${acronyms(name).join(' ')}`).split(' '),
        nameText: normalize(name)
      }));
    });
  }
  return chedPromise;
}

// Initials people search by: "Polytechnic University of the Philippines" -> "pup" (and "puotp"),
// "University of Santo Tomas" -> "ust", "De La Salle University" -> "dlsu"
const MINOR_WORDS = new Set(['of', 'the', 'and', 'in', 'for', 'at', 'ng']);

// Well-known nicknames that aren't plain initials
const NICKNAMES = [
  [/^Bulacan State University/i, 'bulsu'],
  [/^Cavite State University/i, 'cvsu'],
  [/^Batangas State University/i, 'batstateu batsu'],
  [/^Pangasinan State University/i, 'psu'],
  [/^Isabela State University/i, 'isu'],
  [/^Mindanao State University/i, 'msu'],
  [/^Pamantasan ng Lungsod ng Maynila/i, 'plm'],
  [/^Pamantasan ng Lungsod ng Marikina/i, 'plmar'],
  [/^Philippine Normal University/i, 'pnu'],
  [/^Nueva Ecija University of Science and Technology/i, 'neust'],
  [/^University of Southeastern Philippines/i, 'usep'],
  [/^Rizal Technological University/i, 'rtu'],
  [/^National University/i, 'nu'],
  [/^Ateneo de Manila University/i, 'admu ateneo'],
  [/^De La Salle/i, 'dlsu lasalle'],
  [/^University of the East/i, 'ue'],
  [/^Lyceum of the Philippines University/i, 'lpu'],
  [/^AMA Computer/i, 'ama'],
  [/^Asia Pacific College/i, 'apc']
];

function acronyms(name) {
  const mainName = name.split(/\s*[-–—,(]\s*/)[0];
  const words = normalize(mainName).split(' ').filter(Boolean);
  const nicknames = NICKNAMES.filter(([pattern]) => pattern.test(name)).flatMap(([, nick]) => nick.split(' '));
  if (words.length < 2) return nicknames;
  const all = words.map(w => w[0]).join('');
  const major = words.filter(w => !MINOR_WORDS.has(w)).map(w => w[0]).join('');
  return [...new Set([all, major, ...nicknames])].filter(a => a.length >= 2);
}

async function searchSchools(term) {
  const words = normalize(term).split(' ').filter(Boolean);
  if (words.length === 0) return [];
  const schools = await loadChedSchools();
  const phrase = words.join(' ');
  return schools
    // Every typed word must start one of the school's words (so "sti" doesn't match "Christian")
    .filter(s => words.every(w => s.searchWords.some(sw => sw.startsWith(w))))
    .map(s => ({
      school: s,
      // Rank: name starts with the query, then initials/nickname or name matches, then city/province matches
      rank: s.nameText.startsWith(phrase) ? 0
        : s.nameWords.includes(words[0]) ? 1
        : words.every(w => s.nameWords.some(nw => nw.startsWith(w))) ? 2
        : 3
    }))
    .sort((a, b) => a.rank - b.rank || a.school.name.localeCompare(b.school.name))
    .slice(0, 20)
    .map(({ school }) => ({ id: school.id, name: school.name, type: school.type, location: school.location }));
}

/**
 * Confirms a saved school still matches the official list (used before saving a profile)
 */
export async function isOfficialSchool(id, name) {
  const schools = await loadChedSchools();
  return schools.some(s => s.id === id && s.name === name);
}

// ---- Companies / government / organizations: Wikidata ----

// Institutions are recorded under thousands of Wikidata types (schools, hospitals, agencies,
// NGOs, companies, churches, clubs…), so instead of listing allowed types we exclude the
// kinds of entries that can never be an institution.
const EXCLUDED_CLASSES = [
  'Q5',          // human
  'Q16521',      // taxon (species)
  'Q13442814',   // scholarly article
  'Q4167410',    // disambiguation page
  'Q4167836',    // Wikimedia category
  'Q11266439',   // Wikimedia template
  'Q13406463',   // Wikimedia list article
  'Q101352',     // family name
  'Q202444',     // given name
  'Q11424',      // film
  'Q5398426',    // television series
  'Q7725634',    // literary work
  'Q571',        // book
  'Q482994',     // album
  'Q7366',       // song
  'Q134556',     // single
  'Q105543609',  // musical work
  'Q6256',       // country
  'Q515',        // city
  'Q1549591',    // big city
  'Q3957',       // town
  'Q532',        // village
  'Q486972',     // human settlement
  'Q15284',      // municipality
  'Q24764',      // municipality of the Philippines
  'Q104157',     // city of the Philippines
  'Q61878',      // barangay
  'Q24746',      // province of the Philippines
  'Q4022',       // river
  'Q8502',       // mountain
  'Q23442',      // island
  'Q1656682',    // event
  'Q1266946',    // thesis
  'Q1907875',    // master's thesis
  'Q187685',     // doctoral thesis
  'Q737498',     // academic journal
  'Q5633421',    // scientific journal
  'Q1002697',    // periodical
  'Q41298',      // magazine
  'Q125191',     // photograph
  'Q3305213',    // painting
  'Q18593264',   // item of collection or exhibition
  'Q732577',     // publication
  'Q17537576'    // creative work
];

const PHILIPPINES = 'Q928';
// Only entries whose country (P17) is the Philippines, minus non-institution types
const SEARCH_FILTER = `haswbstatement:P17=${PHILIPPINES} -haswbstatement:${EXCLUDED_CLASSES.map(id => `P31=${id}`).join('|')}`;

// Sorts results into the chosen institution type by their Wikidata type and description
// (Wikidata records institutions under thousands of types, so a fixed type list misses many)
const TYPE_KEYWORDS = {
  company: /\b(company|corporation|corp|business|enterprise|conglomerate|bank|banking|chain|airline|carrier|manufacturer|retailer|brand|firm|subsidiary|holding|telecom\w*|network|broadcaster|publisher|developer|operator|provider|outsourcing|BPO|franchise|cooperative|insurer|insurance|utility|hospital)\b/i,
  government: /\b(government|agency|department|ministry|authority|bureau|commission|office|council|court|congress|senate|house of representatives|armed forces|police|navy|army|air force|coast guard|administration|board|government-owned|GOCC|division|executive)\b/i,
  organization: /\b(organi[sz]ation|association|society|foundation|non-?profit|NGO|charity|church|diocese|archdiocese|parish|religious|club|team|league|union|federation|party|movement|cooperative|alliance|network|red cross|youth|fraternity|sorority|choir|orchestra|hospital|council)\b/i
};

const matchesInstitutionType = (result, institutionType) =>
  (TYPE_KEYWORDS[institutionType] || TYPE_KEYWORDS.organization).test(`${result.type} ${result.description}`);
const LABEL_LANGUAGES = 'en|fil|tl|ceb|es|mul';
const cache = new Map();

// CHED school IDs look like "CHED-0105518000-sti-college-dagupan"; others are Wikidata IDs like "Q6714927"
export function isVerifiedInstitutionId(id) {
  return typeof id === 'string' && (/^Q\d+$/.test(id) || /^CHED-[a-z0-9-]+$/.test(id));
}

async function wikidataGet(params, signal) {
  const response = await fetch(`${WIKIDATA_API}?${new URLSearchParams({ ...params, format: 'json', origin: '*' })}`, { signal });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    // Wikidata answers rate-limited requests with plain text
    throw new Error(/too many requests/i.test(text)
      ? 'Too many searches at once. Wait a few seconds and try again.'
      : 'Institution search is unavailable right now.');
  }
  if (!response.ok || data.error) throw new Error('Institution search is unavailable right now.');
  return data;
}

// Prefer English, then Filipino/Tagalog, then any other language Wikidata returned
const LANGUAGE_PRIORITY = ['en', 'fil', 'tl', 'mul', 'ceb', 'es'];
const firstValue = (terms) => {
  if (!terms) return '';
  // With language fallback, terms.en may actually hold another language: check its real language
  const values = Object.values(terms).filter(t => t?.value);
  for (const lang of LANGUAGE_PRIORITY) {
    const match = values.find(t => (t.language || '') === lang);
    if (match) return match.value;
  }
  return values[0]?.value || '';
};
const claimIds = (entity, property) =>
  (entity.claims?.[property] || []).map(c => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');

/**
 * Returns up to 10 Philippine institutions:
 * [{ id, name, type, location, description }] — type and location come from Wikidata's
 * structured data so every result reads the same way, e.g. "Private university · Quezon City".
 */
export async function searchInstitutions(query, institutionType, signal) {
  const term = (query || '').trim();
  if (institutionType === 'school') {
    return term.length >= 2 ? searchSchools(term) : [];
  }
  if (term.length < 3) return [];
  const key = `${institutionType}:${term.toLowerCase()}`;
  if (cache.has(key)) return cache.get(key);

  // 1. Find matching Philippine entries
  const search = await wikidataGet({
    action: 'query',
    list: 'search',
    srsearch: `${term} ${SEARCH_FILTER}`,
    srlimit: '15',
    srprop: ''
  }, signal);
  const ids = (search.query?.search || []).map(s => s.title).filter(isVerifiedInstitutionId);
  if (ids.length === 0) {
    cache.set(key, []);
    return [];
  }

  // 2. Names, descriptions, type (P31) and location (P131) of each match
  const details = await wikidataGet({
    action: 'wbgetentities',
    ids: ids.join('|'),
    props: 'labels|descriptions|claims',
    languages: LABEL_LANGUAGES,
    languagefallback: '1'
  }, signal);

  const found = ids.map(id => {
    const entity = details.entities?.[id] || {};
    return {
      id,
      name: firstValue(entity.labels),
      description: firstValue(entity.descriptions),
      typeId: claimIds(entity, 'P31')[0] || '',
      locationId: claimIds(entity, 'P131')[0] || ''
    };
  }).filter(r => r.name && looksLikeInstitution(r.description));

  // 3. Readable names for those types and locations
  const refIds = [...new Set(found.flatMap(r => [r.typeId, r.locationId]).filter(Boolean))];
  let refNames = {};
  if (refIds.length > 0) {
    try {
      const refs = await wikidataGet({
        action: 'wbgetentities',
        ids: refIds.slice(0, 50).join('|'),
        props: 'labels',
        languages: LABEL_LANGUAGES,
        languagefallback: '1'
      }, signal);
      refNames = Object.fromEntries(Object.entries(refs.entities || {}).map(([id, e]) => [id, firstValue(e.labels)]));
    } catch (err) {
      if (err.name === 'AbortError') throw err;
    }
  }

  const results = found
    .map(r => ({
      id: r.id,
      name: r.name,
      type: capitalize(refNames[r.typeId] || ''),
      location: refNames[r.locationId] || 'Philippines',
      description: r.description
    }))
    .filter(r => looksLikeInstitution(r.type) && !ALWAYS_EXCLUDED_WORDS.test(r.name) && matchesInstitutionType(r, institutionType))
    .slice(0, 10);

  cache.set(key, results);
  return results;
}

// Second check on the description, for places and objects the type filter can't list exhaustively
const INSTITUTION_WORDS = /\b(school|academy|college|universit\w*|institut\w*|educat\w*|seminary|campus|faculty|department|ministry|agency|authority|bureau|office|commission|council|government|company|corporation|business|enterprise|firm|bank|group|organi[sz]ation|association|society|foundation|charity|federation|union|club|team|league|party|church|parish|diocese|hospital|clinic|medical|center|centre|laboratory|library|museum|cooperative|NGO|non-profit|nonprofit|military|army|navy|police)\b/i;
const PLACE_OR_OBJECT_WORDS = /\b(city|town|village|municipality|county|region|province|state of|metropolitan area|district|neighbo[u]?rhood|barangay|street|road|avenue|square|park|plaza|landscape|statue|monument|sculpture|bridge|river|lake|mountain|island|beach|airport|station|ship|aircraft|vehicle|car model|species|genus|marker|plaque|memorial|disambiguation|Wikimedia|farm|bay|harbou?r|reserve|forest|cave|valley|volcano|lighthouse|tomb|grave|rail\w*|light rail|transit|metro line|expressway|highway|tollway|port|dam)\b/i;

// Never an institution, even when the text also names one (e.g. "…Commission… historical marker")
const ALWAYS_EXCLUDED_WORDS = /\b(marker|plaque|statue|monument|memorial|sculpture|disambiguation|Wikimedia|tomb|grave|aspect of history|history of|list of|timeline of|seal of|logo of|flag of)\b/i;

function looksLikeInstitution(text) {
  if (!text) return true;
  if (ALWAYS_EXCLUDED_WORDS.test(text)) return false;
  if (INSTITUTION_WORDS.test(text)) return true;
  return !PLACE_OR_OBJECT_WORDS.test(text);
}
