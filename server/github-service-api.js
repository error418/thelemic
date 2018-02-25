var unirest = require("unirest");
var config = require("./config")

/** Configures a branch using the GitHub API
 * 
 * @param {*} bearer bearer token
 * @param {*} orgName organization name
 * @param {*} repoName repository name
 * @param {*} branchName target branch name
 * @param {*} templateConfig template to use (this is the API request sent to GitHub)
 * @param {*} end done callback
 */
function configureBranch(bearer, orgName, repoName, branchName, templateConfig, end) {
    unirest.put(config.github.base + "/repos/"+orgName+"/"+repoName+"/branches/"+branchName+"/protection")
        .headers(bearer.headers)
        .type('json')
        .send(templateConfig)
        .end(end);
}

/** Creates a repository using the GitHub API
 * 
 * @param {*} bearer bearer token
 * @param {*} orgName organization name
 * @param {*} repositoryConfig repository configuration (this is the API request sent to GitHub)
 * @param {*} end done callback
 */
function createRepository(bearer, orgName, repositoryConfig, end) {
    unirest.post(config.github.base + "/orgs/"+orgName+"/repos")
        .headers(bearer.headers)
        .type('json')
        .send(repositoryConfig)
        .end(end);
}

/** Adds an Issue Label to a repository using the GitHub API
 * 
 * @param {*} bearer bearer token
 * @param {*} orgName organization name
 * @param {*} repoName repository name
 * @param {*} label label configuration (this is the API request sent to GitHub)
 * @param {*} end done callback
 */
function addIssueLabel(bearer, orgName, repoName, label, end) {
    unirest.post(config.github.base + "/repos/"+orgName+"/"+repoName+"/labels")
        .headers(bearer.headers)
        .type('json')
        .send(label)
        .end(end)
}

/** Requests access tokens for a given GitHub App installation from GitHub
 * 
 * @param {*} installationId GitHub App installation id to retrieve the tokens for
 * @param {*} jwt vaild jwt token for the installation
 * @param {*} end done callback
 */
function requestAccessTokens(installationId, jwt, end) {
    unirest.post(config.github.base + "/installations/" + installationId + "/access_tokens")
        .headers({
            'User-Agent': config.application.name,
            'Accept': 'application/vnd.github.machine-man-preview+json',
            'Authorization': 'Bearer ' + jwt
        })
        .end((res) => {
            if(res.ok) {
                end(res.body.token)
            } else {
                logger.log("error", "error retrieving api token: " + res.body.message)
                end(null, res);
            }
        })
}

/** Retrieve GitHub App installations for the current user from GitHub
 * 
 * @param {*} accessToken access token of the user
 * @param {*} end done callback
 */
function requestInstallations(accessToken, end) {
    unirest.get(config.github.base + "/user/installations")
        .headers(getTokenHeaders(accessToken))
        .end(function (response) {
            var resources = {
                orgs: [],
                installations: {}
            };

            if (response.ok) {
                end(response.body.installations)
            } else {
                logger.log("error", "could not retrieve oauth resources: " + res.body.message)
            }

            end(resources);
        });
}

module.exports = {
    configureBranch: configureBranch,
    createRepository: createRepository,
    addIssueLabel: addIssueLabel,
    requestAccessTokens: requestAccessTokens,
    requestInstallations: requestInstallations
}