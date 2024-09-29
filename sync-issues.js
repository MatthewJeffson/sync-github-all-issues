import { Octokit } from "@octokit/rest";
import fetch from 'node-fetch';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: { fetch }
});

const org = process.env.ORG_NAME;
const projectNumber = process.env.PROJECT_NUMBER;
const columnName = process.env.COLUMN_NAME;

async function getProjectId() {
  const { data: projects, status } = await octokit.projects.listForOrg({
    org,
    state: "open",
  });
  console.log("API Response Status:", status);
  console.log("Projects returned:", JSON.stringify(projects, null, 2));
  const project = projects.find(p => p.number === parseInt(projectNumber, 10));
  if (!project) {
    console.error("No matching project found.");
    throw new Error("Project not found");
  }
  return project.id;
}

// Similar refactor for other functions...

(async () => {
  try {
    console.log("Starting synchronization process...");
    const projectId = await getProjectId();
    const columnId = await getColumnId(projectId);
    const repositories = await getAllRepositories();
    const issues = await getAllIssues(repositories);

    for (const issue of issues) {
      if (issue.pull_request) continue; // Skip pull requests
      await addIssueToProject(issue, projectId, columnId);
    }

    console.log("Synchronization completed successfully.");
  } catch (error) {
    console.error("Error during synchronization:", error);
    process.exit(1);
  }
})();