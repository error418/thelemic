var yaml = require("yamljs")

function getProperties() {
    var loadedProperties
    if (!loadedProperties) {
        var config = yaml.load('config.yml')

        // override configuration with environment variables, if available
        config.github.oauth.id = process.env.GITHUB_OAUTH_ID || config.github.oauth.id
        config.github.oauth.secret = process.env.GITHUB_OAUTH_SECRET || config.github.oauth.secret
        config.github.appId = process.env.GITHUB_APPID || config.github.appId
        config.github.base = process.env.GITHUB_BASE || config.github.base
        
        config.application.port = process.env.APP_PORT || config.application.port
        config.session.secret = process.env.SESSION_SECRET || config.session.secret
        
        if (process.env.REDIS_HOST) {
            config.session.redis = {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                ttl: process.env.REDIS_TTL,
                logErrors: process.env.REDIS_LOG_ERRORS
            }
        }

        loadedProperties = config
    }

    return loadedProperties
}

function getTemplates() {
    return getProperties().template
}

function getGithubSettings() {
    return getProperties().github
}

function getSessionConfiguration() {
    return getProperties().session
}

function getApplicationSettings() {
    return getProperties().application
}

module.exports = {
    getTemplates: getTemplates,
    getGithubSettings: getGithubSettings,
    getSessionConfiguration: getSessionConfiguration,
    getApplicationSettings: getApplicationSettings
};