// inspect-boostitem.js
import 'dotenv/config';

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const ENDPOINT     = 'https://graphigo.prd.galaxy.eco/query';

if (!ACCESS_TOKEN) {
  throw new Error('Missing ACCESS_TOKEN in .env');
}

const INTROSPECT_BOOSTITEM = `
  query IntrospectBoostItem {
    __type(name: "BoostItem") {
      name
      kind
      fields {
        name
        type {
          kind
          name
          ofType { kind name }
        }
      }
    }
  }
`;

async function introspectBoostItem() {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': ACCESS_TOKEN
    },
    body: JSON.stringify({ query: INTROSPECT_BOOSTITEM })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { data, errors } = await res.json();
  if (errors) throw new Error(`Errors:\n${errors.map(e=>e.message).join('\n')}`);
  return data.__type.fields;
}

(async () => {
  try {
    const fields = await introspectBoostItem();
    console.log('Fields on BoostItem:');
    fields.forEach(f => {
      const t = f.type.name || (f.type.ofType && f.type.ofType.name) || f.type.kind;
      console.log(` • ${f.name}: ${t}`);
    });
  } catch (err) {
    console.error(err);
  }
})();
