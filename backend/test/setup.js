process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

global.expect = chai.expect;
global.sinon = sinon; 