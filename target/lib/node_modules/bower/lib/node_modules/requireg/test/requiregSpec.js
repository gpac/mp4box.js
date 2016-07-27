var expect = require('expect.js')
var resolvers = require('rewire')('../lib/resolvers')
require.cache[require.resolve('../lib/resolvers')] = { exports: resolvers }
var requiregModule = require('../lib/requireg')

var isWin32 = process.platform === 'win32'
var homeVar = isWin32 ? 'USERPROFILE' : 'HOME'
var homePath = process.env[homeVar]

describe('requireg', function () {

  it('should be a function', function () {
    expect(requiregModule).to.be.a('function')
  })

  describe('requireg API', function () {
    
    it('should globalize', function () {
      requiregModule.globalize()
      expect(requireg).to.be.a('function')
    })

  })

  describe('local modules', function () {

    it('should resolve a local module', function () {
      expect(requiregModule('expect.js')).to.be.equal(expect)
    })

    it('should throw an Error exception when no local module exists', function () {
      expect(function () { requiregModule('nonexistent') }).to.throwError()
    })

  })

  describe('global modules', function () {

    describe('resolve via NODE_PATH', function () {

      before(function () {
        process.env.NODE_PATH = __dirname + '/fixtures/lib'
      })

      after(function () {
        process.env.NODE_PATH = ''
      })

      it('should resolve the beaker package', function () {
        expect(requiregModule('beaker')).to.be.true
      })

      it('should have the expected module path', function () {
        expect(requiregModule.resolve('beaker'))
          .to.be.equal(__dirname + '/fixtures/lib/node_modules/beaker/index.js')
      }) 

    })

    describe('resolve via $HOME', function () {

      before(function () {
        process.env[homeVar] = __dirname + '/fixtures/lib'
      })

      after(function () {
        process.env[homeVar] = homePath
      })

      it('should resolve the beaker package', function () {
        expect(requiregModule('beaker')).to.be.true
      })

    })

    describe('resolve via $NODE_MODULES', function () {

      before(function () {
        process.env.NODE_MODULES = __dirname + '/fixtures/lib'
      })

      after(function () {
        process.env.NODE_MODULES = ''
      })

      it('should resolve the beaker package', function () {
        expect(requiregModule('beaker')).to.be.true
      })

    })

    describe('resolve via node execution path', function () {
      var execPath = process.execPath
      var rc = require('rc')

      before(function () {
        process.execPath = __dirname + '/fixtures/bin/node'
        resolvers.__set__('rc', function () { return {} })
      })

      after(function () {
        process.execPath = execPath
        resolvers.__set__('rc', rc)
      })

      it('should resolve the beaker package', function () {
        expect(requiregModule('beaker')).to.be.true
      })

      it('should have the expected module path', function () {
        expect(requiregModule.resolve('beaker'))
          .to.be.equal(__dirname + '/fixtures/lib/node_modules/beaker/index.js')
      })

    })

    describe('resolve via npm prefix', function () {
      var rc = require('rc')

      before(function () {
        resolvers.__set__('rc', function () {
          return {
            prefix: __dirname + (isWin32 ? '/fixtures/lib' : '/fixtures')
          }
        })
      })

      after(function () {
        resolvers.__set__('rc', rc)
      })

      it('should resolve the beaker package', function () {
        expect(requiregModule('beaker')).to.be.true
      })

      it('should have the expected module path', function () {
        expect(requiregModule.resolve('beaker'))
          .to.be.equal(__dirname + '/fixtures/lib/node_modules/beaker/index.js')
      })

    })

  })

})