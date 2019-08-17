'use strict'
const tape = require('tape')
const Promise = require('../')

const TOKEN = Symbol('token')

/*
Based on When.js tests

Open Source Initiative OSI - The MIT License

http://www.opensource.org/licenses/mit-license.php

Copyright (c) 2011 Brian Cavalier

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */

tape('Promise.any-test', function (t) {
  t.test('should reject on empty input array', function (t) {
    var a = []
    return Promise.any(a)
      .caught(Promise.RangeError, () => TOKEN)
      .then((token) => t.strictEqual(token, TOKEN))
  })

  t.test('should resolve with an input value', function (t) {
    var input = [1, 2, 3]
    return Promise.any(input).then(
      function (result) {
        t.notEqual(input.indexOf(result), -1)
      }, t.fail
    )
  })

  t.test('should resolve with a promised input value', function (t) {
    var input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]
    return Promise.any(input).then(
      function (result) {
        t.notEqual([1, 2, 3].indexOf(result), -1)
      }, t.fail
    )
  })

  t.test('should reject with all rejected input values if all inputs are rejected', function (t) {
    var input = [Promise.reject(1), Promise.reject(2), Promise.reject(3)] // eslint-disable-line prefer-promise-reject-errors
    var promise = Promise.any(input)

    return promise.then(
      t.fail,
      function (result) {
        // Cannot use deep equality in IE8 because non-enumerable properties are not
        // supported
        t.ok(result[0] === 1)
        t.ok(result[1] === 2)
        t.ok(result[2] === 3)
      }
    )
  })

  t.test('should accept a promise for an array', function (t) {
    var expected, input

    expected = [1, 2, 3]
    input = Promise.resolve(expected)

    return Promise.any(input).then(
      function (result) {
        t.notDeepEqual(expected.indexOf(result), -1)
      }, t.fail
    )
  })

  t.test('should allow zero handlers', function (t) {
    var input = [1, 2, 3]
    return Promise.any(input).then(
      function (result) {
        t.notEqual(input.indexOf(result), -1)
      }, t.fail
    )
  })

  t.test('should resolve to empty array when input promise does not resolve to array', function (t) {
    return Promise.any(Promise.resolve(1))
      .caught(TypeError, () => TOKEN)
      .then((token) => t.strictEqual(token, TOKEN))
  })

  t.test('should reject when given immediately rejected promise', function (t) {
    var err = new Error()
    return Promise.any(Promise.reject(err)).then(t.fail, function (e) {
      t.strictEqual(err, e)
    })
  })
})
