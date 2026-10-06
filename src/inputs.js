const DEFAULT_ARGS = "-azvr --inplace --exclude='.*' --no-perms --no-times";
const DEFAULT_SOURCE = 'public/';

/**
 * Read an input value from the environment.
 * Looks for the bare key first, then `INPUT_<key>` (the convention GitHub Actions uses).
 *
 * @since 1.0.0
 * @param {string} key        - environment variable name
 * @param {string} [fallback] - value to return if the key is unset or empty
 * @returns {string}
 */
function fromEnv(key, fallback = '') {
  const has = Object.prototype.hasOwnProperty.call(process.env, key);
  const v = has ? process.env[key] : process.env[`INPUT_${key}`];
  return v === undefined || v === null || v === '' ? fallback : v;
}

/**
 * Append a trailing slash to a path if it does not already have one.
 *
 * @since 1.0.0
 * @param {string} p - path
 * @returns {string}
 */
function ensureSlash(p) {
  return p.endsWith('/') ? p : `${p}/`;
}

/**
 * Build the configuration object from action inputs.
 *
 * @since 1.0.0
 * @returns {object}
 */
function getInputs() {
  return {
    host: fromEnv('REMOTE_HOST'),
    user: fromEnv('REMOTE_USER'),
    port: fromEnv('REMOTE_PORT', '22'),
    key: fromEnv('SSH_PRIVATE_KEY'),
    passphrase: fromEnv('SSH_PASSPHRASE', ''),
    knownHosts: fromEnv('KNOWN_HOSTS', ''),
    keyName: fromEnv('DEPLOY_KEY_NAME', 'deploy_key'),
    remotePath: fromEnv('REMOTE_PATH'),
    source: fromEnv('SOURCE', DEFAULT_SOURCE),
    rsyncArgs: fromEnv('ARGS') || fromEnv('RSYNC_ARGS', DEFAULT_ARGS),
    excludeFile: fromEnv('EXCLUDE_FILE', ''),
    extraExclude: fromEnv('EXTRA_EXCLUDE', '')
  };
}

/**
 * Resolve the remote destination path.
 *
 * @since 1.0.0
 * @param {object} cfg - configuration object from getInputs()
 * @returns {string} remote path with a trailing slash
 */
function computeDest(cfg) {
  if (!cfg.remotePath) {
    throw new Error('REMOTE_PATH is required');
  }

  return ensureSlash(cfg.remotePath);
}

/**
 * Validate required inputs. Throws if anything required is missing.
 *
 * @since 1.0.0
 * @param {object} cfg - configuration object from getInputs()
 * @returns {void}
 */
function assertRequired(cfg) {
  const missing = [];
  if (!cfg.host) missing.push('REMOTE_HOST');
  if (!cfg.user) missing.push('REMOTE_USER');
  if (!cfg.key) missing.push('SSH_PRIVATE_KEY');
  if (!cfg.remotePath) missing.push('REMOTE_PATH');
  if (missing.length) {
    throw new Error(`Missing required inputs: ${missing.join(', ')}`);
  }
}

module.exports = {
  getInputs,
  computeDest,
  assertRequired,
  ensureSlash,
  DEFAULT_ARGS,
  DEFAULT_SOURCE
};
