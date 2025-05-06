// index.js
import 'dotenv/config'; // load .env ke process.env

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const ENDPOINT     = 'https://graphigo.prd.galaxy.eco/query';

if (!ACCESS_TOKEN) {
  throw new Error('🚨 Missing ACCESS_TOKEN in .env');
}

// Query GraphQL untuk trending quests
const QUERY = `
  query TrendingQuests($first: Int!, $after: String, $orderBy: QuestOrderBy!) {
    quests(first: $first, after: $after, orderBy: $orderBy) {
      edges {
        node {
          id
          title
          description
          startTime
          endTime
          space { id name }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

/**
 * Fetch trending quests dengan error handling detail
 * @param {number} first  — jumlah item per page
 * @param {string|null} after — cursor untuk pagination
 * @returns {Promise<{ edges: Array, pageInfo: Object }>}
 */
async function fetchTrendingQuests(first = 20, after = null) {
  const variables = { first, after, orderBy: "TRENDING" };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'access-token':  ACCESS_TOKEN,
    },
    body: JSON.stringify({ query: QUERY, variables }),
  });

  // Baca response sebagai text dulu
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`🚨 HTTP ${res.status} – Response not JSON:\n${text}`);
  }

  // Jika status bukan OK, tampilkan error GraphQL
  if (!res.ok) {
    const errors = body.errors
      ? body.errors.map(e => e.message || JSON.stringify(e)).join('\n')
      : JSON.stringify(body);
    throw new Error(`🚨 HTTP ${res.status} – GraphQL error:\n${errors}`);
  }

  return body.data.quests;
}

(async () => {
  try {
    let { edges, pageInfo } = await fetchTrendingQuests();
    edges.forEach(({ node }) =>
      console.log(`• ${node.title} [${node.id}] (${node.space.name})`)
    );

    // Ambil halaman selanjutnya jika ada
    while (pageInfo.hasNextPage) {
      ({ edges, pageInfo } = await fetchTrendingQuests(20, pageInfo.endCursor));
      edges.forEach(({ node }) =>
        console.log(`• ${node.title} [${node.id}] (${node.space.name})`)
      );
    }
  } catch (err) {
    console.error(err.message);
  }
})();
