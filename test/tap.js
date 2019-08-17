'use strict'
const tape = require('tape')
const Promise = require('../')

tape('tap', (t) => {
  t.test('passes through value', (t) => {
    return Promise.resolve('test')
      .tap(() => 3)
      .then((value) => {
        t.equal(value, 'test')
      })
  })

  t.test('passes through value after returned promise is fulfilled', (t) => {
    var async = false
    return Promise.resolve('test').tap(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          async = true
          resolve(3)
        }, 1)
      })
    ).then((value) => {
      t.ok(async)
      t.equal(value, 'test')
    })
  })

  t.test('is not called on rejected promise', (t) => {
    var called = false
    Promise.reject(new Error('test')).tap(() => {
      called = true
    }).then(t.fail, (value) => {
      t.ok(!called)
      t.end()
    })
  })

  t.test('passes immediate rejection', (t) => {
    var err = new Error()
    Promise.resolve('test').tap(() => {
      throw err
    }).tap(t.fail).then(t.fail, (e) => {
      t.equal(err, e)
      t.end()
    })
  })

  t.test('passes eventual rejection', (t) => {
    var err = new Error()
    Promise.resolve('test').tap(() =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(err)
        }, 1)
      })
    ).tap(t.fail).then(t.fail, (e) => {
      t.equal(err, e)
      t.end()
    })
  })

  t.test('passes value', (t) => {
    return Promise.resolve(123).tap((a) => {
      t.equal(a, 123)
    })
  })
})
