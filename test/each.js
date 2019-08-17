'use strict'
const tape = require('tape')
const Promise = require('../')

function promised (val) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(val)
    }, 1)
  })
}

function thenabled (val, arr) {
  return {
    then: function (resolve) {
      setTimeout(function () {
        if (arr) arr.push(val)
        resolve(val)
      }, 1)
    }
  }
}

tape('Promise.each', function (t) {
  t.test("should return the array's values mapped", function (t) {
    var a = [promised(1), promised(2), promised(3)]
    var b = []
    return Promise.resolve(a).mapSeries(function (val) {
      b.push(3 - val)
      return val + 2
    }).then(function (ret) {
      t.deepEqual(ret, [3, 4, 5])
      t.deepEqual(b, [2, 1, 0])
    })
  })

  t.test('takes value, index and length', function (t) {
    var a = [promised(1), promised(2), promised(3)]
    var b = []
    return Promise.resolve(a).each(function (value, index, length) {
      b.push(value, index, length)
    }).then(function (ret) {
      t.deepEqual(b, [1, 0, 3, 2, 1, 3, 3, 2, 3])
    })
  })

  t.test('waits for returned promise before proceeding next', function (t) {
    var a = [promised(1), promised(2), promised(3)]
    var b = []
    return Promise.resolve(a).each(function (value) {
      b.push(value)
      return Promise.delay(1).then(function () {
        b.push(value * 2)
      })
    }).then(function (ret) {
      t.deepEqual(b, [1, 2, 2, 4, 3, 6])
    })
  })

  t.test('waits for returned thenable before proceeding next', function (t) {
    var b = [1, 2, 3]
    var a = [thenabled(1), thenabled(2), thenabled(3)]
    return Promise.resolve(a).each(function (val) {
      b.push(val * 50)
      return thenabled(val * 500, b)
    }).then(function (ret) {
      t.deepEqual(b, [1, 2, 3, 50, 500, 100, 1000, 150, 1500])
    })
  })

  t.test('doesnt iterate with an empty array', function (t) {
    return Promise.each([], function (val) {
      throw new Error()
    }).then(function (ret) {
      t.deepEqual(ret, [])
    })
  })

  t.test('iterates with an array of single item', function (t) {
    var b = []
    return Promise.each([promised(1)], function (val) {
      b.push(val)
      return thenabled(val * 2, b)
    }).then(function (ret) {
      t.deepEqual(b, [1, 2])
    })
  })
})

tape('Promise.prototype.each', function (t) {
  t.test("should return the array's values", function (t) {
    var a = [promised(1), promised(2), promised(3)]
    var b = []
    return Promise.resolve(a).each(function (val) {
      b.push(3 - val)
      return val
    }).then(function (ret) {
      t.deepEqual(ret, [1, 2, 3])
      t.deepEqual(b, [2, 1, 0])
    })
  })

  t.test('takes value, index and length', function (t) {
    var a = [promised(1), promised(2), promised(3)]
    var b = []
    return Promise.resolve(a).each(function (value, index, length) {
      b.push(value, index, length)
    }).then(function (ret) {
      t.deepEqual(b, [1, 0, 3, 2, 1, 3, 3, 2, 3])
    })
  })

  t.test('waits for returned promise before proceeding next', function (t) {
    var a = [promised(1), promised(2), promised(3)]
    var b = []
    return Promise.resolve(a).each(function (value) {
      b.push(value)
      return Promise.delay(1).then(function () {
        b.push(value * 2)
      })
    }).then(function (ret) {
      t.deepEqual(b, [1, 2, 2, 4, 3, 6])
    })
  })

  t.test('waits for returned thenable before proceeding next', function (t) {
    var b = [1, 2, 3]
    var a = [thenabled(1), thenabled(2), thenabled(3)]
    return Promise.resolve(a).each(function (val) {
      b.push(val * 50)
      return thenabled(val * 500, b)
    }).then(function (ret) {
      t.deepEqual(b, [1, 2, 3, 50, 500, 100, 1000, 150, 1500])
    })
  })

  t.test('doesnt iterate with an empty array', function (t) {
    return Promise.resolve([]).each(function (val) {
      throw new Error()
    }).then(function (ret) {
      t.deepEqual(ret, [])
    })
  })

  t.test('iterates with an array of single item', function (t) {
    var b = []
    return Promise.resolve([promised(1)]).each(function (val) {
      b.push(val)
      return thenabled(val * 2, b)
    }).then(function (ret) {
      t.deepEqual(b, [1, 2])
    })
  })
})

tape('mapSeries and each', { skip: true }, function (t) {
  t.test('is mixed', function (t) {
    return Promise.mapSeries([1, 2, 3], function (value) {
      return value * 2
    }).then(function (result) {
      t.deepEqual(result, [2, 4, 6])
    }).then(function () {
      return Promise.each([1, 2, 3], function (value) {
        return value * 2
      }).then(function (result) {
        t.deepEqual(result, [1, 2, 3])
      })
    }).thenReturn([1, 2, 3]).mapSeries(function (value) {
      return value * 2
    }).then(function (result) {
      t.deepEqual(result, [2, 4, 6])
    }).thenReturn([1, 2, 3]).each(function (value) {
      return value * 2
    }).then(function (result) {
      t.deepEqual(result, [1, 2, 3])
    })
  })
})
