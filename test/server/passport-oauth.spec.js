var expect = require('chai').expect
var sinon = require('sinon')
var config = require('../../server/config')

var githubTokens = require('../../server/github-tokens')

var uut = require('../../server/passport-oauth')

describe('Passport OAuth configuration', function() {
	var sandbox = sinon.createSandbox()
	var mockSettings, passportMock

	beforeEach(function() {
		passportMock = {
			use: sinon.stub(),
			serializeUser: sinon.stub(),
			deserializeUser: sinon.stub()
		}

		// required for GitHubStrategy
		mockSettings = {
			oauth: {
				id: 'oauthId',
				secret: 'meow!'
			}
		}
        
		sandbox.stub(config, 'getGithubSettings').returns(mockSettings)
        
		sandbox.stub(githubTokens, 'getOAuthResources')
	})

	afterEach(function() {
		sandbox.restore()
	})

	it('should configure passport instance', function() {
		uut.configureOAuth(passportMock)

		sinon.assert.calledOnce(passportMock.use)
		sinon.assert.calledOnce(passportMock.serializeUser)
		sinon.assert.calledOnce(passportMock.deserializeUser)
	})

	it('should deserialize users correctly', (complete) => {
		var testUser = { test: 'test' }

		uut._serializeUser(testUser, (none, serializedUser) => {
			uut._deserializeUser(serializedUser, (none, deserializedUser) => {
				expect(deserializedUser).to.be.deep.equal(testUser)
				complete()
			})
		})
	})

	it('should construct oauth user resources', (complete) => {
		var mockProfile = {
			displayName: 'displayName',
			username: 'waldo',
			photos: 'pics or didn\'t happen'
		}

		var mockResources = {
			orgs: ['A'],
			installations: ['B']
		}
        
		githubTokens.getOAuthResources.resolves(mockResources)
        
		uut._oauthResources('', '', mockProfile, (none, user) => {
			expect(user.displayName).to.be.equal(mockProfile.displayName)
			expect(user.username).to.be.equal(mockProfile.username)
			expect(user.photos).to.be.equal(mockProfile.photos)
            
			expect(user.orgs).to.be.equal(mockResources.orgs)
			expect(user.installations).to.be.equal(mockResources.installations)
			complete()
		})
	})

	it('should fail on missing oauth client id property', () => {
		mockSettings.oauth.id = undefined

		expect(uut.configureOAuth.bind(null, passportMock)).to.throw(/^Missing configuration for properties.*/)
	})

	it('should fail on missing oauth secret property', () => {
		mockSettings.oauth.secret = undefined

		expect(uut.configureOAuth.bind(null, passportMock)).to.throw(/^Missing configuration for properties.*/)
	})

	it('should handle passport configuration errors', () => {
		var errorMessage = 'Ouch!'

		passportMock.use.throws(new Error(errorMessage))

		expect(uut.configureOAuth.bind(null, passportMock)).to.throw(errorMessage)
	})

})