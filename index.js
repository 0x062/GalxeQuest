// index.js
import 'dotenv/config';  // load .env ke process.env

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const ENDPOINT     = 'https://quest-api.galxe.com/graphql';

if (!ACCESS_TOKEN) {
  throw new Error('🚨 Missing ACCESS_TOKEN in .env');
}

/**
 * GraphQL query untuk trending quests.
 * Sesuai dokumentasi: https://docs.galxe.com/quest/graphql-api/overview/endpoint-and-queries
 */
const QUERY = `
  query GetTrendingQuests($first: Int!, $after: String, $orderBy: QuestOrderBy!) {
    quests(first: $first, after: $after, orderBy: $orderBy) {
      edges {
        node {
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
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/**
 * Fetch trending quests dengan pagination.
 *
 * @param {number} first  — jumlah item per page
 * @param {string|null} after — cursor untuk pagination
 * @returns {Promise<{ edges: Array, pageInfo: Object }>}
 */
async function fetchTrendingQuests(first = 20, after = null) {
  const variables = {
    first,
    after,
    orderBy: "TRENDING"   // enum QuestOrderBy: TRENDING
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': ACCESS_TOKEN
    },
    body: JSON.stringify({ query: QUERY, variables })
  });

  // Kalau gagal HTTP
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} – ${text || res.statusText}`);
  }

  const { data, errors } = await res.json();
  if (errors) {
    // Gabungkan pesan error jika ada
    const msgs = errors.map(e => e.message).join('\n');
    throw new Error(`GraphQL errors:\n${msgs}`);
  }

  return data.quests;
}

(async () => {
  try {
    // Ambil halaman pertama
    let { edges, pageInfo } = await fetchTrendingQuests(20, null);

    // Cetak hasil page pertama
    edges.forEach(({ node }) => {
      console.log(`• ${node.title} [${node.id}] (Space: ${node.space.name})`);
    });

    // Loop pagination
    while (pageInfo.hasNextPage) {
      ({ edges, pageInfo } = await fetchTrendingQuests(20, pageInfo.endCursor));
      edges.forEach(({ node }) => {
        console.log(`• ${node.title} [${node.id}] (Space: ${node.space.name})`);
      });
    }
  } catch (err) {
    console.error(err);
  }
})();
