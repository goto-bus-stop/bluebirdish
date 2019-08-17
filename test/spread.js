'use strict'
const tape = require('tape')
const Promise = require('../')

/*!
 *
Copyright 2009–2012 Kristopher Michael Kowal. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/

tape('spread', (t) => {
  t.test('spreads values across arguments', (t) => {
    return Promise.resolve([1, 2, 3]).spread((a, b) => {
      t.equal(b, 2)
    })
  })

  t.test('spreads promises for arrays across arguments', (t) => {
    return Promise.resolve([Promise.resolve(10)])
      .all()
      .spread((value) => {
        t.equal(value, 10)
      })
  })

  t.test('spreads arrays of promises across arguments', (t) => {
    var deferredA = Promise.defer()
    var deferredB = Promise.defer()

    var promise = Promise.resolve([deferredA.promise, deferredB.promise]).all().spread(
      (a, b) => {
        t.equal(a, 10)
        t.equal(b, 20)
      })

    Promise.delay(1).then(() => {
      deferredA.resolve(10)
    })
    Promise.delay(1).then(() => {
      deferredB.resolve(20)
    })

    return promise
  })

  t.test('spreads arrays of thenables across arguments', (t) => {
    var p1 = {
      then (v) { v(10) }
    }
    var p2 = {
      then (v) { v(20) }
    }

    var promise = Promise.resolve([p1, p2]).all().spread((a, b) => {
      t.equal(a, 10)
      t.equal(b, 20)
    })
    return promise
  })

  t.test('should wait for promises in the returned array even when not calling .all', (t) => {
    var d1 = Promise.defer()
    var d2 = Promise.defer()
    var d3 = Promise.defer()
    setTimeout(() => {
      d1.resolve(1)
      d2.resolve(2)
      d3.resolve(3)
    }, 1)
    return Promise.resolve().then(() => {
      return [d1.promise, d2.promise, d3.promise]
    }).all().spread((a, b, c) => {
      t.ok(a === 1)
      t.ok(b === 2)
      t.ok(c === 3)
    })
  })

  t.test('should wait for thenables in the returned array even when not calling .all', (t) => {
    var t1 = {
      then (fn) {
        setTimeout(() => {
          fn(1)
        }, 1)
      }
    }
    var t2 = {
      then (fn) {
        setTimeout(() => {
          fn(2)
        }, 1)
      }
    }
    var t3 = {
      then (fn) {
        setTimeout(() => {
          fn(3)
        }, 1)
      }
    }
    return Promise.resolve().then(() => {
      return [t1, t2, t3]
    }).all().spread((a, b, c) => {
      t.ok(a === 1)
      t.ok(b === 2)
      t.ok(c === 3)
    })
  })

  t.test('should wait for promises in an array that a returned promise resolves to even when not calling .all', (t) => {
    var d1 = Promise.defer()
    var d2 = Promise.defer()
    var d3 = Promise.defer()
    var defer = Promise.defer()

    setTimeout(() => {
      defer.resolve([d1.promise, d2.promise, d3.promise])
      setTimeout(() => {
        d1.resolve(1)
        d2.resolve(2)
        d3.resolve(3)
      }, 1)
    }, 1)

    return Promise.resolve().then(() => {
      return defer.promise
    }).all().spread((a, b, c) => {
      t.ok(a === 1)
      t.ok(b === 2)
      t.ok(c === 3)
    })
  })

  t.test('should wait for thenables in an array that a returned thenable resolves to even when not calling .all', (t) => {
    var t1 = {
      then: function (fn) {
        setTimeout(function () {
          fn(1)
        }, 1)
      }
    }
    var t2 = {
      then: function (fn) {
        setTimeout(function () {
          fn(2)
        }, 1)
      }
    }
    var t3 = {
      then: function (fn) {
        setTimeout(function () {
          fn(3)
        }, 1)
      }
    }

    var thenable = {
      then: function (fn) {
        setTimeout(function () {
          fn([t1, t2, t3])
        }, 1)
      }
    }

    return Promise.resolve().then(function () {
      return thenable
    }).all().spread(function (a, b, c) {
      t.ok(a === 1)
      t.ok(b === 2)
      t.ok(c === 3)
    })
  })

  t.test('should reject with error when non array is the ultimate value to be spread', (t) => {
    Promise.resolve().then(function () {
      return 3
    }).spread(function (a, b, c) {
      t.fail()
    }).then(t.fail, function (e) {
      t.end()
    })
  })

  t.test('gh-235', (t) => {
    var P = Promise
    return P.resolve(1).then(function (x) {
      return [x, P.resolve(2)]
    }).spread(function (x, y) {
      return P.all([P.resolve(3), P.resolve(4)])
    }).then(function (a) {
      t.deepEqual([3, 4], a)
    })
  })

  t.test('error when passed non-function', (t) => {
    Promise.resolve(3)
      .spread()
      .then(t.fail)
      .caught(Promise.TypeError, function () {
        t.end()
      })
  })

  t.test('error when resolution is non-spredable', (t) => {
    Promise.resolve(3)
      .spread(function () {})
      .then(t.fail)
      .caught(Promise.TypeError, function () {
        t.end()
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

tape('Promise.spread-test', function (t) {
  var slice = [].slice

  t.test('should return a promise', (t) => {
    t.ok(typeof (Promise.defer().promise.spread(function () {}).then) === 'function')
    t.end()
  })

  t.test('should apply onFulfilled with array as argument list', (t) => {
    var expected = [1, 2, 3]
    return Promise.resolve(expected).spread(function () {
      t.deepEqual(slice.call(arguments), expected)
    })
  })

  t.test('should resolve array contents', (t) => {
    var expected = [Promise.resolve(1), 2, Promise.resolve(3)]
    return Promise.resolve(expected).all().spread(function () {
      t.deepEqual(slice.call(arguments), [1, 2, 3])
    })
  })

  t.test('should reject if any item in array rejects', (t) => {
    var expected = [Promise.resolve(1), 2, Promise.reject(3)] // eslint-disable-line prefer-promise-reject-errors
    Promise.resolve(expected).all()
      .spread(t.fail)
      .then(t.fail, () => {
        t.end()
      })
  })

  t.test('should apply onFulfilled with array as argument list', (t) => {
    var expected = [1, 2, 3]
    return Promise.resolve(Promise.resolve(expected)).spread(function () {
      t.deepEqual(slice.call(arguments), expected)
    })
  })

  t.test('should resolve array contents', (t) => {
    var expected = [Promise.resolve(1), 2, Promise.resolve(3)]
    return Promise.resolve(Promise.resolve(expected)).all().spread(function () {
      t.deepEqual(slice.call(arguments), [1, 2, 3])
    })
  })

  t.test('should reject if input is a rejected promise', (t) => {
    var expected = Promise.reject([1, 2, 3]) // eslint-disable-line prefer-promise-reject-errors
    Promise.resolve(expected)
      .spread(t.fail)
      .then(t.fail, () => {
        t.end()
      })
  })
})
