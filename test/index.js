'use strict'
/**
 * Monkeypatch support for returning Promises from Tape tests. Mostly just
 * copied some code from Tape.
 */

const Test = require('tape/lib/test')
Test.prototype.run = function run () {
  if (this._skip) {
    this.comment(`SKIP ${this.name}`)
  }
  if (!this._cb || this._skip) {
    return this._end()
  }
  if (this._timeout != null) {
    this.timeoutAfter(this._timeout)
  }
  this.emit('prerun')

  // Start custom code
  const result = this._cb(this)
  if (result && result.then) {
    result.then(
      () => this.end(),
      (err) => {
        err ? this.error(err) : this.fail(err)
        this.end()
      }
    )
  }
  // End custom code

  this.emit('run')
}

try {
  Function('const { a } = b') // eslint-disable-line
} catch (err) {
  require('buble/register')
}

require('./any')
require('./call')
require('./each')
require('./filter')
require('./get')
require('./getNewLibraryCopy')
require('./map')
require('./nodeify')
require('./props')
require('./race')
require('./reduce')
require('./some')
require('./spread')
require('./tap')
require('./try')
