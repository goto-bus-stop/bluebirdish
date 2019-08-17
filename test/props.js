'use strict'
const tape = require('tape')
const Promise = require('../')

tape('Promise.props', (t) => {
  t.test('should reject undefined', (t) => {
    Promise.props().catch(TypeError, () => {
      t.end()
    })
  })

  t.test('should reject primitive', (t) => {
    Promise.props('str').catch(TypeError, () => {
      t.end()
    })
  })

  t.test('should resolve to new object', (t) => {
    const o = {}
    return Promise.props(o).then((v) => {
      t.ok(v !== o)
      t.deepEqual(o, v)
    })
  })

  t.test('should resolve value properties', (t) => {
    const o = {
      one: 1,
      two: 2,
      three: 3
    }
    return Promise.props(o).then((v) => {
      t.deepEqual(
        {
          one: 1,
          two: 2,
          three: 3
        },
        v
      )
    })
  })

  t.test('should resolve immediate properties', (t) => {
    const o = {
      one: Promise.resolve(1),
      two: Promise.resolve(2),
      three: Promise.resolve(3)
    }
    return Promise.props(o).then((v) => {
      t.deepEqual(
        {
          one: 1,
          two: 2,
          three: 3
        },
        v
      )
    })
  })

  t.test('should resolve eventual properties', (t) => {
    const d1 = Promise.defer()
    const d2 = Promise.defer()
    const d3 = Promise.defer()
    const o = {
      one: d1.promise,
      two: d2.promise,
      three: d3.promise
    }

    setTimeout(() => {
      d1.fulfill(1)
      d2.fulfill(2)
      d3.fulfill(3)
    }, 1)

    return Promise.props(o).then((v) => {
      t.deepEqual(
        {
          one: 1,
          two: 2,
          three: 3
        },
        v
      )
    })
  })

  t.test('should reject if any input promise rejects', (t) => {
    const o = {
      one: Promise.resolve(1),
      two: Promise.reject(2), // eslint-disable-line prefer-promise-reject-errors
      three: Promise.resolve(3)
    }
    Promise.props(o).then(t.fail, (v) => {
      t.ok(v === 2)
      t.end()
    })
  })

  t.test('should accept a promise for an object', (t) => {
    const o = {
      one: Promise.resolve(1),
      two: Promise.resolve(2),
      three: Promise.resolve(3)
    }
    const d1 = Promise.defer()
    setTimeout(() => {
      d1.fulfill(o)
    }, 1)
    return Promise.props(d1.promise).then((v) => {
      t.deepEqual(
        {
          one: 1,
          two: 2,
          three: 3
        },
        v
      )
    })
  })

  t.test('should reject a promise for a primitive', (t) => {
    const d1 = Promise.defer()
    setTimeout(() => {
      d1.fulfill('text')
    }, 1)
    Promise.props(d1.promise).catch(TypeError, () => {
      t.end()
    })
  })

  t.test('should accept thenables in properties', (t) => {
    const t1 = {
      then (resolve) { resolve(1) }
    }
    const t2 = {
      then (resolve) { resolve(2) }
    }
    const t3 = {
      then (resolve) { resolve(3) }
    }
    const o = {
      one: t1,
      two: t2,
      three: t3
    }
    return Promise.props(o).then((v) => {
      t.deepEqual(
        {
          one: 1,
          two: 2,
          three: 3
        },
        v
      )
    })
  })

  t.test('should accept a thenable for thenables in properties', (t) => {
    const o = {
      then (f) {
        f({
          one: {
            then (resolve) { resolve(1) }
          },
          two: {
            then (resolve) { resolve(2) }
          },
          three: {
            then (resolve) { resolve(3) }
          }
        })
      }
    }
    return Promise.props(o).then((v) => {
      t.deepEqual(
        {
          one: 1,
          two: 2,
          three: 3
        },
        v
      )
    })
  })

  t.test('treats arrays for their properties', (t) => {
    const o = [1, 2, 3]

    return Promise.props(o).then((v) => {
      t.deepEqual(
        {
          0: 1,
          1: 2,
          2: 3
        },
        v
      )
    })
  })

  t.test('works with es6 maps', (t) => {
    return Promise.props(
      new Map([
        ['a', Promise.resolve(1)],
        ['b', Promise.resolve(2)],
        ['c', Promise.resolve(3)]
      ])
    ).then((result) => {
      t.strictEqual(result.get('a'), 1)
      t.strictEqual(result.get('b'), 2)
      t.strictEqual(result.get('c'), 3)
    })
  })

  t.test("doesn't await promise keys in es6 maps", (t) => {
    const a = new Promise(() => {})
    const b = new Promise(() => {})
    const c = new Promise(() => {})

    return Promise.props(
      new Map([
        [a, Promise.resolve(1)],
        [b, Promise.resolve(2)],
        [c, Promise.resolve(3)]
      ])
    ).then((result) => {
      t.strictEqual(result.get(a), 1)
      t.strictEqual(result.get(b), 2)
      t.strictEqual(result.get(c), 3)
    })
  })

  t.test('empty map should resolve to empty map', (t) => {
    return Promise.props(new Map()).then((result) => {
      t.ok(result instanceof Map)
    })
  })
})
