module.exports = {
    entry  : './src/plugins/plugins.js',
    devtool: 'source-map',
    output : {
        path     : __dirname,
        filename : './dist/plugins.dist.js'
    },
    module : {
        loaders: [ {
                test   : /.js$/,
                loader : 'babel-loader'
            }
        ]
    }
};