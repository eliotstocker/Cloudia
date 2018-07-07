Development
===========

it is not required that Cloudia Be built, you can run the JavaScript and Less directly in the browser, and locally install and link to the dependencies (Bellow).
The build process uses The Less and Closure Compilers to generate a smaller build with runtime dependencies baked in.

Run Time Dependencies
---------------------

These dependencies are built into Cloudia.min.js
1. [NanoAjax](https://github.com/yanatan16/nanoajax)

Build
-----

To build you must have grunt CLI installed, you install with NPM with the following command:
```
npm -g i grunt-cli
```

Once grunt cli is installed you can run the build by running:
```
npm install
npm run build
```
