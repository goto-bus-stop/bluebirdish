'use strict'
const tape = require('tape')
const Promise = require('../')

tape('indexed getter', function (t) {
  const p = Promise.resolve([0, 1, 2, 3, 4, 5, 7, 5, 10])
  t.test('gets positive index', function (t) {
    const first = p.get(0)
    const fourth = p.get(3)
    const last = p.get(8)

    return Promise.join(first, fourth, last, function (a, b, c) {
      t.ok(a === 0)
      t.ok(b === 3)
      t.ok(c === 10)
    })
  })

  t.test('gets negative index', function (t) {
    const last = p.get(-1)
    const first = p.get(-20)

    return Promise.join(last, first, function (a, b) {
      t.equal(a, 10)
      t.equal(b, 0)
    })
  })
})

tape('identifier getter', function (t) {
  const p = Promise.resolve(new RegExp('', ''))
  t.test('gets property', function (t) {
    const ci = p.get('ignoreCase')
    const g = p.get('global')
    const lastIndex = p.get('lastIndex')
    const multiline = p.get('multiline')

    return Promise.join(ci, g, lastIndex, multiline, function (ci, g, lastIndex, multiline) {
      t.ok(ci === false)
      t.ok(g === false)
      t.ok(lastIndex === 0)
      t.ok(multiline === false)
    })
  })

  t.test('gets same property', function (t) {
    let o = { o: 1 }
    let o2 = { o: 2 }
    o = Promise.resolve(o).get('o')
    o2 = Promise.resolve(o2).get('o')
    return Promise.join(o, o2, function (one, two) {
      t.strictEqual(1, one)
      t.strictEqual(2, two)
    })
  })
})

tape('non identifier getters', function (t) {
  const p = Promise.resolve({ '-': 'val' })
  t.test('get property', function (t) {
    return p.get('-').then(function (val) {
      t.ok(val === 'val')
    })
  })

  t.test('overflow cache', { skip: true }, function (t) {
    const a = new Array(1024)
    const o = {}
    for (let i = 0; i < a.length; ++i) {
      a[i] = 'get' + i
      o['get' + i] = i * 2
    }
    const b = Promise.map(a, function (item, index) {
      return Promise.resolve(o).get(a[index])
    }).filter(function (value, index) {
      return value === index * 2
    }).then(function (values) {
      t.strictEqual(values.length, a.length)
    })
    return b
  })
})
