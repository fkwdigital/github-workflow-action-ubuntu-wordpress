const path = require('path');
const fs = require('fs');

/**
 * Create a directory (and any missing parents) if it does not exist.
 *
 * @since 1.0.0
 * @param {string} dir - absolute directory path
 * @returns {void}
 */
function validateDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Create an empty file with 0600 permissions if it does not exist.
 *
 * @since 1.0.0
 * @param {string} filePath - absolute file path
 * @returns {void}
 */
function validateFile(filePath) {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '', { encoding: 'utf8', mode: 0o600 });
}

/**
 * Read an rsync --exclude-from style file into a list of patterns, skipping blanks and comments.
 *
 * @since 1.0.0
 * @param {string} workspace - base directory for relative paths
 * @param {string} relPath   - path to the exclude file, relative or absolute
 * @returns {string[]}
 */
function readExcludeFile(workspace, relPath) {
  if (!relPath) return [];
  const p = path.isAbsolute(relPath) ? relPath : path.join(workspace, relPath);
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

/**
 * Split a comma-separated list into trimmed, non-empty values.
 *
 * @since 1.1.0
 * @param {string} str - comma-separated values
 * @returns {string[]}
 */
function splitList(str) {
  return (str || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Split a shell-style argument string on whitespace, keeping quoted segments together and stripping outer quotes.
 *
 * @since 1.0.0
 * @param {string} str - argument string
 * @returns {string[]}
 */
function splitArgsPreserveQuotes(str) {
  const tokens = (str || '').match(/(?:[^\s'"]+|'[^']*'|"[^"]*")+/g) || [];
  return tokens.map((t) => t.replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1'));
}

module.exports = {
  validateDir,
  validateFile,
  readExcludeFile,
  splitList,
  splitArgsPreserveQuotes
};
