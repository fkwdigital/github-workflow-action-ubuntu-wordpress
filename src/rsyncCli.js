const { exec } = require('child_process');
const rsync = require('rsyncwrapper');
const { sync: commandExists } = require('command-exists');

const DEFAULT_INSTALL_CMD = 'sudo apt-get update && sudo apt-get --no-install-recommends install -y rsync';

/**
 * Make sure the rsync binary is available, installing it when missing.
 *
 * @since 1.0.0
 * @param {string} [installCmd] - shell command used to install rsync
 * @returns {Promise<void>}
 */
function ensureRsync(installCmd = DEFAULT_INSTALL_CMD) {
  return new Promise((resolve, reject) => {
    if (commandExists('rsync')) {
      resolve();
      return;
    }
    console.log('[CLI] rsync not found, installing...');
    exec(installCmd, (err) => {
      if (err) {
        reject(new Error(`rsync install failed: ${err.message}`));
        return;
      }
      console.log('✅ [CLI] rsync installed');
      resolve();
    });
  });
}

/**
 * Run rsync over SSH and resolve with its stdout.
 *
 * @since 1.1.0
 * @param {object} opts
 * @param {string} opts.src          - local source path
 * @param {string} opts.dest         - remote destination (user@host:path)
 * @param {string[]} opts.args       - extra rsync arguments
 * @param {string} opts.privateKey   - path to the SSH private key
 * @param {string|number} opts.port  - SSH port
 * @param {string[]} [opts.excludes] - exclude patterns, applied before args
 * @param {string[]} [opts.sshArgs]  - extra ssh arguments
 * @returns {Promise<string>}
 */
function runRsync({ src, dest, args, privateKey, port, excludes = [], sshArgs = ['-o', 'StrictHostKeyChecking=no'] }) {
  return new Promise((resolve, reject) => {
    rsync(
      {
        src,
        dest,
        args,
        privateKey,
        port,
        excludeFirst: excludes,
        ssh: true,
        sshCmdArgs: sshArgs,
        recursive: true
      },
      (error, stdout, stderr, cmd) => {
        if (error) {
          reject(new Error(`rsync failed: ${error.message}\nstderr: ${stderr || ''}\ncmd: ${cmd || ''}`));
          return;
        }
        resolve(stdout);
      }
    );
  });
}

module.exports = {
  ensureRsync,
  runRsync
};
