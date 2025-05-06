// index.js
import 'dotenv/config';

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const ENDPOINT     = 'https://graphigo.prd.galaxy.eco/query';

if (!ACCESS_TOKEN) {
  throw new Error('🚨 Missing ACCESS_TOKEN in .env');
}

// 1) Introspection query untuk dapatkan semua query & enums
const INTROSPECTION_QUERY = `
  query Introspection {
    __schema {
      queryType { name }
      types {
        name
        kind
        fields {
          name
        }
        enumValues { name }
      }
    }
  }
`;

async function introspectSchema() {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': ACCESS_TOKEN
    },
    body: JSON.stringify({ query: INTROSPECTION_QUERY })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Introspection HTTP ${res.status} – ${txt}`);
  }
  const { data, errors } = await res.json();
  if (errors) throw new Error(`Introspection errors:\n${errors.map(e=>e.message).join('\n')}`);
  return data.__schema.types;
}

(async () => {
  try {
    console.log('🔍 Performing schema introspection...');
    const types = await introspectSchema();

    // Cari type Query
    const queryType = types.find(t => t.name === 'Query' && t.kind === 'OBJECT');
    console.log('\nAvailable root queries:');
    queryType.fields.forEach(f => console.log(`  • ${f.name}`));

    // Cari enum yang mengandung 'TREND' (misal QuestSort, SortOrder, dll)
    console.log('\nAvailable enums containing "TREND":');
    types
      .filter(t => t.kind === 'ENUM' && t.enumValues.some(ev => ev.name.includes('TREND')))
      .forEach(e => {
        console.log(`\nEnum ${e.name}:`);
        e.enumValues.forEach(ev => console.log(`  - ${ev.name}`));
      });

    console.log('\n\n🔧 Dari sini, pilih field & enum yang sesuai untuk query trending quests.');
    console.log('— Misalnya mungkin ada field `boosts` dengan argumen `sortBy: BOOST_TRENDING`');
    console.log('— Atau `questsV2(sort: TRENDING, first: Int)`');
    console.log('\nSetelah itu, sesuaikan query Anda seperti contoh di dokumentasi.');
  } catch (err) {
    console.error(err);
  }
})();
