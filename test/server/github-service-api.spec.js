var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var config = require('../../server/config')
var unirest = require('unirest')
var jwt = require('jsonwebtoken');
var fs = require('fs');
var config = require('../../server/config')

describe('Github Service API', function() {
    var uut

    var sandbox = sinon.createSandbox();
    var token = "tokentestcontent"
    var unirestMock, mockResponse, mockBearer

    beforeEach(function() {
        mockConfig = {
            base: "GITHUB BASE"
        }

        mockBearer = {
            headers: {
                "test": "test"
            }
        }

        mockResponse = {
            ok: true,
            body: {
                token: token
            }
        }
        
        unirestMock = {
            headers: sinon.stub().returns(unirestMock),
            send: sinon.stub().returns(unirestMock),
            type: sinon.stub().returns(unirestMock),
            end: function(cb) {
                cb(mockResponse)
            }
        }

        sandbox.stub(config, "getGithubSettings").returns(mockConfig)
        
        sandbox.stub(unirest, "get").returns(unirestMock)
        sandbox.stub(unirest, "post").returns(unirestMock)
        sandbox.stub(unirest, "put").returns(unirestMock)
        
        uut = require("../../server/github-service-api")
    });

    afterEach(function() {
        sandbox.restore();
    })

    it('should comply to public api', function() {
        expect(uut.configureBranch).to.be.not.undefined
        expect(uut.createRepository).to.be.not.undefined
        expect(uut.addIssueLabel).to.be.not.undefined
        expect(uut.requestAccessTokens).to.be.not.undefined
    })

    it('should use GitHub base for request installation endpoint', () => {
        uut.requestInstallations(mockBearer, () => {})
        sinon.assert.calledWith(unirest.get, sinon.match(/^GITHUB BASE.*/));
    })

    it('should use GitHub base for request access token endpoint', () => {
        uut.requestAccessTokens(0, 0, () => {})
        sinon.assert.calledWith(unirest.post, sinon.match(/^GITHUB BASE.*/));
    })

    it('should use GitHub base for create label endpoint', () => {
        uut.addIssueLabel(mockBearer, "testOrg", "testRepo", {}, () => {})
        sinon.assert.calledWith(unirest.post, sinon.match(/^GITHUB BASE.*/));
    })

    it('should use GitHub base for create repository endpoint', () => {
        uut.createRepository(mockBearer, "testOrg", {}, () => {})
        sinon.assert.calledWith(unirest.post, sinon.match(/^GITHUB BASE.*/));
    })

    it('should use GitHub base for branch protection endpoint', () => {
        uut.configureBranch(mockBearer, "testOrg", "testRepo", "testBranch", {}, () => {})
        sinon.assert.calledWith(unirest.put, sinon.match(/^GITHUB BASE.*/));
    })

});