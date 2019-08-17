'use strict'
const tape = require('tape')
const Promise = require('../')

const c = {
  val: 3,
  method: function () {
    return [].slice.call(arguments).concat(this.val)
  }
}

tape('call', (t) => {
  t.test('0 args', (t) => {
    return Promise.resolve(c).call('method').then((res) => {
      t.deepEqual([3], res)
    })
  })
  t.test('1 args', (t) => {
    return Promise.resolve(c).call('method', 1).then((res) => {
      t.deepEqual([1, 3], res)
    })
  })
  t.test('2 args', (t) => {
    return Promise.resolve(c).call('method', 1, 2).then((res) => {
      t.deepEqual([1, 2, 3], res)
    })
  })
  t.test('3 args', (t) => {
    return Promise.resolve(c).call('method', 1, 2, 3).then((res) => {
      t.deepEqual([1, 2, 3, 3], res)
    })
  })
  t.test('10 args', (t) => {
    return Promise.resolve(c).call('method', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10).then((res) => {
      t.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 3], res)
    })
  })
  t.test('method not found', (t) => {
    const promises = [
      Promise.resolve([]).call('abc').then(t.fail, (err) => err),
      Promise.resolve([]).call('abc', 1, 2, 3, 4, 5, 6, 7).then(t.fail, (err) => err),
      Promise.resolve([]).call('abc ').then(t.fail, (err) => err),
      Promise.resolve(null).call('abc', 1, 2, 3, 4, 5, 6, 7).then(t.fail, (err) => err),
      Promise.resolve(null).call('abc').then(t.fail, (err) => err),
      Promise.resolve(null).call('abc ').then(t.fail, (err) => err)
    ]

    return Promise.all(promises).then(function (errors) {
      for (let i = 0; i < errors.length; ++i) {
        const message = errors[i].message || errors[i].toString()
        t.ok(message.indexOf('has no method') >= 0)
      }
    })
  })
})
