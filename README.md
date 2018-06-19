# bluebirdish

bluebird's fancy api but with native promises

Works in environments with native Promises and class syntax!

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/bluebirdish.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/bluebirdish
[travis-image]: https://img.shields.io/travis/goto-bus-stop/bluebirdish.svg?style=flat-square
[travis-url]: https://travis-ci.org/goto-bus-stop/bluebirdish
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

## Install

```
npm install bluebirdish
```

## Usage

```js
var Bluebirdish = require('bluebirdish')
```

## API

The API is the same as [Bluebird](http://bluebirdjs.com/docs/getting-started.html)'s. These features are implemented:

- [x] .then()
- [x] .spread()
- [x] .catch()
- [x] .finally()
- [x] Promise.resolve()
- [x] Promise.reject()
- [x] Promise.join()
- [x] Promise.try()
- [x] Promise.method()
- [x] Promise.all()
- [x] Promise.props()
- [x] Promise.any()
- [x] Promise.some()
- [x] Promise.map()
- [x] Promise.reduce()
- [x] Promise.filter()
- [x] Promise.each()
- [x] Promise.mapSeries()
- [x] Promise.race()
- [ ] Promise.using()
- [ ] .disposer()
- [ ] Promise.promisify()
- [ ] Promise.promisifyAll()
- [ ] Promise.fromCallback()
- [x] .asCallback(), .nodeify()
- [x] Promise.delay()
- [ ] .timeout()
- [ ] .cancel()
- [x] Promise.coroutine()
  - [ ] Promise.coroutine.addYieldHandler()
- [x] Promise.spawn()
- [x] .tap()
- [x] .tapCatch()
- [x] .call()
- [x] .get()
- [x] .return()
- [x] .throw()
- [x] .catchReturn()
- [x] .catchThrow()
- [ ] .reflect()
- [x] Promise.getNewLibraryCopy()
- [ ] OperationalError
- [ ] TimeoutError
- [ ] CancellationError
- [x] AggregateError

## License

[Apache-2.0](LICENSE.md)
