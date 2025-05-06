// index.js
import 'dotenv/config'; // load .env

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const ENDPOINT     = 'https://graphigo.prd.galaxy.eco/query';

if (!ACCESS_TOKEN) {
  throw new Error('🚨 Missing ACCESS_TOKEN in .env');
}

// Query sederhana: ambil semua boosts (alias trending quests)
const QUERY = `
  query GetAllBoosts {
    boosts {
      id
      title
      description
      startTime
      endTime
      space {
        id
        name
      }
    }
  }
`;

async function fetchAllBoosts() {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'access-token':  ACCESS_TOKEN
    },
    body: JSON.stringify({ query: QUERY })
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} – ${text || res.statusText}`);
  }

  const { data, errors } = JSON.parse(text);
  if (errors) {
    const msgs = errors.map(e => e.message).join('\n');
    throw new Error(`GraphQL errors:\n${msgs}`);
  }

  return data.boosts;  // asumsikan array Boost
}

(async () => {
  try {
    const boosts = await fetchAllBoosts();
    console.log(`Found ${boosts.length} trending quests:\n`);
    boosts.forEach((q, i) => {
      console.log(`${i + 1}. ${q.title} [${q.id}]`);
      console.log(`   Space: ${q.space.name}`);
      console.log(`   Period: ${q.startTime} → ${q.endTime}`);
      console.log(`   Desc: ${q.description}\n`);
    });
  } catch (err) {
    console.error(err);
  }
})();
