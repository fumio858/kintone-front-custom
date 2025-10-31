module.exports = {
  entry: {
    'record-priority': './record-priority/index.js',
    'record-deferred': './record-deferred/index.js',
    portal: './portal/index.js',
    task: './task/index.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].bundle.js'
  },
  mode: 'production'
};