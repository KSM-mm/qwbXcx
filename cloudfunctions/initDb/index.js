const cloud = require('wx-server-sdk');
const collections = require('./collections');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function isAlreadyExists(error) {
  const message = (error && (error.message || error.errMsg || String(error))) || '';
  return /already exists|existed|ResourceExist|duplicate/i.test(message);
}

async function ensureCollection(name) {
  try {
    await db.createCollection(name);
    return { name, created: true };
  } catch (error) {
    if (isAlreadyExists(error)) {
      return { name, created: false, existed: true };
    }
    throw error;
  }
}

async function createIndex(collectionName, index) {
  const payload = {
    name: index.name,
    keys: index.keys,
    unique: !!index.unique,
  };
  const col = db.collection(collectionName);
  if (typeof col.createIndex === 'function') {
    return col.createIndex(payload);
  }
  if (typeof db.createIndex === 'function') {
    return db.createIndex({ collectionName, ...payload });
  }
  const error = new Error('createIndex not supported; create in cloud console');
  error.code = 'INDEX_API_UNSUPPORTED';
  error.index = payload;
  throw error;
}

async function ensureIndex(collectionName, index) {
  try {
    await createIndex(collectionName, index);
    return { collection: collectionName, name: index.name, created: true, unique: !!index.unique, keys: index.keys };
  } catch (error) {
    if (isAlreadyExists(error)) {
      return {
        collection: collectionName,
        name: index.name,
        created: false,
        existed: true,
        unique: !!index.unique,
        keys: index.keys,
      };
    }
    return {
      collection: collectionName,
      name: index.name,
      created: false,
      unique: !!index.unique,
      keys: index.keys,
      error: error.code || '',
      message: error.message || error.errMsg || String(error),
    };
  }
}

exports.main = async () => {
  const collectionResults = [];
  const indexResults = [];

  for (let i = 0; i < collections.length; i += 1) {
    const spec = collections[i];
    try {
      const result = await ensureCollection(spec.name);
      collectionResults.push({ ...result, ok: true, fieldCount: Object.keys(spec.fields).length });
    } catch (error) {
      collectionResults.push({
        name: spec.name,
        ok: false,
        message: error.message || error.errMsg || String(error),
      });
    }
  }

  for (let i = 0; i < collections.length; i += 1) {
    const spec = collections[i];
    for (let j = 0; j < spec.indexes.length; j += 1) {
      indexResults.push(await ensureIndex(spec.name, spec.indexes[j]));
    }
  }

  return {
    code: 200,
    success: collectionResults.every((item) => item.ok),
    collections: collectionResults,
    indexes: indexResults,
    catalog: collections,
  };
};
