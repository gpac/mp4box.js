var fs   = require('fs') 
var path = require('path')
var resolve = require('resolve').sync
var rc = require('rc')
var isWin32 = process.platform === 'win32'

'use strict';

// resolvers
module.exports = [
  nativeResolve,
  nodePathResolve,
  userHomeResolve,
  nodeModulesResolve,
  globalResolve
]

function resolveFn(module, basePath, dirname) {
  try {
    return resolve(module, {
      basedir: path.join(basePath, dirname || '')
    })
  } catch (e) {}
}

// resolve using native require() function
// if NODE_PATH is define, a global module should be natively resolved
function nativeResolve(module, dirname) {
  try {
    return require.resolve(module, dirname)
  } catch (e) {}
}

// See: http://nodejs.org/docs/latest/api/modules.html#modules_loading_from_the_global_folders
// required?
function nodePathResolve(module, dirname) {
  var i, l, modulePath
  var nodePath = process.env.NODE_PATH

  if (!nodePath) { return }
  if (isWin32) { nodePath = nodePath.replace(':', ';') }
  
  nodePath = nodePath.split(';').map(function (nodepath) {
    return path.normalize(nodepath)
  })

  for (i = 0, l = nodePath.length; i < l; i += 1) {
    if (modulePath = resolveFn(module, dirname || nodePath[i])) {
      break
    }
  }

  return modulePath
}

function userHomeResolve(module) {
  var i, l, modulePath
  var homePath = isWin32 ? process.env['USERPROFILE'] : process.env['HOME']

  var paths = [ 
    'node_modules',
    'node_libraries',
    'node_packages'
  ]

  for (i = 0, l = paths.length; i < l; i += 1) {
    if (modulePath = resolveFn(module, homePath, paths[i])) {
      break;
    }
  }

  return modulePath
}

// See: https://npmjs.org/doc/files/npm-folders.html#prefix-Configuration
// it uses execPath to discover node_modules based on the node binary location
function globalResolve(module) {
  var modulePath, dirname
  var prefix = rc('npm').prefix

  if (isWin32) {
    dirname = prefix || path.dirname(process.execPath)
  }
  else {
    prefix = prefix || path.join(process.execPath, '../..')
    dirname = path.join(prefix, 'lib')
  }
  
  dirname = path.join(dirname, 'node_modules')
  modulePath = resolveFn(module, dirname)

  return modulePath
}

function nodeModulesResolve(module) {
  var i, l, modulePath
  var nodeModules = process.env['NODE_MODULES']

  if (typeof nodeModules === 'string') {
    nodeModules = nodeModules.split(';')
    for (i = 0, l = nodeModules.length; i < l; i += 1) {
      if (modulePath = resolveFn(module, nodeModules[i])) {
        break;
      }
    }
  }
  
  return modulePath
}
