const core = require('@actions/core');
const { Storage } = require('@google-cloud/storage');

async function run() {
  try {
    const bucketName = core.getInput('bucket', { required: true });
    const prefix = core.getInput('prefix', { required: true });
    const gcpKey = core.getInput('gcp_key', { required: true });

    let credentials;
    try {
      credentials = JSON.parse(gcpKey);
    } catch (err) {
      core.setFailed(`Failed to parse gcp_key JSON: ${err}`);
      return;
    }

    const storage = new Storage({ credentials });

    // List files under prefix (returns objects whose names start with prefix)
    const [files] = await storage.bucket(bucketName).getFiles({ prefix });

    if (!files || files.length === 0) {
      core.setOutput('tag_name', 'v0');
      core.info('No matching files found, returning v0');
      return;
    }

    const nums = files
      .map((f) => {
        const m = f.name.match(/index\.v([0-9]+)\.html$/);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n) => Number.isInteger(n));

    if (nums.length === 0) {
      core.setOutput('tag_name', 'v0');
      core.info('No versioned filenames matched, returning v0');
      return;
    }

    const max = nums.reduce((a, b) => (a > b ? a : b), 0);
    const tag = `v${max}`;
    core.setOutput('tag_name', tag);
    core.info(`Latest tag: ${tag}`);
  } catch (error) {
    core.setFailed(`Error while fetching latest version from GCS: ${error}`);
  }
}

run();
