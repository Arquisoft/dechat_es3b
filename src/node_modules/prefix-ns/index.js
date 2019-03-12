/**
 * Created by pheyvaer on 18.04.17.
 */

let data = require('./data.json')["@context"];

function getPrefixes(){
  return Object.keys(data);
}

function asMap() {
  return data;
}

function getNamespaceViaPrefix(prefix) {
  return data[prefix];
}

function getPrefixViaNamespace(namespace) {
  let prefixes = Object.keys(data);
  let i = 0;

  while (i < prefixes.length && data[prefixes[i]] !== namespace) {
    i ++;
  }

  if (i < prefixes.length) {
    return prefixes[i];
  } else {
    return null;
  }
}

module.exports = {
  getPrefixes: getPrefixes,
  getNamespaceViaPrefix: getNamespaceViaPrefix,
  getPrefixViaNamespace: getPrefixViaNamespace,
  asMap: asMap
};