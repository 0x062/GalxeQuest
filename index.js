// index.js
import 'dotenv/config';  // load .env

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const ENDPOINT     = 'https://graphigo.prd.galaxy.eco/query';

if (!ACCESS_TOKEN) {
  throw new Error('🚨 Missing ACCESS_TOKEN in .env');
}

// Query GraphQL untuk trending quests
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
          space { id name }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

/**
 * Fetch trending quests dengan pagination
 */
async function fetchTrendingQuests(first = 20, after = null) {
  const variables = { first, after, orderBy: "TRENDING" };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': ACCESS_TOKEN
    },
    body: JSON.stringify({ query: QUERY, variables })
  });

  // Baca body text untuk debug jika error
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} – ${text || res.statusText}`);
  }

  const { data, errors } = JSON.parse(text);
  if (errors) {
    const msgs = errors.map(e => e.message).join('\n');
    throw new Error(`GraphQL errors:\n${msgs}`);
  }
  return data.quests;
}

(async () => {
  try {
    // Page pertama
    let { edges, pageInfo } = await fetchTrendingQuests(20, null);
    edges.forEach(({ node }) =>
      console.log(`• ${node.title} [${node.id}] (Space: ${node.space.name})`)
    );

    // Pagination
    while (pageInfo.hasNextPage) {
      ({ edges, pageInfo } = await fetchTrendingQuests(20, pageInfo.endCursor));
      edges.forEach(({ node }) =>
        console.log(`• ${node.title} [${node.id}] (Space: ${node.space.name})`)
      );
    }
  } catch (err) {
    console.error(err);
  }
})();
