import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import html from 'rollup-plugin-html';
import image from '@rollup/plugin-image';
import livereload from 'rollup-plugin-livereload'
import nodeResolve from 'rollup-plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import replace from 'rollup-plugin-replace';
import serve from 'rollup-plugin-serve';
import {terser} from "rollup-plugin-terser";
import typeScript from 'rollup-plugin-typescript2';


const getPlugins = (options) => [
    nodeResolve(),
    commonjs(),
    babel({
      exclude: 'node_modules/**'
    }),
		html(),
		image(),
    livereload({
      watch: 'dist'
    }),
    postcss({
      extensions: ['.css']
    }),
    replace({
      'process.env.NODE_ENV': '"production"',
    }),
    serve({
      open: true,
      contentBase: ['dist']
    }),
    typeScript({
        tsconfig: 'tsconfig.json',
        tsconfigOverride: { compilerOptions: { 'target': options.target } }
    }),
    terser(),
];

export default {
    input: './src/index.ts',
    output: {
        file: './dist/index.min.js',
        format: 'iife',
        name: 'bundle'
    },
    plugins: getPlugins({
      target: 'es6',
    })
}
