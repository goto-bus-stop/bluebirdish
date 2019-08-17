'use strict'
const tape = require('tape')
const Promise = require('../')

tape('Promise.getNewLibraryCopy', function (t) {
  t.test('should return an independent copy of Bluebird library', function (t) {
    const Promise2 = Promise.getNewLibraryCopy()
    Promise2.x = 123

    t.equal(typeof Promise2.prototype.then, 'function')
    t.notEqual(Promise2, Promise)

    t.equal(Promise2.x, 123)
    t.notEqual(Promise.x, 123)
    t.end()
  })

  t.test('should return copy of Bluebird library with its own getNewLibraryCopy method', function (t) {
    const Promise2 = Promise.getNewLibraryCopy()
    const Promise3 = Promise2.getNewLibraryCopy()
    Promise3.x = 123

    t.equal(typeof Promise3.prototype.then, 'function')
    t.notEqual(Promise3, Promise)
    t.notEqual(Promise3, Promise2)

    t.equal(Promise3.x, 123)
    t.notEqual(Promise.x, 123)
    t.notEqual(Promise2.x, 123)
    t.end()
  })
})
