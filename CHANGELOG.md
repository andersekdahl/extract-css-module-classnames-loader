# Changelog

## 0.4.0

* `css-loader` is now a peer dependency instead to avoid errors that can be caused by the user of this
  loader having another version of `css-loader` than this loader.
* New option `writeDebounceMs` that lets you override the debounce delay.
* Unnecessary option `modules` was removed since it can be assumed that you want to run the `css-loader` in 
  module mode.

## 0.3.0

* New option callback called `onAfterOutput` which is a function you can specify that will be called immediately 
  after the JSON file has been written to.

## 0.2.0

* Add support for resolving Webpack aliased files in `resolve.alias`.
* Fixes bug that made it impossible to use `[path]` and `[name]` in `localIdentName`.

## 0.1.2

* Fixes bug that made it impossible to use `composes` more than once in a class.

## 0.1.1

* Fixes bug that cause the generated class names to differ between what this loader and what `css-loader` produces.
* Catch exception from `mkpath` when it tries to create a folder that already exists.

## 0.1.0

* New option callback called `onOutput` which is a function you can specify that will be called instead of writing
  JSON to a file.