const tape = require('tape')
const Promise = require('../')

tape('Promise filter', function (t) {
  function ThrownError () {}

  const arr = [1, 2, 3]

  function assertArr (t, arr) {
    t.ok(arr.length === 2)
    t.ok(arr[0] === 1)
    t.ok(arr[1] === 3)
  }

  function assertErr (t, e) {
    t.ok(e instanceof ThrownError)
  }

  t.test('immediately fulfilled', function (t) {
    return Promise.filter(arr, function (v) {
      return new Promise(function (resolve) {
        resolve(v !== 2)
      })
    }).then((arr) => assertArr(t, arr))
  })

  t.test('already fulfilled', function (t) {
    return Promise.filter(arr, function (v) {
      return Promise.resolve(v !== 2)
    }).then((arr) => assertArr(t, arr))
  })

  t.test('eventually fulfilled', function (t) {
    return Promise.filter(arr, function (v) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve(v !== 2)
        }, 1)
      })
    }).then((arr) => assertArr(t, arr))
  })

  t.test('immediately rejected', function (t) {
    return Promise.filter(arr, function (v) {
      return new Promise(function (resolve, reject) {
        reject(new ThrownError())
      })
    }).then(t.fail, (err) => assertErr(t, err))
  })
  t.test('already rejected', function (t) {
    return Promise.filter(arr, function (v) {
      return Promise.reject(new ThrownError())
    }).then(t.fail, (err) => assertErr(t, err))
  })
  t.test('eventually rejected', function (t) {
    return Promise.filter(arr, function (v) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          reject(new ThrownError())
        }, 1)
      })
    }).then(t.fail, (err) => assertErr(t, err))
  })

  t.test('immediately fulfilled thenable', function (t) {
    return Promise.filter(arr, function (v) {
      return {
        then: function (resolve, reject) {
          resolve(v !== 2)
        }
      }
    }).then((arr) => assertArr(t, arr))
  })
  t.test('eventually fulfilled thenable', function (t) {
    return Promise.filter(arr, function (v) {
      return {
        then: function (resolve, reject) {
          setTimeout(function () {
            resolve(v !== 2)
          }, 1)
        }
      }
    }).then((arr) => assertArr(t, arr))
  })

  t.test('immediately rejected thenable', function (t) {
    return Promise.filter(arr, function (v) {
      return {
        then: function (resolve, reject) {
          reject(new ThrownError())
        }
      }
    }).then(t.fail, (err) => assertErr(t, err))
  })
  t.test('eventually rejected thenable', function (t) {
    return Promise.filter(arr, function (v) {
      return {
        then: function (resolve, reject) {
          setTimeout(function () {
            reject(new ThrownError())
          }, 1)
        }
      }
    }).then(t.fail, (err) => assertErr(t, err))
  })
})
