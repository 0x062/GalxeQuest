// index.js
import 'dotenv/config';    // load .env
// built-in fetch di Node 18+

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const ENDPOINT = 'https://graphigo.prd.galaxy.eco/query';

if (!ACCESS_TOKEN) {
  throw new Error('Missing ACCESS_TOKEN in .env');
}

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

async function fetchTrendingQuests(first = 20, after = null) {
  const variables = { first, after, orderBy: "TRENDING" };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': ACCESS_TOKEN,
    },
    body: JSON.stringify({ query: QUERY, variables }),
  });

  if (res.status === 404) {
    throw new Error(`Endpoint not found (404). Cek URL: ${ENDPOINT}`);
  }
  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`);
  }
  const { data, errors } = await res.json();
  if (errors) {
    console.error('GraphQL errors:', errors);
    throw new Error('Failed fetching quests');
  }
  return data.quests;
}

(async () => {
  try {
    let { edges, pageInfo } = await fetchTrendingQuests();
    edges.forEach(({ node }) =>
      console.log(`• ${node.title} [${node.id}] (${node.space.name})`)
    );

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
