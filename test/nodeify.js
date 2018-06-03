const tape = require('tape')
const Promise = require('../')
const sinon = require('sinon')
const isNodeJS = true

function awaitGlobalException () {
  return Promise.resolve()
}

function getSpy () {
  const { promise, resolve, reject } = Promise.defer()
  function spy (fn) {
    spy.callback = fn
    return spy.node
  }
  return Object.assign(spy, {
    node (...args) {
      try {
        spy.callback.apply(this, args)
        resolve()
      } catch (err) {
        reject(err)
      }
    },
    promise
  })
}

/*
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

tape('nodeify', function (t) {
  t.test('calls back with a resolution', function (t) {
    const spy = sinon.spy()
    Promise.resolve(10).nodeify(spy)
    setTimeout(function () {
      sinon.assert.calledOnce(spy)
      sinon.assert.calledWith(spy, null, 10)
      t.end()
    }, 1)
  })

  t.test('calls back with an undefined resolution', function (t) {
    const spy = sinon.spy()
    Promise.resolve().nodeify(spy)
    setTimeout(function () {
      sinon.assert.calledOnce(spy)
      sinon.assert.calledWithExactly(spy, null)
      t.end()
    }, 1)
  })

  t.test('calls back with an error', function (t) {
    const spy = sinon.spy()
    Promise.reject(10).nodeify(spy) // eslint-disable-line prefer-promise-reject-errors
    setTimeout(function () {
      sinon.assert.calledOnce(spy)
      sinon.assert.calledWith(spy, 10)
      t.end()
    }, 1)
  })

  t.test('forwards a promise', function (t) {
    return Promise.resolve(10).nodeify().then(function (ten) {
      t.ok(ten === 10)
    })
  })

  t.test('returns undefined when a callback is passed', { skip: true }, function (t) {
    t.equal(typeof Promise.resolve(10).nodeify(function () {}), 'undefined')
    t.end()
  })
})

if (isNodeJS) {
  tape('nodeify', function (t) {
    const e = new Error()
    function thrower () {
      throw e
    }

    t.test('throws normally in the node process if the function throws', function (t) {
      const promise = Promise.resolve(10)
      let turns = 0
      process.nextTick(function () {
        turns++
      })
      promise.nodeify(thrower)
      return awaitGlobalException(function (err) {
        t.ok(err === e)
        t.ok(turns === 1)
      })
    })

    t.test('always returns promise for now', function (t) {
      return Promise.resolve(3).nodeify().then(function () {
        let a = 0
        Promise.resolve(3).nodeify(function () {
          a++
        }).then(function () {
          t.ok(a === 1)
        })
      })
    })

    t.test('should spread arguments with spread option', function (t) {
      const spy = getSpy()
      Promise.resolve([1, 2, 3]).nodeify(spy(function (err, a, b, c) {
        t.ok(err === null)
        t.ok(a === 1)
        t.ok(b === 2)
        t.ok(c === 3)
      }), {spread: true})
      return spy.promise
    })

    t.test('promise rejected with falsy values', function (t) {
      t.test('no reason', function (t) {
        const spy = getSpy()
        Promise.reject().nodeify(spy(function (err) { // eslint-disable-line prefer-promise-reject-errors
          t.strictEqual(arguments.length, 1)
          t.strictEqual(err.cause, undefined)
        }))
        return spy.promise
      })
      t.test('null reason', function (t) {
        const spy = getSpy()
        Promise.reject(null).nodeify(spy(function (err) { // eslint-disable-line prefer-promise-reject-errors
          t.strictEqual(arguments.length, 1)
          t.strictEqual(err.cause, null)
        }))
        return spy.promise
      })
      t.test('nodefying a follewer promise', function (t) {
        const spy = getSpy()
        new Promise(function (resolve, reject) {
          resolve(new Promise(function (resolve, reject) {
            setTimeout(function () {
              reject() // eslint-disable-line prefer-promise-reject-errors
            }, 1)
          }))
        }).nodeify(spy(function (err) {
          t.strictEqual(arguments.length, 1)
          t.strictEqual(err.cause, undefined)
        }))
        return spy.promise
      })
      t.test('nodefier promise becomes follower', function (t) {
        const spy = getSpy()
        Promise.resolve(1).then(function () {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              reject() // eslint-disable-line prefer-promise-reject-errors
            }, 1)
          })
        }).nodeify(spy(function (err) {
          t.strictEqual(arguments.length, 1)
          t.strictEqual(err.cause, undefined)
        }))
        return spy.promise
      })
    })
    t.test('should wrap arguments with spread option', function (t) {
      const spy = getSpy()
      Promise.resolve([1, 2, 3]).nodeify(spy(function (err, a, b, c) {
        t.ok(err === null)
        t.ok(a === 1)
        t.ok(b === 2)
        t.ok(c === 3)
      }), {spread: true})
      return spy.promise
    })

    t.test('should work then result is not an array', function (t) {
      const spy = getSpy()
      Promise.resolve(3).nodeify(spy(function (err, a) {
        t.ok(err === null)
        t.ok(a === 3)
      }), {spread: true})
      return spy.promise
    })

    t.test('should work if the callback throws when spread', function (t) {
      const err = new Error()
      Promise.resolve([1, 2, 3]).nodeify(function (_, a) {
        throw err
      }, {spread: true})

      return awaitGlobalException(function (e) {
        t.strictEqual(err, e)
      })
    })

    t.test('should work if the callback throws when rejected', function (t) {
      const err = new Error()
      Promise.reject(new Error()).nodeify(function (_, a) {
        throw err
      })

      return awaitGlobalException(function (e) {
        t.strictEqual(err, e)
      })
    })
  })
}
