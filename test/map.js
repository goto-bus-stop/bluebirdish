const tape = require('tape')
const Promise = require('../')

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
tape('Promise.map-test', function (t) {
  function mapper (val) {
    return val * 2
  }

  function deferredMapper (val) {
    return Promise.delay(1, mapper(val))
  }

  t.test('should map input values array', function (t) {
    const input = [1, 2, 3]
    return Promise.map(input, mapper).then(
      function (results) {
        t.deepEqual(results, [2, 4, 6])
      },
      t.fail
    )
  })

  t.test('should map input promises array', function (t) {
    const input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]
    return Promise.map(input, mapper).then(
      function (results) {
        t.deepEqual(results, [2, 4, 6])
      },
      t.fail
    )
  })

  t.test('should map mixed input array', function (t) {
    const input = [1, Promise.resolve(2), 3]
    return Promise.map(input, mapper).then(
      function (results) {
        t.deepEqual(results, [2, 4, 6])
      },
      t.fail
    )
  })

  t.test('should map input when mapper returns a promise', function (t) {
    const input = [1, 2, 3]
    return Promise.map(input, deferredMapper).then(
      function (results) {
        t.deepEqual(results, [2, 4, 6])
      },
      t.fail
    )
  })

  t.test('should accept a promise for an array', function (t) {
    return Promise.map(Promise.resolve([1, Promise.resolve(2), 3]), mapper).then(
      function (result) {
        t.deepEqual(result, [2, 4, 6])
      },
      t.fail
    )
  })

  t.test('should throw a TypeError when input promise does not resolve to an array', function (t) {
    return Promise.map(Promise.resolve(123), mapper).caught(TypeError, function (e) {
    })
  })

  t.test('should map input promises when mapper returns a promise', function (t) {
    const input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]
    return Promise.map(input, mapper).then(
      function (results) {
        t.deepEqual(results, [2, 4, 6])
      },
      t.fail
    )
  })

  t.test('should reject when input contains rejection', function (t) {
    const input = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)] // eslint-disable-line prefer-promise-reject-errors
    return Promise.map(input, mapper).then(
      t.fail,
      function (result) {
        t.ok(result === 2)
      }
    )
  })

  t.test('should call mapper asynchronously on values array', function (t) {
    let calls = 0
    function mapper (val) {
      calls++
    }

    const input = [1, 2, 3]
    const p = Promise.map(input, mapper)
    t.ok(calls === 0)
    return p.then(function () {
      t.ok(calls === 3)
    })
  })

  t.test('should call mapper asynchronously on promises array', function (t) {
    let calls = 0
    function mapper (val) {
      calls++
    }

    const input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]
    const p = Promise.map(input, mapper)
    t.ok(calls === 0)
    return p.then(function () {
      t.ok(calls === 3)
    })
  })

  t.test('should call mapper asynchronously on mixed array', function (t) {
    let calls = 0
    function mapper (val) {
      calls++
    }

    const input = [1, Promise.resolve(2), 3]
    const p = Promise.map(input, mapper)
    t.ok(calls === 0)
    return p.then(function () {
      t.ok(calls === 3)
    })
  })
})

tape('Promise.map-test with concurrency', { skip: true }, function (t) {
  const concurrency = { concurrency: 2 }

  function mapper (val) {
    return val * 2
  }

  function deferredMapper (val) {
    return Promise.delay(1, mapper(val))
  }

  t.test('should map input values array with concurrency', function (t) {
    const input = [1, 2, 3]
    return Promise.map(input, mapper, concurrency).then(
      function (results) {
        t.deepEqual(results, [2, 4, 6])
      },
      t.fail
    )
  })

  t.test('should map input promises array with concurrency', function (t) {
    const input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]
    return Promise.map(input, mapper, concurrency).then(
      function (results) {
        t.deepEqual(results, [2, 4, 6])
      },
      t.fail
    )
  })

  t.test('should map mixed input array with concurrency', function (t) {
    const input = [1, Promise.resolve(2), 3]
    return Promise.map(input, mapper, concurrency).then(
      function (results) {
        t.deepEqual(results, [2, 4, 6])
      },
      t.fail
    )
  })

  t.test('should map input when mapper returns a promise with concurrency', function (t) {
    const input = [1, 2, 3]
    return Promise.map(input, deferredMapper, concurrency).then(
      function (results) {
        t.deepEqual(results, [2, 4, 6])
      },
      t.fail
    )
  })

  t.test('should accept a promise for an array with concurrency', function (t) {
    return Promise.map(Promise.resolve([1, Promise.resolve(2), 3]), mapper, concurrency).then(
      function (result) {
        t.deepEqual(result, [2, 4, 6])
      },
      t.fail
    )
  })

  t.test('should resolve to empty array when input promise does not resolve to an array with concurrency', function (t) {
    return Promise.map(Promise.resolve(123), mapper, concurrency).caught(TypeError, function (e) {
    })
  })

  t.test('should map input promises when mapper returns a promise with concurrency', function (t) {
    const input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]
    return Promise.map(input, mapper, concurrency).then(
      function (results) {
        t.deepEqual(results, [2, 4, 6])
      },
      t.fail
    )
  })

  t.test('should reject when input contains rejection with concurrency', function (t) {
    const input = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)] // eslint-disable-line prefer-promise-reject-errors
    return Promise.map(input, mapper, concurrency).then(
      t.fail,
      function (result) {
        t.ok(result === 2)
      }
    )
  })

  t.test('should not have more than {concurrency} promises in flight', function (t) {
    const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const b = []

    const immediates = []
    function immediate (index) {
      let resolve
      const ret = new Promise(function () { resolve = arguments[0] })
      immediates.push([ret, resolve, index])
      return ret
    }

    const lates = []
    function late (index) {
      let resolve
      const ret = new Promise(function () { resolve = arguments[0] })
      lates.push([ret, resolve, index])
      return ret
    }

    function promiseByIndex (index) {
      return index < 5 ? immediate(index) : late(index)
    }

    function resolve (item) {
      item[1](item[2])
    }

    const ret1 = Promise.map(array, function (value, index) {
      return promiseByIndex(index).then(function () {
        b.push(value)
      })
    }, { concurrency: 5 })

    const ret2 = Promise.delay(100).then(function () {
      t.strictEqual(0, b.length)
      immediates.forEach(resolve)
      return immediates.map(function (item) { return item[0] })
    }).delay(100).then(function () {
      t.deepEqual(b, [0, 1, 2, 3, 4])
      lates.forEach(resolve)
    }).delay(100).then(function () {
      t.deepEqual(b, [0, 1, 2, 3, 4, 10, 9, 8, 7, 6])
      lates.forEach(resolve)
    }).thenReturn(ret1).then(function () {
      t.deepEqual(b, [0, 1, 2, 3, 4, 10, 9, 8, 7, 6, 5])
    })
    return Promise.all([ret1, ret2])
  })
})
