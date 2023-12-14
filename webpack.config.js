const path = require('path');
const CustomFunctionsMetadataPlugin = require('custom-functions-metadata-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        functions: './src/functions/functions.js',
        // taskpane: ['./src/taskpane/taskpane.html'],
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
        clean: true
    },
    resolve: {
        alias: {
            '@src': path.resolve(__dirname, 'src'), // Add this alias
        },
        extensions: ['.js', '.ts', '.tsx'],
        symlinks: false,
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                include: path.resolve(__dirname, 'src'),
                use: 'ts-loader',
            },
            {
                test: /\.tsx$/,
                exclude: /node_modules/,
                include: path.resolve(__dirname, 'src'),
                use: 'ts-loader',
            },
            {
                test: /\.css$/,
                include: path.resolve(__dirname, 'src'),
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource'
            },
            // {
            //     test: /\.html$/,
            //     include: path.resolve(__dirname, 'src'),
            //     loader: 'html-loader',
            // },
        ],
    },
    node: false,
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: './src/taskpane/taskpane.html', to: '' },
            ]
        }),
        new CustomFunctionsMetadataPlugin({
            output: 'functions.json',
            input: './src/functions/functions.js'
        })
    ]
}