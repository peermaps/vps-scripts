#!/usr/bin/env node
var Hyperdrive = require('hyperdrive')
var fs = require('fs')
var path = require('path')
var pump = require('pump')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: { b: 'bootstrap' }
})

if (argv._[0] === 'import') {
  var hdir = argv.o || '.hyperdrive'
  var drive = new Hyperdrive(hdir)
  var cursors = [argv._[1]]
  var count = { files: 0, directories: 1 }
  var errors = []
  var prevLines = 0
  var iv = setInterval(print, 1000)
  function error(err) {
    errors.push({ time: Date.now(), error: err })
  }
  function print() {
    var clear = '\x1b[K'
    for (var i = 0; i < prevLines; i++) {
      clear += '\x1b[1A\x1b[K'
    }
    prevLines = 1 + errors.length
    var nFile = fmt(count.files).padStart(9)
    var nDir = fmt(count.directories).padStart(9)
    console.log(`${clear}${nFile} files, ${nDir} directories`)
    errors.forEach(function (e) {
      console.log('Error: ' + e.error.message)
    })
    errors = errors.filter(e => Date.now() - e.time < 5*60_000) // show for 5 minutes
  }
  ;(function next() {
    if (cursors.length === 0) {
      clearInterval(iv)
      print()
      return
    }
    var c = cursors.shift()
    fs.readdir(c, function (err, files) {
      if (err) {
        error(err)
        return next()
      }
      files = files.filter(file => !/^\./.test(file))
      var pending = 1 + files.length
      files.forEach(function (f) {
        var file = path.join(c,f)
        fs.stat(file, function (err, stat) {
          if (err) {
            error(err)
            if (--pending === 0) next()
            return
          } else if (stat.isDirectory()) {
            drive.mkdir(file, function (err) {
              if (err) error(err)
              else {
                count.directories++
                cursors.push(file)
              }
              if (--pending === 0) next()
            })
          } else {
            fs.readFile(file, function (err, src) {
              if (err) {
                error(err)
                if (--pending === 0) next()
                return
              }
              drive.writeFile(file, src, function (err) {
                if (err) error(err)
                else count.files++
                if (--pending === 0) next()
              })
            })
          }
        })
      })
      if (--pending === 0) next()
    })
  })()
} else if (argv._[0] === 'addr') {
  var drive = new Hyperdrive(argv.o || argv._[1] || '.hyperdrive')
  drive.once('ready', function () {
    console.log(`hyper://${drive.key.toString('hex')}`)
  })
} else if (argv._[0] === 'share') {
  var drive = new Hyperdrive(argv.o || argv._[1] || '.hyperdrive')
  drive.once('ready', function () {
    console.log(`hyper://${drive.key.toString('hex')}`)
    var swarm = require('hyperswarm')()
    var crypto = require('crypto')
    swarm.join(drive.discoveryKey, { lookup: true, announce: true })
    swarm.on('connection', (socket, info) => {
      socket.on('error', err => console.error(err))
      pump(socket, drive.replicate(info.client), socket, function (err) {
        console.error('err=',err)
      })
    })
    swarm.on('error', err => console.error(err))
  })
}

function fmt(x) {
  return x.toString()
    .split('')
    .reverse()
    .join('')
    .replace(/(\d{3})/g,'$1_')
    .split('')
    .reverse()
    .join('')
    .replace(/^_/,'')
}
