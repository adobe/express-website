/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-env mocha */
/* eslint-disable no-console */

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
  return new Promise((res) => {
    shell.cd('..');
    server = shell.exec(`hlx up --no-open --port ${TEST_PORT}`, { async: true, silent: !verbose });
    server.stderr.on('data', (data) => {
      if (data.includes('server up and running')) {
        console.log('  Server started.');
        return res();
      }
      return null;
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
  return fse.readFile(resolve(__dirname, '..', path), 'utf-8');
}

module.exports = {
  startServer,
  stopServer,
  startBrowser,
  stopBrowser,
  readFile,
  TEST_URL,
};
