const core = require('@actions/core');
const github = require('@actions/github');

const validEvent = ['push'];

async function main() {
  try {
    const {
      eventName,
      payload: { repository: repo },
    } = github.context;

    // Only run on a push event
    if (validEvent.indexOf(eventName) < 0) {
      core.setFailed(`Invalid event: ${eventName}`);
    }

    const token = core.getInput('token');
    const branch = core.getInput('branch');

    const octokit = new github.getOctokit(token);

    // Grab any PRs
    const pull = await octokit.rest.pulls.list({
      owner: repo.owner.login,
      repo: repo.name,
      head: `neo:${branch}`,
    });

    if (pull.data.length > 0) {
      core.info('PR exists.');
      core.setOutput('create_pr', 'false');
    } else {
      core.info('PR does not exist');
      core.setOutput('create_pr', 'true');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
