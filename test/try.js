'use strict'
const tape = require('tape')
const Promise = require('../')

const error = new Error()
function thrower () { throw error }

tape('Promise.attempt', (t) => {
  t.test('should reject when the function throws', (t) => {
    var async = false
    Promise.try(thrower).then(t.fail, (e) => {
      t.ok(async)
      t.ok(e === error)
      t.end()
    })
    async = true
  })

  t.test('should reject when the function is not a function', (t) => {
    var async = false
    Promise.try(null).then(t.fail, (e) => {
      t.ok(async)
      t.ok(e instanceof Promise.TypeError)
      t.end()
    })
    async = true
  })

  t.test('should unwrap returned promise', (t) => {
    const d = Promise.defer()

    const ret = Promise.try(() => d.promise).then((v) => {
      t.ok(v === 3)
    })

    setTimeout(() => {
      d.fulfill(3)
    }, 1)
    return ret
  })
  t.test('should unwrap returned thenable', (t) => {
    return Promise.try(() => ({
      then (f) { f(3) }
    })).then((v) => {
      t.ok(v === 3)
    })
  })
})
