var yaml = require("yamljs")
var session = require('express-session')
var express = require('express')
var app = express()

var unirest = require("unirest")

var passport = require("passport")
var GitHubStrategy = require("passport-github2")

var config = yaml.load('config.yml')

app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());

app.use('/css/', express.static('node_modules/bootstrap/dist/css'));
app.use('/css/', express.static('node_modules/font-awesome/css'));
app.use('/js/', express.static('node_modules/bootstrap/dist/js'));

app.use('/lib/', express.static('node_modules/angular-ui-bootstrap/dist'));

app.use('/js/', express.static('node_modules/jquery/dist'));
app.use('/js/', express.static('node_modules/angular'));
app.use('/js/', express.static('node_modules/angular-animate'));
app.use('/js/', express.static('node_modules/angular-resource'));
app.use('/js/', express.static('node_modules/angular-route'));

app.use('/fonts/', express.static('node_modules/bootstrap/dist/fonts'));
app.use('/fonts/', express.static('node_modules/font-awesome/fonts'));

app.use('/', express.static('dist'));


// OAuth configuration *******************************************************
passport.use(new GitHubStrategy({
    clientID: config.github.client.id,
    clientSecret: config.github.client.secret,
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    
    unirest.get(config.github.base + "/user/orgs")
    .headers({
        'User-Agent': 'thelemic',
        "Authorization": "Bearer " + accessToken
    })
    .end(function (orgs) {
        profile.orgs = orgs.body;
        return done(null, profile);
    })
  }
));

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.get('/api/auth', function (req, res) {
    var result = {
        success: req.isAuthenticated()
    };

    if (req.isAuthenticated()) {
        result.login = req.user.username;
    }
    
    res.send(result)
});

app.get('/auth/github', passport.authenticate('github', {
    scope: [ 'user:email', 'read:org' ]
}));

app.get('/auth/github/callback', 
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    }
);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401)
    res.send("unauthenticated")
}

app.get('/api/orgs', ensureAuthenticated, function (req, res) {
    res.send(req.user.orgs)
});

app.get('/api/template', ensureAuthenticated, function (req, res) {
    res.send(config.template)
});

app.post('/api/repo', ensureAuthenticated, function (req, res) {
    if (config.template.enforce_template.repo) {
        console.log("enforcing repository template...")
        var repoName = req.body.config.name;
        req.body.config = config.template.repo[config.template.enforce_template.repo].config
        req.body.config.name = repoName;
    }

    checkOrgMembership(req.body.orgName, req.user.username, function(check) {
        if (check.status != 204) {
            console.log("Reject request: user not member of organization")
            res.status(400)
            res.send()
        } else {
            unirest.post(config.github.base + "/orgs/"+req.body.orgName+"/repos")
                .headers({'User-Agent': 'thelemic'})
                .type('json')
                .auth("", config.github.api.token)
                .send(req.body.config)
                .end(function (response) {
                    res.status(response.status)
                    res.send(response.body)
                });
        }
    });
});

/*
app.post('/api/repo/team', ensureAuthenticated, function (req, res) {
    if (config.template.enforce_template.branch) {
        req.body.config = config.template[config.template.enforce_template.branch]
    }

    checkOrgMembership(req.body.orgName, req.user.username, function(check) {
        if (check.status != 204) {
            res.status(400)
            res.send()
        } else {
            unirest.put("/teams/{id}/repos/{orgName}/{repo}")
                .routeParam("id", req.body.teamId)
                .routeParam("orgName", req.body.orgName)
                .routeParam("repo", req.body.repo)
                .headers({'User-Agent': 'thelemic'})
                .auth("", config.github.api.token)
                .send(req.body.config)
                .end(function (response) {
                    res.status(response.status)
                    res.send(response.body)
                });
        }
    });
});
*/

app.post('/api/repo/branch', ensureAuthenticated, function (req, res) {
    if (config.template.enforce_template.branch) {
        console.log("enforcing branch template...")
        req.body.config = config.template.branch[config.template.enforce_template.branch].config
    }

    checkOrgMembership(req.body.orgName, req.user.username, function(check) {
        if (check.status != 204) {
            console.log("Reject request: user not member of organization")
            res.status(400)
            res.send()
        } else {
            unirest.put(config.github.base + "/repos/"+req.body.orgName+"/"+req.body.repo+"/branches/"+req.body.branch+"/protection")
                .headers({'User-Agent': 'thelemic'})
                .type('json')
                .auth("", config.github.api.token)
                .send(req.body.config)
                .end(function (response) {
                    res.status(response.status)
                    res.send(response.body)
                });
        }
    });
});


function checkOrgMembership(orgName, username, callback) {
    unirest.get(config.github.base+"/orgs/"+orgName+"/members/"+username)
        .headers({'User-Agent': 'thelemic'})
        .auth("", config.github.api.token)
        .end(callback)
}

console.log("Listening on http://localhost:" + config.endpoint.port);
app.listen(config.endpoint.port)