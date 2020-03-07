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
function promising (val) {
  return function () {
    return promised(val)
  }
}
function promisingThen (val) {
  return function () {
    return promised(val).then(function (resolved) {
      return resolved
    })
  }
}

function thenabled (val) {
  return {
    then: function (resolve) {
      setTimeout(function () {
        resolve(val)
      }, 1)
    }
  }
}
function thenabling (val) {
  return function () { return thenabled(val) }
}

function evaluate (val) {
  if (typeof val === 'function') {
    val = val()
  }
  if (Array.isArray(val)) {
    val = val.map(function (member) {
      return evaluate(member)
    })
  }
  return val
}

const ACCUM_CRITERIA = [
  { value: 0, desc: 'that is resolved' },
  { value: promising(0), desc: 'as a Promise' },
  { value: promisingThen(0), desc: 'as a deferred Promise' },
  { value: thenabling(0), desc: 'as a thenable' }
]

const VALUES_CRITERIA = [
  { value: [], total: 0, desc: 'and no values' },
  { value: [1], total: 1, desc: 'and a single resolved value' },
  { value: [1, 2, 3], total: 6, desc: 'and multiple resolved values' },
  { value: [promising(1)], total: 1, desc: 'and a single Promise' },
  {
    value: [
      promising(1),
      promising(2),
      promising(3)
    ],
    total: 6,
    desc: 'and multiple Promises'
  },
  {
    value: [
      promisingThen(1)
    ],
    total: 1,
    desc: 'and a single deferred Promise'
  },
  {
    value: [
      promisingThen(1),
      promisingThen(2),
      promisingThen(3)
    ],
    total: 6,
    desc: 'and multiple deferred Promises'
  },
  {
    value: [
      thenabling(1)
    ],
    total: 1,
    desc: 'and a single thenable'
  },
  {
    value: [
      thenabling(1),
      thenabling(2),
      thenabling(3)
    ],
    total: 6,
    desc: 'and multiple thenables'
  },
  {
    value: [
      thenabling(1),
      promisingThen(2),
      promising(3),
      4
    ],
    total: 10,
    desc: 'and a blend of values'
  }
]

const ERROR = new Error('BOOM')

tape('Promise.prototype.reduce', function (t) {
  t.test('works with no values', function (t) {
    return Promise.resolve([]).reduce(function (total, value) {
      return total + value + 5
    }).then(function (total) {
      t.strictEqual(total, undefined)
    })
  })

  t.test('works with a single value', function (t) {
    return Promise.resolve([1]).reduce(function (total, value) {
      return total + value + 5
    }).then(function (total) {
      t.strictEqual(total, 1)
    })
  })

  t.test('works when the iterator returns a value', function (t) {
    return Promise.resolve([1, 2, 3]).reduce(function (total, value) {
      return total + value + 5
    }).then(function (total) {
      t.strictEqual(total, (1 + 2 + 5 + 3 + 5))
    })
  })

  t.test('works when the iterator returns a Promise', function (t) {
    return Promise.resolve([1, 2, 3]).reduce(function (total, value) {
      return promised(5).then(function (bonus) {
        return total + value + bonus
      })
    }).then(function (total) {
      t.strictEqual(total, (1 + 2 + 5 + 3 + 5))
    })
  })

  t.test('works when the iterator returns a thenable', function (t) {
    return Promise.resolve([1, 2, 3]).reduce(function (total, value) {
      return thenabled(total + value + 5)
    }).then(function (total) {
      t.strictEqual(total, (1 + 2 + 5 + 3 + 5))
    })
  })
})

