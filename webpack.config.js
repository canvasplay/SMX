module.exports = {
  entry  : './src/index.js',
  devtool: 'source-map',
  output : {
      path     : __dirname,
      filename : './dist/smx.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  }
  
};