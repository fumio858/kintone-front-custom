module.exports = {
  entry: {
    record: './record/index.js',
    portal: './portal/index.js',
    task: './task/index.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].bundle.js'
  },
  mode: 'production'
};