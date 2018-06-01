module.exports = class Bluebirdish extends Promise {
  static get TypeError () { return TypeError } // alias

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

  reduce (fn, initial) {
    return this.constructor.reduce(this, fn, initial)
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
    return this.then((obj) => obj[prop])
  }

  'return' (value) {
    return this.then(() => value)
  }

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

  // Bluebird accepts a Promise for an Array in `all` and `race`.
  static all (arg) {
    return this.resolve(arg).then((arr) => super.all(arr))
  }
  static race (arg) {
    return this.resolve(arg).then((arr) => super.race(arr))
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
}

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