tape('Promise.reduce', function (t) {
  t.test('should allow returning values', function (t) {
    const a = [promised(1), promised(2), promised(3)]

    return Promise.reduce(a, function (total, a) {
      return total + a + 5
    }, 0).then(function (total) {
      t.equal(total, 1 + 5 + 2 + 5 + 3 + 5)
    })
  })

  t.test('should allow returning promises', function (t) {
    const a = [promised(1), promised(2), promised(3)]

    return Promise.reduce(a, function (total, a) {
      return promised(5).then(function (b) {
        return total + a + b
      })
    }, 0).then(function (total) {
      t.equal(total, 1 + 5 + 2 + 5 + 3 + 5)
    })
  })

  t.test('should allow returning thenables', function (t) {
    const b = [1, 2, 3]
    const a = []

    return Promise.reduce(b, function (total, cur) {
      a.push(cur)
      return thenabled(3)
    }, 0).then(function (total) {
      t.equal(total, 3)
      t.deepEqual(a, b)
    })
  })

  t.test('propagates error', function (t) {
    const a = [promised(1), promised(2), promised(3)]
    const e = new Error('asd')
    return Promise.reduce(a, function (total, a) {
      if (a > 2) {
        throw e
      }
      return total + a + 5
    }, 0).then(t.fail, function (err) {
      t.equal(err, e)
    })
  })

  t.test('with no initial accumulator or values', function (t) {
    t.test('works when the iterator returns a value', function (t) {
      return Promise.reduce([], function (total, value) {
        return total + value + 5
      }).then(function (total) {
        t.strictEqual(total, undefined)
      })
    })

    t.test('works when the iterator returns a Promise', function (t) {
      return Promise.reduce([], function (total, value) {
        return promised(5).then(function (bonus) {
          return total + value + bonus
        })
      }).then(function (total) {
        t.strictEqual(total, undefined)
      })
    })

    t.test('works when the iterator returns a thenable', function (t) {
      return Promise.reduce([], function (total, value) {
        return thenabled(total + value + 5)
      }).then(function (total) {
        t.strictEqual(total, undefined)
      })
    })
  })

  t.test('with an initial accumulator value', function (t) {
    ACCUM_CRITERIA.forEach(function (criteria) {
      const initial = criteria.value

      t.test(criteria.desc, function (t) {
        VALUES_CRITERIA.forEach(function (criteria) {
          const values = criteria.value
          const valueTotal = criteria.total

          t.test(criteria.desc, function (t) {
            t.test('works when the iterator returns a value', function (t) {
              return Promise.reduce(evaluate(values), function (total, value) {
                return total + value + 5
              }, evaluate(initial)).then(function (total) {
                t.strictEqual(total, valueTotal + (values.length * 5))
              })
            })

            t.test('works when the iterator returns a Promise', function (t) {
              return Promise.reduce(evaluate(values), function (total, value) {
                return promised(5).then(function (bonus) {
                  return total + value + bonus
                })
              }, evaluate(initial)).then(function (total) {
                t.strictEqual(total, valueTotal + (values.length * 5))
              })
            })

            t.test('works when the iterator returns a thenable', function (t) {
              return Promise.reduce(evaluate(values), function (total, value) {
                return thenabled(total + value + 5)
              }, evaluate(initial)).then(function (total) {
                t.strictEqual(total, valueTotal + (values.length * 5))
              })
            })
          })
        })
      })
    })

    t.test('propagates an initial Error', function (t) {
      const initial = Promise.reject(ERROR)
      const values = [
        thenabling(1),
        promisingThen(2)(),
        promised(3),
        4
      ]

      return Promise.reduce(values, function (total, value) {
        return value
      }, initial).then(t.fail, function (err) {
        t.equal(err, ERROR)
      })
    })

    t.test("propagates a value's Error", function (t) {
      const initial = 0
      const values = [
        thenabling(1),
        promisingThen(2)(),
        Promise.reject(ERROR),
        promised(3),
        4
      ]

      return Promise.reduce(values, function (total, value) {
        return value
      }, initial).then(t.fail, function (err) {
        t.equal(err, ERROR)
      })
    })

    t.test('propagates an Error from the iterator', function (t) {
      const initial = 0
      const values = [
        thenabling(1),
        promisingThen(2)(),
        promised(3),
        4
      ]

      return Promise.reduce(values, function (total, value) {
        if (value === 2) {
          throw ERROR
        }
        return value
      }, initial).then(t.fail, function (err) {
        t.equal(err, ERROR)
      })
    })
  })

  t.test('with a 0th value acting as an accumulator', function (t) {
    t.test('acts this way when an accumulator value is provided yet `undefined`', function (t) {
      return Promise.reduce([1, 2, 3], function (total, value) {
        return ((total === undefined) ? 0 : total) + value + 5
      }, undefined).then(function (total) {
        t.strictEqual(total, (1 + 2 + 5 + 3 + 5))
      })
    })

    t.test('survives an `undefined` 0th value', function (t) {
      return Promise.reduce([undefined, 1, 2, 3], function (total, value) {
        return ((total === undefined) ? 0 : total) + value + 5
      }).then(function (total) {
        t.strictEqual(total, (1 + 5 + 2 + 5 + 3 + 5))
      })
    })

    ACCUM_CRITERIA.forEach(function (criteria) {
      const zeroth = criteria.value

      t.test(criteria.desc, function (t) {
        VALUES_CRITERIA.forEach(function (criteria) {
          const values = criteria.value
          const zerothAndValues = [zeroth].concat(values)
          const valueTotal = criteria.total

          t.test(criteria.desc, function (t) {
            t.test('works when the iterator returns a value', function (t) {
              return Promise.reduce(evaluate(zerothAndValues), function (total, value) {
                return total + value + 5
              }).then(function (total) {
                t.strictEqual(total, valueTotal + (values.length * 5))
              })
            })

            t.test('works when the iterator returns a Promise', function (t) {
              return Promise.reduce(evaluate(zerothAndValues), function (total, value) {
                return promised(5).then(function (bonus) {
                  return total + value + bonus
                })
              }).then(function (total) {
                t.strictEqual(total, valueTotal + (values.length * 5))
              })
            })

            t.test('works when the iterator returns a thenable', function (t) {
              return Promise.reduce(evaluate(zerothAndValues), function (total, value) {
                return thenabled(total + value + 5)
              }).then(function (total) {
                t.strictEqual(total, valueTotal + (values.length * 5))
              })
            })
          })
        })
      })
    })

    t.test('propagates an initial Error', function (t) {
      const values = [
        Promise.reject(ERROR),
        thenabling(1),
        promisingThen(2)(),
        promised(3),
        4
      ]

      return Promise.reduce(values, function (total, value) {
        return value
      }).then(t.fail, function (err) {
        t.equal(err, ERROR)
      })
    })

    t.test("propagates a value's Error", function (t) {
      const values = [
        0,
        thenabling(1),
        promisingThen(2)(),
        Promise.reject(ERROR),
        promised(3),
        4
      ]

      return Promise.reduce(values, function (total, value) {
        return value
      }).then(t.fail, function (err) {
        t.equal(err, ERROR)
      })
    })

    t.test('propagates an Error from the iterator', function (t) {
      const values = [
        0,
        thenabling(1),
        promisingThen(2)(),
        promised(3),
        4
      ]

      return Promise.reduce(values, function (total, value) {
        if (value === 2) {
          throw ERROR
        }
        return value
      }).then(t.fail, function (err) {
        t.equal(err, ERROR)
      })
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
const sentinel = {}
tape('Promise.reduce-test', function (t) {
  function plus (sum, val) {
    return sum + val
  }

  function later (val) {
    return Promise.delay(1, val)
  }

  t.test('should reduce values without initial value', function (t) {
    return Promise.reduce([1, 2, 3], plus).then(
      function (result) {
        t.deepEqual(result, 6)
      },
      t.fail
    )
  })

  t.test('should reduce values with initial value', function (t) {
    return Promise.reduce([1, 2, 3], plus, 1).then(
      function (result) {
        t.deepEqual(result, 7)
      },
      t.fail
    )
  })

  t.test('should reduce values with initial promise', function (t) {
    return Promise.reduce([1, 2, 3], plus, Promise.resolve(1)).then(
      function (result) {
        t.deepEqual(result, 7)
      },
      t.fail
    )
  })

  t.test('should reduce promised values without initial value', function (t) {
    const input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]
    return Promise.reduce(input, plus).then(
      function (result) {
        t.deepEqual(result, 6)
      },
      t.fail
    )
  })

  t.test('should reduce promised values with initial value', function (t) {
    const input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]
    return Promise.reduce(input, plus, 1).then(
      function (result) {
        t.deepEqual(result, 7)
      },
      t.fail
    )
  })

  t.test('should reduce promised values with initial promise', function (t) {
    const input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]
    return Promise.reduce(input, plus, Promise.resolve(1)).then(
      function (result) {
        t.deepEqual(result, 7)
      },
      t.fail
    )
  })

  t.test('should reduce empty input with initial value', function (t) {
    const input = []
    return Promise.reduce(input, plus, 1).then(
      function (result) {
        t.deepEqual(result, 1)
      },
      t.fail
    )
  })

  t.test('should reduce empty input with eventual promise', function (t) {
    return Promise.reduce([], plus, Promise.delay(1, 1)).then(
      function (result) {
        t.deepEqual(result, 1)
      },
      t.fail
    )
  })

  t.test('should reduce empty input with initial promise', function (t) {
    return Promise.reduce([], plus, Promise.resolve(1)).then(
      function (result) {
        t.deepEqual(result, 1)
      },
      t.fail
    )
  })

  t.test('should reject Promise input contains rejection', function (t) {
    const input = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)] // eslint-disable-line prefer-promise-reject-errors
    return Promise.reduce(input, plus, Promise.resolve(1)).then(
      t.fail,
      function (result) {
        t.deepEqual(result, 2)
      }
    )
  })

  t.test('should reduce to undefined with empty array', function (t) {
    return Promise.reduce([], plus).then(function (r) {
      t.ok(r === undefined)
    })
  })

  t.test('should reduce to initial value with empty array', function (t) {
    return Promise.reduce([], plus, sentinel).then(function (r) {
      t.ok(r === sentinel)
    })
  })

  t.test('should reduce in input order', function (t) {
    return Promise.reduce([later(1), later(2), later(3)], plus, '').then(
      function (result) {
        t.deepEqual(result, '123')
      },
      t.fail
    )
  })

  t.test('should accept a promise for an array', function (t) {
    return Promise.reduce(Promise.resolve([1, 2, 3]), plus, '').then(
      function (result) {
        t.deepEqual(result, '123')
      },
      t.fail
    )
  })

  t.test('should resolve to initialValue Promise input promise does not resolve to an array', function (t) {
    return Promise.reduce(Promise.resolve(123), plus, 1).caught(TypeError, function (e) {
    })
  })

  t.test('should provide correct basis value', function (t) {
    function insertIntoArray (arr, val, i) {
      arr[i] = val
      return arr
    }

    return Promise.reduce([later(1), later(2), later(3)], insertIntoArray, []).then(
      function (result) {
        t.deepEqual(result, [1, 2, 3])
      },
      t.fail
    )
  })

  t.test('checks', function (t) {
    function later (val, ms) {
      return Promise.delay(ms, val)
    }

    function plus (sum, val) {
      return sum + val
    }

    function plusDelayed (sum, val) {
      return Promise.delay(0).then(function (t) {
        return sum + val
      })
    }

    function check (t, delay1, delay2, delay3) {
      return Promise.reduce([
        later(1, delay1),
        later(2, delay2),
        later(3, delay3)
      ], plus, '').then(function (result) {
        t.deepEqual(result, '123')
      })
    }

    function checkDelayed (t, delay1, delay2, delay3) {
      return Promise.reduce([
        later(1, delay1),
        later(2, delay2),
        later(3, delay3)
      ], plusDelayed, '').then(function (result) {
        t.deepEqual(result, '123')
      })
    }

    t.test('16, 16, 16', function (t) {
      return check(t, 16, 16, 16)
    })

    t.test('16, 16, 4', function (t) {
      return check(t, 16, 16, 4)
    })
    t.test('4, 16, 16', function (t) {
      return check(t, 4, 16, 16)
    })
    t.test('16, 4, 16', function (t) {
      return check(t, 16, 4, 16)
    })
    t.test('16, 16, 4', function (t) {
      return check(t, 16, 16, 4)
    })
    t.test('4, 4, 16', function (t) {
      return check(t, 4, 4, 16)
    })
    t.test('16, 4, 4', function (t) {
      return check(t, 16, 4, 4)
    })
    t.test('4, 16, 4', function (t) {
      return check(t, 4, 16, 4)
    })
    t.test('4, 4, 4', function (t) {
      return check(t, 4, 4, 4)
    })

    t.test('16, 16, 16', function (t) {
      return checkDelayed(t, 16, 16, 16)
    })

    t.test('16, 16, 4', function (t) {
      return checkDelayed(t, 16, 16, 4)
    })
    t.test('4, 16, 16', function (t) {
      return checkDelayed(t, 4, 16, 16)
    })
    t.test('16, 4, 16', function (t) {
      return checkDelayed(t, 16, 4, 16)
    })
    t.test('16, 16, 4', function (t) {
      return checkDelayed(t, 16, 16, 4)
    })
    t.test('4, 4, 16', function (t) {
      return checkDelayed(t, 4, 4, 16)
    })
    t.test('16, 4, 4', function (t) {
      return checkDelayed(t, 16, 4, 4)
    })
    t.test('4, 16, 4', function (t) {
      return checkDelayed(t, 4, 16, 4)
    })
    t.test('4, 4, 4', function (t) {
      return checkDelayed(t, 4, 4, 4)
    })
  })
})
