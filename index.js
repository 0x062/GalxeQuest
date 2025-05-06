// inspect-boost.js
import 'dotenv/config';

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const ENDPOINT     = 'https://graphigo.prd.galaxy.eco/query';

if (!ACCESS_TOKEN) {
  throw new Error('Missing ACCESS_TOKEN in .env');
}

// Query introspeksi untuk type Boost
const INTROSPECT_BOOST = `
  query IntrospectBoost {
    __type(name: "Boost") {
      name
      kind
      description
      fields {
        name
        type {
          name
          kind
          ofType { name kind }
        }
      }
    }
  }
`;

async function introspectBoost() {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': ACCESS_TOKEN
    },
    body: JSON.stringify({ query: INTROSPECT_BOOST })
  });
  const { data, errors } = await res.json();
  if (errors) throw new Error(`Introspection errors:\n${errors.map(e=>e.message).join('\n')}`);
  return data.__type;
}

(async () => {
  try {
    const boostType = await introspectBoost();
    console.log(`Type: ${boostType.name} (${boostType.kind})`);
    console.log('\nAvailable fields on Boost:');
    boostType.fields.forEach(f => {
      // tampilkan field dan tipe dasarnya
      const t = f.type.name || (f.type.ofType && f.type.ofType.name) || f.type.kind;
      console.log(` • ${f.name}: ${t}`);
    });
  } catch (err) {
    console.error(err);
  }
})();
