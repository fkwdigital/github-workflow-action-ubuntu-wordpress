# Ubuntu Workflow Action for WordPress

GitHub workflow action customized specifically for WordPress deployments on Ubuntu servers, but can be adjusted to work with any kind of typical website setup.

Rsync‑over‑SSH deploy with:

- Always‑on WordPress excludes with ability to extend or override
- `public/` (override with `SOURCE`) contents deploy to specified remote root folder
- Ability to override `rsync` default flags provided

## Inputs

### Required

- `REMOTE_HOST` - SSH host address
- `REMOTE_USER` - SSH username
- `SSH_PRIVATE_KEY` - SSH private key for authentication
- `REMOTE_PATH` - Remote destination path (absolute path required)

### Optional

- `REMOTE_PORT` - SSH port (default: `22`)
- `SOURCE` - Local source directory to deploy (default: `public/`)
- `ARGS` or `RSYNC_ARGS` - Custom rsync flags (default: `-azvr --inplace --exclude='.*' --no-perms --no-times --delete-after`)
- `EXCLUDE_FILE` - Path to custom exclude file (completely replaces default excludes)
- `EXTRA_EXCLUDE` - Comma-separated list of additional excludes (appends to default excludes)

## Path Configuration

`REMOTE_PATH` is **required** and must be an absolute path to your WordPress installation.

**Common Ubuntu WordPress paths:**

- `/var/www/html` - Standard Apache/Nginx default
- `/var/www/yourdomain.com/public_html` - Virtual host setup
- `/home/username/public_html` - User-based hosting
- `/usr/share/nginx/html` - Some Nginx configurations

**Example:**

```yaml
REMOTE_PATH: '/var/www/html'
```

The action deploys the contents of your `SOURCE` directory into `REMOTE_PATH`.

## Usage

See example in `.github/workflows/deploy.yml` and in this doc.

## Default Excludes

These files are **excluded by default** from deployment to protect your live WordPress installation. You can override this list with `EXCLUDE_FILE`, or append to this list with `EXTRA_EXCLUDE`

```javascript
const ALWAYS_EXCLUDE = [
  '*~',
  '.git',
  '.github',
  '.gitignore',
  '.DS_Store',
  '.svn',
  '.cvs',
  '*.bak',
  '*.swp',
  'Thumbs.db',
  '*.log',
  '.env',
  '.smushit-status',
  '.gitattributes',
  '/db-config.php',
  '/index.php',
  '/wp-activate.php',
  '/wp-admin/',
  '/wp-app.php',
  '/wp-atom.php',
  '/wp-blog-header.php',
  '/wp-comments-post.php',
  '/wp-commentsrss2.php',
  '/wp-config.php',
  '/wp-content/advanced-cache.php',
  '/wp-content/backup-db/',
  '/wp-content/blogs.dir/',
  '/wp-content/breeze-config/',
  '/wp-content/cache/',
  '/wp-content/drop-ins/',
  '/wp-content/index.php',
  '/wp-content/mu-plugins/',
  '/wp-content/mysql.sql',
  '/wp-content/object-cache.php',
  '/wp-content/plugins/',
  '/wp-content/themes/index.php',
  '/wp-content/themes/twenty*',
  '/wp-content/themes/variations/',
  '/wp-content/upgrade*',
  '/wp-content/uploads/',
  '/wp-content/webp-express',
  '/wp-content/wp-cache-config.php',
  '/wp-cron.php',
  '/wp-feed.php',
  '/wp-includes/',
  '/wp-links-opml.php',
  '/wp-load.php',
  '/wp-login.php',
  '/wp-mail.php',
  '/wp-pass.php',
  '/wp-rdf.php',
  '/wp-register.php',
  '/wp-rss.php',
  '/wp-rss2.php',
  '/wp-salt.php',
  '/wp-settings.php',
  '/wp-signup.php',
  '/wp-trackback.php',
  '/xmlrpc.php'
];
```

## Customizing Excludes

### Add to Default Excludes

Keep all default excludes and add more:

```yaml
EXTRA_EXCLUDE: 'custom-config.php,/wp-content/custom-cache/'
```

### Replace Default Excludes

