const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const { validateDir, validateFile } = require('./helpers');

/**
 * Write a private key into ~/.ssh with 0600 permissions and make sure known_hosts exists.
 *
 * @since 1.0.0
 * @param {string} key    - private key contents
 * @param {string} [name] - key file name inside ~/.ssh
 * @param {string} [home] - home directory to use
 * @returns {string} absolute path to the written key
 */
function addSshKey(key, name = 'deploy_key', home = process.env.HOME || os.homedir()) {
  const sshDir = path.join(home, '.ssh');
  validateDir(sshDir);
  validateFile(path.join(sshDir, 'known_hosts'));

  // openssh rejects keys with crlf endings or no trailing newline, which pasted secrets often have
  const normalized = `${key.replace(/\r\n?/g, '\n').trim()}\n`;
  const filePath = path.join(sshDir, name);
  fs.writeFileSync(filePath, normalized, { encoding: 'utf8', mode: 0o600 });
  console.log(`[SSH] Key written to ${filePath}`);
  return filePath;
}

/**
 * Delete a private key file, ignoring a key that is already gone.
 *
 * @since 1.1.0
 * @param {string|null} filePath - absolute path to the key file
 * @returns {void}
 */
function removeSshKey(filePath) {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch (e) {
    // already gone
  }
}

/**
 * Append known_hosts lines to ~/.ssh/known_hosts so ssh can verify the remote host fingerprint.
 *
 * @since 1.0.0
 * @param {string} knownHosts - raw known_hosts lines, e.g. from ssh-keyscan -H <host>
 * @param {string} [home]     - home directory to use
 * @returns {void}
 */
function writeKnownHosts(knownHosts, home = process.env.HOME || os.homedir()) {
  const sshDir = path.join(home, '.ssh');
  validateDir(sshDir);
  const entry = `${knownHosts.replace(/\r\n?/g, '\n').trim()}\n`;
  fs.appendFileSync(path.join(sshDir, 'known_hosts'), entry, { encoding: 'utf8', mode: 0o600 });
  console.log('[SSH] known_hosts written — strict host key verification enabled');
}

/**
 * Write known_hosts when provided, otherwise warn that host key verification is off.
 *
 * @since 1.1.0
 * @param {string} knownHosts - raw known_hosts lines, may be empty
 * @param {string} [home]     - home directory to use
 * @returns {boolean} true when strict host key checking can be enabled
 */
function configureKnownHosts(knownHosts, home = process.env.HOME || os.homedir()) {
  if (knownHosts) {
    writeKnownHosts(knownHosts, home);
    return true;
  }

  console.warn(
    '⚠️  [SSH] KNOWN_HOSTS is not set — host key verification is disabled.'
      + ' Set KNOWN_HOSTS (via ssh-keyscan -H [-p <port>] <host>) to protect against MITM attacks.'
  );
  return false;
}

/**
 * Build the ssh option arguments for host key checking.
 *
 * @since 1.1.0
 * @param {boolean} strict - whether to require a known host key
 * @returns {string[]}
 */
function hostKeyArgs(strict) {
  return ['-o', `StrictHostKeyChecking=${strict ? 'yes' : 'no'}`];
}

/**
 * Strip the passphrase from a private key file in-place so rsync can use it
 * directly with -i. Uses spawn to avoid shell injection with special characters.
 *
 * @since 1.0.0
 * @param {string} keyPath    - absolute path to the private key file
 * @param {string} passphrase - current passphrase protecting the key
 * @returns {Promise<void>}
 */
function removePassphrase(keyPath, passphrase) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ssh-keygen', ['-p', '-P', passphrase, '-N', '', '-f', keyPath]);
    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ssh-keygen failed (exit ${code}): ${stderr}`));
        return;
      }
      console.log('[SSH] Key unlocked for deployment');
      resolve();
    });
  });
}

module.exports = {
  addSshKey,
  removeSshKey,
  writeKnownHosts,
  configureKnownHosts,
  hostKeyArgs,
  removePassphrase
};
