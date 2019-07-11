const tape = require('tape')
const Promise = require('../')

function isSubset (sub, superset) {
  return sub.every((n) => superset.includes(n))
}

tape('Promise.some', function (t) {
  t.test('should reject on negative number', function (t) {
    return Promise.some([1, 2, 3], -1)
      .then(t.fail)
      .caught(Promise.TypeError, function () {
      })
  })

  t.test('should reject on NaN', function (t) {
    return Promise.some([1, 2, 3], -0 / 0)
      .then(t.fail)
      .caught(Promise.TypeError, function () {
      })
  })

  t.test('should reject on non-array', function (t) {
    return Promise.some({}, 2)
      .then(t.fail)
      .caught(Promise.TypeError, function () {
      })
  })

  t.test('should reject with rangeerror when impossible to fulfill', function (t) {
    return Promise.some([1, 2, 3], 4)
      .then(t.fail)
      .caught(Promise.RangeError, function (e) {
      })
  })

  t.test('should fulfill with empty array with 0', function (t) {
    return Promise.some([1, 2, 3], 0).then(function (result) {
      t.deepEqual(result, [])
    })
  })
})

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

var RangeError = Promise.RangeError

tape('Promise.some-test', function (t) {
  t.test('should reject empty input', function (t) {
    return Promise.some([], 1).caught(RangeError, function () {
    })
  })

  t.test('should resolve values array', function (t) {
    var input = [1, 2, 3]
    return Promise.some(input, 2).then(
      function (results) {
        t.ok(isSubset(results, input))
      },
      t.fail
    )
  })

  t.test('should resolve promises array', function (t) {
    var input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]
    return Promise.some(input, 2).then(
      function (results) {
        t.ok(isSubset(results, [1, 2, 3]))
      },
      t.fail
    )
  })

  t.test('should not resolve sparse array input', function (t) {
    var input = [, 1, , 2, 3] // eslint-disable-line no-sparse-arrays, standard/array-bracket-even-spacing
    return Promise.some(input, 2).then(
      function (results) {
        t.deepEqual(results, [void 0, 1])
      },
      function () {
        console.error(arguments)
        t.fail()
      }
    )
  })

  t.test('should reject with all rejected input values if resolving howMany becomes impossible', function (t) {
    var input = [Promise.resolve(1), Promise.reject(2), Promise.reject(3)] // eslint-disable-line prefer-promise-reject-errors
    return Promise.some(input, 2).then(
      t.fail,
      function (err) {
        // Cannot use deep equality in IE8 because non-enumerable properties are not
        // supported
        t.ok(err[0] === 2)
        t.ok(err[1] === 3)
      }
    )
  })

  t.test('should reject with aggregateError', function (t) {
    var input = [Promise.resolve(1), Promise.reject(2), Promise.reject(3)] // eslint-disable-line prefer-promise-reject-errors
    return Promise.some(input, 2)
      .then(t.fail)
      .caught(Promise.AggregateError, function (e) {
        t.ok(e[0] === 2)
        t.ok(e[1] === 3)
        t.ok(e.length === 2)
      })
  })

  t.test('aggregate error should be caught in .error', { skip: true }, function (t) {
    var input = [Promise.resolve(1), Promise.reject(2), Promise.reject(3)] // eslint-disable-line prefer-promise-reject-errors
    return Promise.some(input, 2)
      .then(t.fail)
      .error(function (e) {
        t.ok(e[0] === 2)
        t.ok(e[1] === 3)
        t.ok(e.length === 2)
      })
  })

  t.test('should accept a promise for an array', function (t) {
    var expected, input

    expected = [1, 2, 3]
    input = Promise.resolve(expected)

    return Promise.some(input, 2).then(
      function (results) {
        t.deepEqual(results.length, 2)
      },
      t.fail
    )
  })

  t.test('should reject when input promise does not resolve to array', function (t) {
    return Promise.some(Promise.resolve(1), 1).caught(TypeError, function (e) {
    })
  })

  t.test('should reject when given immediately rejected promise', function (t) {
    var err = new Error()
    return Promise.some(Promise.reject(err), 1).then(t.fail, function (e) { // eslint-disable-line prefer-promise-reject-errors
      t.strictEqual(err, e)
    })
  })
})
