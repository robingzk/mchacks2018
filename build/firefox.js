const shell = require('shelljs')

console.log('Building...')
shell.exec('mkdir -p dist/')
shell.exec('cp -r assets/ dist/assets')
shell.exec('babel src -d dist --extensions \".ts\"')