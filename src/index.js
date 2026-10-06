const path = require('path');

const { getInputs, computeDest, assertRequired } = require('./inputs');
const { ALWAYS_EXCLUDE } = require('./excludes');
const { readExcludeFile, splitList, splitArgsPreserveQuotes } = require('./helpers');
const { addSshKey, removeSshKey, configureKnownHosts, hostKeyArgs, removePassphrase } = require('./sshKey');
const { ensureRsync, runRsync } = require('./rsyncCli');

// path to the written key file — set in main(), removed on exit
let deployKeyPath = null;
process.on('exit', () => removeSshKey(deployKeyPath));

/**
 * Deploy the source folder to the remote server over rsync + SSH.
 *
 * @since 1.0.0
 * @returns {Promise<void>}
 */
async function main() {
  const cfg = getInputs();
  assertRequired(cfg);

  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const remoteDest = `${cfg.user}@${cfg.host}:${computeDest(cfg)}`;
  const localSrc = path.posix.join(workspace, cfg.source.endsWith('/') ? cfg.source : `${cfg.source}/`);

  // merge excludes: always-on + file + extra
  const excludes = [...ALWAYS_EXCLUDE, ...readExcludeFile(workspace, cfg.excludeFile), ...splitList(cfg.extraExclude)];

  console.log(`[deploy] Source → ${localSrc}`);
  console.log(`[deploy] Dest → ${remoteDest}`);
  console.log(`[deploy] Rsync → ${cfg.rsyncArgs}`);
  console.log(`[deploy] Excludes → ${excludes.length}`);

  const keyPath = addSshKey(cfg.key, cfg.keyName);
  deployKeyPath = keyPath;
  const strictHostKeys = configureKnownHosts(cfg.knownHosts);

  if (cfg.passphrase) {
    await removePassphrase(keyPath, cfg.passphrase);
  }

  await ensureRsync();

  const stdout = await runRsync({
    src: localSrc,
    dest: remoteDest,
    args: splitArgsPreserveQuotes(cfg.rsyncArgs),
    privateKey: keyPath,
    port: cfg.port,
    excludes,
    sshArgs: hostKeyArgs(strictHostKeys)
  });
  console.log('✅ [rsync] completed');
  if (stdout) console.log(stdout);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('⚠️  [deploy] error:', e.message);
    process.exit(1);
  });