Provide your own exclude file (replaces ALL defaults):

```yaml
EXCLUDE_FILE: './deploy/excludes.txt'
```

Create `excludes.txt` with one pattern per line:

```text
*.log
.env
/wp-config.php
node_modules/
```

### WARNING!
When specifying excludes, **be sure that the path matches exactly to the file you are looking to exclude**. Vague lines will create unintended consequences! For example, adding `index.php` will also exclude the `index.php` file in your theme folders. Use `/index.php` to specify the root index file only.

## Usage Examples

### Basic Deployment to /var/www/html

```yaml
name: Deploy to Ubuntu Server
on:
  push:
    branches: [prd]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Server
        uses: fkwdigital/github-workflow-action-ubuntu-wordpress@v1
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          REMOTE_PATH: '/var/www/html'
          SOURCE: './public/'
```

### Deploy with Custom Excludes

```yaml
- name: Deploy with Additional Excludes
  uses: fkwdigital/github-workflow-action-ubuntu-wordpress@v1
  with:
    SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
    REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
    REMOTE_USER: ${{ secrets.REMOTE_USER }}
    REMOTE_PATH: '/var/www/html'
    SOURCE: './public/'
    EXTRA_EXCLUDE: '/wp-content/custom-cache/,debug.log,*.tmp'
```

### Deploy with Delete After

```yaml
- name: Deploy with Delete After
  uses: fkwdigital/github-workflow-action-ubuntu-wordpress@v1
  with:
    SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
    REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
    REMOTE_USER: ${{ secrets.REMOTE_USER }}
    REMOTE_PATH: '/var/www/html'
    SOURCE: './public/'
    ARGS: "-azvr --inplace --exclude='.*' --no-perms --no-times --delete-after"
```

### Deploy to Virtual Host Directory

```yaml
- name: Deploy to Virtual Host
  uses: fkwdigital/github-workflow-action-ubuntu-wordpress@v1
  with:
    SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
    REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
    REMOTE_USER: ${{ secrets.REMOTE_USER }}
    REMOTE_PATH: '/var/www/mysite.com/public_html'
    SOURCE: './public/'
```

### Deploy to User Home Directory

```yaml
- name: Deploy to User Directory
  uses: fkwdigital/github-workflow-action-ubuntu-wordpress@v1
  with:
    SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
    REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
    REMOTE_USER: ${{ secrets.REMOTE_USER }}
    REMOTE_PATH: '/home/username/public_html'
    SOURCE: './public/'
```

### Deploy with Custom Exclude File

```yaml
- name: Deploy with Custom Exclude File
  uses: fkwdigital/github-workflow-action-ubuntu-wordpress@v1
  with:
    SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
    REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
    REMOTE_USER: ${{ secrets.REMOTE_USER }}
    REMOTE_PATH: '/var/www/html'
    SOURCE: './public/'
    EXCLUDE_FILE: './deploy/excludes.txt'
```

### Deploy with Custom Port

```yaml
- name: Deploy with Custom SSH Port
  uses: fkwdigital/github-workflow-action-ubuntu-wordpress@v1
  with:
    SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
    REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
    REMOTE_USER: ${{ secrets.REMOTE_USER }}
    REMOTE_PORT: 2222
    REMOTE_PATH: '/var/www/html'
    SOURCE: './public/'
```

## Troubleshooting

### Missing required inputs: REMOTE_PATH

You must specify the `REMOTE_PATH` input. The workflow makes no assumptions about where your remote files are located.

### Permission Denied

Ensure your SSH key has access to the remote server and the `REMOTE_PATH` directory has proper write permissions for the user or group associated with your SSH key.

### rsync: failed to set times

This is expected with `--no-times` flag. Files are deployed successfully.

### No space left on device

Check available disk space on remote server. Consider using `--delete-after` flag to remove old files.

### Wrong directory deployed

Verify your `REMOTE_PATH` is correct. Common paths:

- Apache/Nginx default: `/var/www/html`
- Virtual hosts: `/var/www/yourdomain.com`
- User directories: `/home/username/public_html`

## License

MIT

## Support

- **Action Issues**: Open an issue on this repository
