// index.js
import fetch from 'node-fetch';
import 'dotenv/config'; // ini akan otomatis load .env

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const ENDPOINT     = 'https://api.galxe.com/graphql';

if (!ACCESS_TOKEN) {
  throw new Error('Missing ACCESS_TOKEN in .env');
}

async function fetchTrendingQuests(first = 20, after = null) {
  const query = `
    query TrendingQuests($first: Int!, $after: String, $orderBy: QuestOrderBy!) {
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

  const variables = {
    first,
    after,
    orderBy: "TRENDING"
  };

  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'access-token':  ACCESS_TOKEN,
    },
    body:    JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  const { data, errors } = await res.json();
  if (errors) {
    console.error('GraphQL errors', errors);
    throw new Error('FetchTrendingQuests error');
  }
  return data.quests;
}

(async () => {
  try {
    let { edges, pageInfo } = await fetchTrendingQuests();
    edges.forEach(({ node }) => {
      console.log(`• ${node.title} [${node.id}] (${node.space.name})`);
    });

    while (pageInfo.hasNextPage) {
      ({ edges, pageInfo } = await fetchTrendingQuests(20, pageInfo.endCursor));
      edges.forEach(({ node }) => {
        console.log(`• ${node.title} [${node.id}] (${node.space.name})`);
      });
    }
  } catch (err) {
    console.error(err);
  }
})();
