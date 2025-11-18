module.exports = {
  entry: {
    'record-priority': './src/record-priority/index.js',
    'record-deferred': './src/record-deferred/index.js',
    portal: './src/portal/index.js',
    task: './src/task/index.js',
    common: './src/common/index.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].bundle.js'
  },
  mode: 'production'
};