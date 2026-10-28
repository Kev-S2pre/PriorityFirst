/**
 * Builds src/data/chedInstitutions.json — the official CHED masterlist of Philippine
 * higher education institutions, with city/province names attached.
 *
 * Sources (both public):
 *   - CHED HEI masterlist (CC0): https://codeberg.org/villamorrd/ched-hei-dataset
 *     (retrieved from https://ched.gov.ph/list-of-higher-education-institutions-2/)
 *   - PSGC place names: https://psgc.cloud/api/provinces and /api/cities-municipalities
 *
 * Usage:
 *   node scripts/build-ched-data.mjs <ched-hei-dataset/data dir> <provinces.json> <cities-municipalities.json>
 */
import fs from 'node:fs';
import path from 'node:path';

const [dataDir, provincesFile, citiesFile] = process.argv.slice(2);
if (!dataDir || !provincesFile || !citiesFile) {
  console.error('Usage: node scripts/build-ched-data.mjs <dataDir> <provinces.json> <cities-municipalities.json>');
  process.exit(1);
}

const provinces = new Map(JSON.parse(fs.readFileSync(provincesFile, 'utf8')).map(p => [p.code, p.name]));
const cities = new Map(JSON.parse(fs.readFileSync(citiesFile, 'utf8')).map(c => [c.code, c]));

const TYPE_LABELS = {
  SUC: 'State university / college',
  LUC: 'Local university / college',
  Private: 'Private institution',
  OGS: 'Government school'
};

// Negros Island Region (18) was formed in 2024; older PSGC lists still file its
// places under Western (06) and Central (07) Visayas
const codeVariants = (code) => (code && code.startsWith('18')
  ? [code, `06${code.slice(2)}`, `07${code.slice(2)}`]
  : [code]);
const lookup = (map, code) => codeVariants(code).map(c => map.get(c)).find(Boolean);

// Some PSGC names arrive double-encoded ("DasmariÃ±as" -> "Dasmariñas")
const fixEncoding = (text) => (/Ã|Â/.test(text) ? Buffer.from(text, 'latin1').toString('utf8') : text);

// "City of Dagupan" -> "Dagupan City"
function cityName(code) {
  // A few CHED rows hold the town name itself instead of a PSGC code
  const name = /^\d+$/.test(code || '') ? lookup(cities, code)?.name : code;
  if (!name) return '';
  const fixed = fixEncoding(name.trim());
  const match = /^City of (.+)$/i.exec(fixed);
  return clean(match ? `${match[1]} City` : fixed);
}

// The city code holds its province (first 5 digits), which is more reliable than CHED's
// separate province column; independent cities (e.g. Bacolod) fall back to that column
function provinceName(row) {
  const cityCode = String(row.municipalCityCode || '');
  const fromCity = /^\d{10}$/.test(cityCode) ? lookup(provinces, `${cityCode.slice(0, 5)}00000`) : '';
  if (fromCity) return fromCity;
  const code = String(row.provinceCode || '');
  if (code && !/^\d+$/.test(code)) return clean(code); // name written instead of a code
  return lookup(provinces, code) || (String(row.regionCode).startsWith('13') ? 'Metro Manila' : '');
}

const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();
const slug = (text) => clean(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const seen = new Set();
const institutions = [];

for (const region of fs.readdirSync(dataDir).sort()) {
  for (const file of fs.readdirSync(path.join(dataDir, region)).sort()) {
    const rows = JSON.parse(fs.readFileSync(path.join(dataDir, region, file), 'utf8'));
    for (const row of rows) {
      const name = clean(row.institutionName);
      if (!name) continue;
      // Stable ID: PSGC city code + name slug, e.g. "CHED-0105518000-sti-college-dagupan"
      const id = `CHED-${slug(row.municipalCityCode || row.provinceCode || row.regionCode)}-${slug(name)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      institutions.push([
        id,
        name,
        TYPE_LABELS[row.institutionType] || 'Higher education institution',
        cityName(row.municipalCityCode),
        provinceName(row)
      ]);
    }
  }
}

institutions.sort((a, b) => a[1].localeCompare(b[1]));

const output = {
  source: 'CHED masterlist of Higher Education Institutions (ched.gov.ph), retrieved October 2025, CC0',
  fields: ['id', 'name', 'type', 'city', 'province'],
  institutions
};

const outFile = path.resolve('src/data/chedInstitutions.json');
fs.writeFileSync(outFile, JSON.stringify(output));
console.log(`Wrote ${institutions.length} institutions to ${outFile}`);
console.log(`Missing city names: ${institutions.filter(i => !i[3]).length}`);
