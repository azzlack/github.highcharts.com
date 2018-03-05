/**
 * Handles all procedures with interpreting a request from the user.
 * Looks at the request url and finds out which version of and file from the Highcharts library to return.
 * @author Jon Arild Nygard
 * @todo Add license
 */
'use strict'
const {
  isArray,
  isObject,
  isString
} = require('./utilities')

/**
 * Returns fileOptions for the build script
 * @return {Object} Object containing all fileOptions
 */
const getFileOptions = (files, options) => {
  let result = {}
  if (isArray(files) && isObject(options)) {
    const keys = Object.keys(options)
    result = files
      .reduce((obj, filename) => {
        keys.forEach(k => {
          if (filename.indexOf(k) > -1) {
            const current = obj[filename] || {}
            const latest = options[k]
            obj[filename] = Object.assign(current, latest)
          }
        })
        return obj
      }, {})
    // Converts exclude strings to RegExp
    Object.keys(result).forEach(filename => {
      const options = result[filename]
      const exclude = options.exclude
      if (isString(exclude)) {
        options.exclude = new RegExp(exclude)
      }
    })
  }
  return result
}

/**
 * Return which branch/tag/commit to gather the file from. Defaults to master.
 * @param  {string} url Request url
 * @return {string} Returns which branch/tag/commit to look in.
 */
const getBranch = url => {
  const folders = ['adapters', 'indicators', 'modules', 'parts-3d', 'parts-map', 'parts-more', 'parts', 'themes']
  const branchTypes = ['bugfix', 'feature']
  let branch = 'master'
  let sections = url.substring(1).split('/')
  const isValidBranchName = (str) => (
    // Not a type
    !['css', 'js'].includes(str) &&
    // Not a lib type
    !['stock', 'maps'].includes(str) &&
    // Not a parts folder
    !folders.includes(str) &&
    // Not a file
    !(str.endsWith('.js') || str.endsWith('.css'))
  )

  // We have more then one section
  if (sections.length > 1) {
    if (branchTypes.includes(sections[0])) {
      branch = (
        (sections.length > 2 && isValidBranchName(sections[1]))
        ? sections[0] + '/' + sections[1]
        : sections[0]
      )
    /**
     *  If the url has more then 1 section,
     *  and the first section is not indicating one of the js folders,
     *  then assume first section is a branch/tag/commit
     */
    } else if (isValidBranchName(sections[0])) {
      branch = sections[0]
    }
  }
  return branch
}

/**
 * Returns which type of Highcharts build to serve. Can either be classic or css. Defaults to classic.
 * @param  {string} branch Branch to look in
 * @param  {string} url Request url
 * @returns {string} Returns which type to build
 */
const getType = (branch, url) => {
  let type = 'classic'
  let u = url.substring(1)
  if (u.startsWith(branch)) {
    u = u.replace(branch + '/', '')
  }
  let sections = u.split('/')
  /**
   * If the first section is either stock or maps, then remove it.
   */
  if (sections[0] === 'stock' || sections[0] === 'maps') {
    sections.splice(0, 1)
  }
  // Check if it is a .js file
  if (sections[0] === 'js') {
    type = 'css'
  }
  return type
}

/**
 * Returns the filename, or false if it is not a js file.
 * @param  {string} branch Branch to look in
 * @param  {string} url Request url
 * @return {boolean|string} Returns false if not a js file. Otherwise returns filename.
 */
const getFile = (branch, type, url) => {
  let filename = false
  let u = url.substring(1)
  if (u.startsWith(branch)) {
    u = u.replace(branch + '/', '')
  }
  let sections = u.split('/')
  /**
   * If the first section is either stock or maps, then remove it.
   */
  if (['stock', 'maps'].includes(sections[0])) {
    sections.splice(0, 1)
  }
  // Remove branch from path
  if (type === 'css' && sections[0] === 'js') {
    sections.splice(0, 1)
  }
  // Check if it is a .js file
  if (sections.length > 0 && sections[sections.length - 1].endsWith('.js')) {
    filename = sections.join('/')
    // Redirect .js requests to .src.js
    if (!filename.endsWith('.src.js')) {
      filename = filename.replace('.js', '.src.js')
    }
  }
  return filename
}

module.exports = {
  getBranch,
  getFile,
  getFileOptions,
  getType
}
