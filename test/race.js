const tape = require('tape')
const Promise = require('../')

tape('Promise.race', function (t) {
  t.test('remains forever pending when passed an empty array', function (t) {
    const p = Promise.race([])
    let isPending = true
    p.finally(() => { isPending = false })
    return Promise.delay(1).then(function () {
      t.ok(isPending)
    })
  })

  t.test('remains forever pending when passed an empty sparse array', function (t) {
    const p = Promise.race([,,,,, ]) // eslint-disable-line no-sparse-arrays, standard/array-bracket-even-spacing
    let isPending = true
    p.finally(() => { isPending = false })
    return Promise.delay(1).then(function () {
      t.ok(isPending)
    })
  })

  t.test('fulfills when passed an immediate value', function (t) {
    return Promise.race([1, 2, 3]).then(function (v) {
      t.deepEqual(v, 1)
    })
  })

  t.test('fulfills when passed an immediately fulfilled value', function (t) {
    const d1 = Promise.defer()
    d1.fulfill(1)
    const p1 = d1.promise

    const d2 = Promise.defer()
    d2.fulfill(2)
    const p2 = d2.promise

    const d3 = Promise.defer()
    d3.fulfill(3)
    const p3 = d3.promise

    return Promise.race([p1, p2, p3]).then(function (v) {
      t.deepEqual(v, 1)
    })
  })

  t.test('fulfills when passed an eventually fulfilled value', function (t) {
    const d1 = Promise.defer()
    const p1 = d1.promise

    const d2 = Promise.defer()
    const p2 = d2.promise

    const d3 = Promise.defer()
    const p3 = d3.promise

    setTimeout(function () {
      d1.fulfill(1)
      d2.fulfill(2)
      d3.fulfill(3)
    }, 1)

    return Promise.race([p1, p2, p3]).then(function (v) {
      t.deepEqual(v, 1)
    })
  })

  t.test('rejects when passed an immediate value', function (t) {
    return Promise.race([Promise.reject(1), 2, 3]).then(t.fail, function (v) { // eslint-disable-line prefer-promise-reject-errors
      t.deepEqual(v, 1)
    })
  })

  t.test('rejects when passed an immediately rejected value', function (t) {
    const d1 = Promise.defer()
    d1.reject(1)
    const p1 = d1.promise

    const d2 = Promise.defer()
    d2.fulfill(2)
    const p2 = d2.promise

    const d3 = Promise.defer()
    d3.fulfill(3)
    const p3 = d3.promise

    return Promise.race([, p1, , p2, , , p3]).then(t.fail, function (v) { // eslint-disable-line no-sparse-arrays
      t.deepEqual(v, 1)
    })
  })

  t.test('rejects when passed an eventually rejected value', function (t) {
    const d1 = Promise.defer()
    const p1 = d1.promise

    const d2 = Promise.defer()
    const p2 = d2.promise

    const d3 = Promise.defer()
    const p3 = d3.promise

    setTimeout(function () {
      d1.reject(1)
      d2.fulfill(2)
      d3.fulfill(3)
    }, 1)

    return Promise.race([p1, p2, p3]).then(t.fail, function (v) {
      t.deepEqual(v, 1)
    })
  })

  t.test('propagates bound value', { skip: true }, function (t) {
    const o = {}
    return Promise.resolve([1]).bind(o).race().then(function (v) {
      t.ok(v === 1)
      t.ok(this === o)
    })
  })
})
