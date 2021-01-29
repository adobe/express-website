const fse = require('fs-extra');
const { resolve } = require('path');
const shell = require('shelljs');
const puppeteer = require('puppeteer');

const TEST_PORT = process.env.TEST_PORT || 3001;
const TEST_URL = `http://localhost:${TEST_PORT}`;

let server;
let browser;

async function startServer(verbose) {
  console.log('  Starting server ...');
  return new Promise((resolve) => {
    shell.cd('..');
    server = shell.exec(`hlx up --no-open --port ${TEST_PORT}`, { async: true, silent: !verbose });
    server.stderr.on('data', (data) => {
      if (data.includes('server up and running')) {
        console.log('  Server started.');
        return resolve();
      }
    });
  });
}

function stopServer() {
  server.kill();
  console.log('  Server stopped.');
  process.exit(0); // make sure gh workflow action completes
}

async function startBrowser(headless = true) {
  browser = await puppeteer.launch({
    headless,
    args: [
      '--disable-popup-blocking',
    ],
  });
  return browser.newPage();
}

async function stopBrowser() {
  await browser.close();
  browser = null;
  return null;
}

async function readFile(path) {
  return await fse.readFile(resolve(__dirname, '..', path), 'utf-8');
}

module.exports = {
  startServer,
  stopServer,
  startBrowser,
  stopBrowser,
  readFile,
  TEST_URL,
};
