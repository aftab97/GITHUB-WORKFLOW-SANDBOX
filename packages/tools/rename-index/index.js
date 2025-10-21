const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the current branch name
const branchName = execSync('git rev-parse --abbrev-ref HEAD', {
  encoding: 'utf-8',
}).trim();

// Path to the generated index.html
const indexPath = path.join(
  __dirname,
  '../../../',
  'apps',
  'neo3-ui',
  'dist',
  'index.html'
);

// Path to the new file
const newIndexPath = path.join(
  __dirname,
  '../../../',
  'apps',
  'neo3-ui',
  'dist',
  `${branchName}_index.html`
);

// Rename the index.html to include the branch name
fs.renameSync(indexPath, newIndexPath);

console.log(`Renamed index.html to ${branchName}_index.html`);
