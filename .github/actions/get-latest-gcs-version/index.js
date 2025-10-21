// List GCS objects and print highest index as "vNN" (or "v0" if none found).
// Usage (invoked by composite action):
//   node index.js <bucketName> <prefix>
// Expects service account JSON string in env var GCP_KEY

const { Storage } = require('@google-cloud/storage');

async function main() {
  try {
    const bucketName = process.argv[2];
    const prefix = process.argv[3];

    if (!bucketName) {
      console.error('Error: bucket name not provided as first argument.');
      process.exit(2);
    }
    if (!prefix) {
      console.error('Error: prefix not provided as second argument.');
      process.exit(2);
    }

    const gcpKey = process.env.GCP_KEY;
    if (!gcpKey) {
      console.error(
        'Error: GCP_KEY env var is not set (expected service account JSON).',
      );
      process.exit(2);
    }

    let credentials;
    try {
      credentials = JSON.parse(gcpKey);
    } catch (err) {
      console.error('Error: failed to parse GCP_KEY JSON:', err);
      process.exit(2);
    }

    const storage = new Storage({ credentials });

    // List files under prefix (returns objects whose names start with prefix)
    const [files] = await storage.bucket(bucketName).getFiles({ prefix });

    if (!files || files.length === 0) {
      console.log('v0');
      return;
    }

    // Extract numeric version from filenames like "dist/index.v123.html"
    const nums = files
      .map((f) => {
        const m = f.name.match(/index\.v([0-9]+)\.html$/);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n) => Number.isInteger(n));

    if (nums.length === 0) {
      console.log('v0');
      return;
    }

    const max = nums.reduce((a, b) => (a > b ? a : b), 0);
    console.log(`v${max}`);
  } catch (err) {
    console.error('Error while fetching latest version from GCS:', err);
    process.exit(1);
  }
}

main();
