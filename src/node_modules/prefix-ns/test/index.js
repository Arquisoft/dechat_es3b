/**
 * Created by pheyvaer on 18.04.17.
 */

let assert = require('chai').assert;
let prefix = require('../index.js');

describe('index', function () {
  it('getPrefixes', function () {
    let prefixes = prefix.getPrefixes();

    assert.notEqual(prefixes.indexOf('rml'), -1);
    assert.notEqual(prefixes.indexOf('rr'), -1);
    assert.equal(prefixes.indexOf('foafoaf'), -1);
  });

  it('getNamespaceViaPrefix', function () {
    assert.equal(prefix.getNamespaceViaPrefix('rml'), 'http://semweb.mmlab.be/ns/rml#');
    assert.equal(prefix.getNamespaceViaPrefix('rr'), 'http://www.w3.org/ns/r2rml#');
    assert.equal(prefix.getNamespaceViaPrefix('foaf'), 'http://xmlns.com/foaf/0.1/');
    assert.equal(prefix.getNamespaceViaPrefix('nothingistobefound_____________'), null);
  });

  it('getPrefixViaNamespace', function () {
    assert.equal(prefix.getPrefixViaNamespace('http://semweb.mmlab.be/ns/rml#'), 'rml');
    assert.equal(prefix.getPrefixViaNamespace('http://www.w3.org/ns/r2rml#'), 'rr');
    assert.equal(prefix.getPrefixViaNamespace('http://xmlns.com/foaf/0.1/'), 'foaf');
    assert.equal(prefix.getPrefixViaNamespace('http://ffrdasfkd;ljfadlskfjad;lkfjadlkjkjfdkfjdlkfjdlkfjdflkdjflkdjfld'), null);
  });

  it('asMap', function () {
    let prefixes = prefix.asMap();

    assert.equal(prefixes.rml, 'http://semweb.mmlab.be/ns/rml#');
    assert.equal(prefixes.rr, 'http://www.w3.org/ns/r2rml#');
    assert.equal(prefixes.foafoaf, null);
  });
});