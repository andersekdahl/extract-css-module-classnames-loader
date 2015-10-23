# extract-css-module-classnames-loader

This is a webpack loader that complements the `css-loader`. `css-loader` can be used in module mode to export hashed class names. That works great if you only want to use CSS Modules from Javascript, but if you want to use it server side from another language than Javascript this module can help you.

It's a loader that doesn't transform anything, but just parses out the exported class names and writes them to a JSON file to consume on the server.

## Installation

```
npm install extract-css-module-classnames-loader --save
```

## Usage

This loader takes the same query parameters as the `css-loader` and three more:
* `rootPath` is the common root path for all your css files. It is used to strip the base path in the JSON output.
* `outputFile` is the (full) path and file name of the json file to write the class names to.
* `minimalJson` is if you want the outputted JSON to be indented or not.

### Other output than JSON

If you don't want to output the JSON to a file, you can specify your own output handling function in your webpack config. You specify it like this:

```
modules.export = {
  entry: ...,
  output: {
    ...
  },
  extractCssModuleClassnames: {
    onOutput: function (fileName, curr, all) {

    }
  }
}
```

The first argument is the absolute path to the currently processed file and the second argument is the classes for that file. The third argument is class names for all previously processed files. Note that this function will get called once for every file during a build, so if you're writing to disk you probably want to debounce that.  

### Trigger something when the JSON file has been written to

If you want to perform something after the JSON file has been written to, you can specify a `onAfterOutput` function in
the config like this:

```
modules.export = {
  entry: ...,
  output: {
    ...
  },
  extractCssModuleClassnames: {
    onAfterOutput: function (fileName, curr, all) {

    }
  }
}
```

This can be used if you don't want to take over outputting the JSON to a file, but still want to perform something
after that has happened. The parameters passed to this function is the same as `onOutput`.

_Note! This method won't get called if you implement `onOutput`_

## Example webpack config
```
var cssLoaderOptions = {
  modules: true,
  importLoaders: 2
};

var extractCssClassnamesOptions = {
  rootPath: path.join(__dirname, '../', 'src'),
  outputFile: path.join(__dirname, '../', 'build', 'assets', 'css-classes.json'),
  modules: true
};

cssLoaders.push({
  test: /\.css$/,
  loader: [
    'style',
    'css?' + JSON.stringify(cssLoaderOptions),
    'extract-css-module-classnames?' + JSON.stringify(extractCssClassnamesOptions)
  ].join('!')
});
```

## Example output
For these two files:
```
// styles/base.css
.red {
  background: red;
}

// styles/other.css
.alsoRed {
  composes: red from './base.css';
}
```

This will get generated:
```
{
  "styles/base.css": {
    "red": [
      "_5u8_Nx6zE6tDKOFwnKdFn"
    ]
  },
  "styles/other.css": {
    "alsoRed": [
      "O0wvfplwbP4cnCkmkMJqV",
      [
        "styles/base.css",
        "red"
      ]
    ]
  }
}
```

## License

MIT
