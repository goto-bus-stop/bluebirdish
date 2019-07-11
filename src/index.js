const makeStatics = () => ({
  TypeError, // alias
  RangeError, // alias
  AggregateError: class AggregateError extends Error {
    constructor (errors) {
      super()
      Object.assign(this, errors)
      this.length = errors.length
    }
  }
})

const makeBluebirdish = () => Object.assign(class Bluebirdish extends Promise {
  spread (fn) {
    return super.then((args) => {
      if (typeof fn !== 'function') throw new TypeError('bluebirdish: spread: fn must be function')
      return fn(...args)
    })
  }

  then (resolved, rejected) {
    return super.then(resolved, rejected)
  }

  catch (...args) {
    if (args.length === 1) {
      return super.catch(args[0])
    }

    const fn = args.pop()
    return super.catch((err) => {
      if (!args.some((predicate) => matchesPredicate(err, predicate))) {
        throw err
      }
      return fn(err)
    })
  }

  get caught () { return this.catch } // alias

  finally (cb) {
    if (super.finally) return super.finally(cb) // builtin in new envs!
    return super.then(
      (value) => this.constructor.try(cb).return(value),
      (err) => this.constructor.try(cb).throw(err)
    )
  }

  get lastly () { return this.finally } // alias

  all () {
    return this.constructor.all(this)
  }

  race () {
    return this.constructor.race(this)
  }

  props () {
    return this.constructor.props(this)
  }

  map (fn) {
    return this.constructor.map(this, fn)
  }

  filter (fn) {
    return this.constructor.filter(this, fn)
  }

  reduce (fn, initial) {
    return this.constructor.reduce(this, fn, initial)
  }

  mapSeries (fn) {
    return this.constructor.mapSeries(this, fn)
  }

  each (fn) {
    return this.constructor.each(this, fn)
  }

  some (num) {
    return this.constructor.some(this, num)
  }

  any () {
    return this.constructor.any(this)
  }

  delay (time) {
    return this.then((value) => this.constructor.delay(time, value))
  }

  tap (fn) {
    return this.then((value) => {
      return this.constructor.resolve(fn(value))
        .then(() => value)
    })
  }

  call (method, ...args) {
    return this.then((obj) => {
      if (!obj || typeof obj[method] !== 'function') {
        throw new TypeError(`bluebirdish: call: object has no method '${method}'`)
      }
      return obj[method](...args)
    })
  }

  get (prop) {
    return this.then((obj) =>
      typeof prop === 'number' && prop < 0 && typeof obj === 'object' && typeof obj.length === 'number'
        ? obj[Math.max(0, obj.length + prop)]
        : obj[prop]
    )
  }

  'return' (value) {
    return this.then(() => value)
  }

  get thenReturn () { return this.return }

  'throw' (err) {
    return this.then(() => { throw err })
  }

  catchReturn (...args) {
    const value = args.pop()
    return this.catch(...args, () => value)
  }

  catchThrow (...args) {
    const err = args.pop()
    return this.catch(...args, () => { throw err })
  }

  asCallback (cb, opts) {
    if (!cb) return this.then()

    function error (err) {
      if (!err) err = Object.assign(new Error(), { cause: err })
      cb(err)
    }
    function success (val) {
      if (val === undefined) {
        cb(null)
      } else {
        if (opts && opts.spread) cb(null, ...val)
        else cb(null, val)
      }
    }

    return this.then(success, error)
  }

  get nodeify () { return this.asCallback } // alias

  // Bluebird accepts a Promise for an Array in `all` and `race`.
  static all (arg) {
    return this.resolve(arg).then((arr) => super.all(arr))
  }

  static race (arg) {
    return this.resolve(arg).then((arr) => super.race(unsparse(arr)))
  }

  static join (...promises) {
    const fn = promises.pop()
    return this.all(promises).then((results) => fn(...results))
  }

  static 'try' (factory) {
    try {
      return this.resolve(factory())
    } catch (err) {
      return this.reject(err)
    }
  }

  static get attempt () { return this.try } // alias

  static method (fn) {
    const P = this
    return function (...args) {
      return P.try(() => fn.apply(this, args))
    }
  }

  static resolve (value) {
    return super.resolve(value)
  }

  static reject (err) {
    return super.reject(err)
  }

  static props (arg) {
    return this.resolve(arg).then((obj) => {
      if (typeof obj !== 'object') throw new TypeError('props expects object')

      if (obj instanceof Map) {
        const keys = Array.from(obj.keys())
        const values = obj.values()
        return this.all(values).then((results) =>
          new Map(keys.map((k, i) => [k, results[i]]))
        )
      }

      const keys = Object.keys(obj)
      const values = keys.map((k) => obj[k])

      return this.all(values).then((results) => {
        const newObj = {}
        keys.forEach((k, i) => {
          newObj[k] = results[i]
        })
        return newObj
      })
    })
  }

  static map (arg, mapper) {
    return this.resolve(arg).then((promises) =>
      this.all(promises.map((p, i) =>
        this.resolve(p).then((val) =>
          mapper(val, i, promises.length)
        )
      ))
    )
  }

  static reduce (arg, reducer, initial) {
    return this.resolve(arg).then((promises) => {
      if (promises.length === 0) return initial
      const r = (pAcc, p, i) =>
        this.resolve(pAcc).then((acc) =>
          this.resolve(p).then((val) =>
            reducer(acc, val, i, promises.length)))
      return initial === undefined ? promises.reduce(r) : promises.reduce(r, initial)
    })
  }

  static filter (arg, filterer) {
    return this.map(arg, (val, i, length) =>
      Promise.all([filterer(val, i, length), val])
    ).then((vals) =>
      vals.reduce((filtered, [keep, val]) => {
        if (keep) filtered.push(val)
        return filtered
      }, [])
    )
  }

  static mapSeries (arg, mapper) {
    return this.reduce(arg, (list, val, i, len) => {
      return this.resolve(mapper(val, i, len)).then((res) => {
        list.push(res)
        return list
      })
    }, [])
  }

  static each (arg, iterator) {
    return this.reduce(arg, (list, val, i, len) => {
      list.push(val)
      return this.resolve(iterator(val, i, len)).then(() => list)
    }, [])
  }

  static some (arg, num) {
    const { AggregateError } = Bluebirdish
    if (num < 0 || typeof num !== 'number' || !isFinite(num)) return this.reject(new TypeError('bluebirdish.some: num must be a positive number'))
    return this.resolve(arg).then((promises) => new Promise((resolve, reject) => {
      if (!Array.isArray(promises)) return reject(new TypeError('bluebirdish.some: not an array'))
      if (promises.length < num) return reject(new RangeError('bluebirdish.some: impossible to resolve, not enough promises'))
      if (num === 0) return resolve([])

      const completed = []
      const errored = []
      function onresolve (val) {
        if (completed.length >= num) return
        completed.push(val)
        if (completed.length >= num) resolve(completed)
      }
      function onreject (err) {
        if (completed.length >= num) return
        errored.push(err)
        if (errored.length + completed.length >= promises.length) reject(new AggregateError(errored))
      }
      for (let i = 0; i < promises.length; i++) {
        this.resolve(promises[i]).then(onresolve, onreject)
      }
    }))
  }

  static any (arg) {
    return this.some(arg, 1).get(0)
  }

  static delay (time, value) {
    return new this((resolve) =>
      setTimeout(() => resolve(value), time)
    )
  }

  static defer () {
    const resolver = {}
    resolver.promise = new this((resolve, reject) => {
      Object.assign(resolver, {
        resolve,
        reject,
        fulfill: resolve
      })
    })
    return resolver
  }

  static spawn (fn) {
    return this.resolve().then(() => {
      const iterator = fn()
      const next = (err, result) => {
        const { value, done } = err ? iterator.throw(err) : iterator.next(result)
        let p = value
        if (Array.isArray(p)) p = this.all(p)
        if (!p || !p.then) return next(new TypeError('Must yield a Promise'))
        return p.then((val) => done ? val : next(null, val))
      }
      return next()
    })
  }

  static coroutine (fn) {
    const P = this
    return (...args) => P.spawn(() => fn(...args))
  }

  static getNewLibraryCopy () {
    return makeBluebirdish()
  }
}, makeStatics())

module.exports = makeBluebirdish()

// Check if a rejection reason `err` matches `predicate`.
// If `predicate` is an Error class constructor, it checks if `err` is an instance of that class.
// If `predicate` is a function, it checks if `predicate(err)` returns true.
// If `predicate` is an object, it checks if each of its properties exist on the `err`.
function matchesPredicate (err, predicate) {
  if (typeof predicate === 'function') {
    if (predicate.prototype instanceof Error) {
      if (err instanceof predicate) {
        return true
      }
    } else if (predicate(err)) {
      return true
    }
  } else if (typeof predicate === 'object') {
    if (matches(err, predicate)) {
      return true
    }
  }
  return false
}

function matches (err, predicate) {
  return Object.keys(predicate).every((k) => predicate[k] === err[k])
}

function unsparse (sparse) {
  const arr = []
  for (let i = 0; i < sparse.length; i++) {
    if (sparse[i] === undefined && !(i in sparse)) {
      continue
    }
    arr.push(sparse[i])
  }
  return arr
}
