const core = require('@actions/core');
const github = require('@actions/github');

async function main() {
  try {
    const {
      payload: { repository: repo },
    } = github.context;

    const token = core.getInput('token');
    const log = core.getInput('log');

    const octokit = new github.getOctokit(token);

    // Removes the trailing comma on the git log object
    const validLog = log.replace(/(,]$)/g, ']');

    const commits = JSON.parse(validLog);

    if (!Array.isArray(commits)) {
      throw new Error('Parsed commits is not an array');
    }

    // Grab all PRs
    const messages = commits
      .map((commit) => {
        if (!commit.subject) {
          return null;
        }
        const match = commit.subject.match(
          /^Merge-pull-request-(\d+)-from-CG-GroupIT-(?:neo-bff|neo3-ui)(?:-[^-]+)*-?(DC\d+-\d{2,4})(?:-.+)?$/,
        );
        if (match) {
          return {
            prNumber: match[1],
            ticket: match[2],
          };
        }

        return null;
      })
      .filter((m) => m);

    // limit log length to prevent API timeouts
    if (messages.length >= 500) {
      messages.splice(500);
    }

    console.log(repo.owner.login);
    console.log(repo.name);
    console.log(JSON.stringify(messages));

    const changelogList = [];

    for (const msg of messages) {
      try {
        const pull = await octokit.rest.pulls.get({
          owner: repo.owner.login,
          repo: repo.name,
          pull_number: msg.prNumber,
        });

        const cleanTitle = pull.data.title.replace(/['"]+/g, '');
        changelogList.push(
          `${cleanTitle}\n[Ticket](https://e-3d-dc1.capgemini.com/jira/browse/${msg.ticket}) | [Pull Request](https://github.com/CG-GroupIT/neo-monorepo/pull/${msg.prNumber})\n`,
        );
      } catch (err) {
        console.warn(
          `Failed to fetch PR #${msg.prNumber}: ${err.message || err.toString()}`,
        );
        continue; // skip on failure
      }
    }

    const changelog = changelogList.sort().join('\n');

    core.setOutput('changelog', changelog);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
