// index.js
import 'dotenv/config';

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const ENDPOINT     = 'https://graphigo.prd.galaxy.eco/query';

if (!ACCESS_TOKEN) {
  throw new Error('🚨 Missing ACCESS_TOKEN in .env');
}

// Query GraphQL untuk trending boosts (alias trending quests)
const QUERY = `
  query GetTrendingBoosts($first: Int!, $after: String, $sortBy: BoostOrderBy!) {
    boosts(first: $first, after: $after, sortBy: $sortBy) {
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

async function fetchTrendingBoosts(first = 20, after = null) {
  const variables = {
    first,
    after,
    sortBy: "TRENDING"   // enum BoostOrderBy
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': ACCESS_TOKEN
    },
    body: JSON.stringify({ query: QUERY, variables })
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

  return data.boosts;
}

(async () => {
  try {
    let { edges, pageInfo } = await fetchTrendingBoosts(20, null);

    edges.forEach(({ node }) =>
      console.log(`• ${node.title} [${node.id}] (Space: ${node.space.name})`)
    );

    while (pageInfo.hasNextPage) {
      ({ edges, pageInfo } = await fetchTrendingBoosts(20, pageInfo.endCursor));
      edges.forEach(({ node }) =>
        console.log(`• ${node.title} [${node.id}] (Space: ${node.space.name})`)
      );
    }
  } catch (err) {
    console.error(err);
  }
})();
