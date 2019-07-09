# microtest

[![Build Status](https://travis-ci.com/michaelhelvey/microtest.svg?branch=master)](https://travis-ci.com/michaelhelvey/microtest)
[![npm version](https://badge.fury.io/js/%40michaelhelvey%2Fmicrotest.svg)](https://badge.fury.io/js/%40michaelhelvey%2Fmicrotest)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

Simple API testing utility for Node.js.

Goals:

- :white_check_mark: Works with all frameworks
- :white_check_mark: Works with all test runners
- :white_check_mark: Simple async/await interface based around the familiar
  `node-fetch` interface.

## Installation

`npm install --save-dev @michaelhelvey/microtest` or
`yarn add -D @michaelhelvey/microtest`

## Usage

Basic Example:

```js
// app is anything that exposes a `listen` function that returns an instance of http.Server
// i.e. an express app, a koa app, a basic http.Server instance, etc.
const response = await test(app)
  .header('x-name', 'microtest')
  .post('/test')
  .sendJSON({ message: 'This will be the JSON post body' }) // microtest automatically adds the necessary JSON Content-Type header
  .json() // decode the response automatically into json and return it
expect(response).toEqual('My Response')
```

More advanced customization:

```js
const response = await test(app)
  .get('/test')
  .port(4567) // run the test server on a custom port
  .fetchOptions({ mode: 'no-cors' }) // custom fetch options that will be merged into the `node-fetch` call.
  .raw() // return the raw response object from `node-fetch`
expect(response.ok).toBeTruthy()
```

For complete usage examples, check out the integration tests in the `tests`
directory. I've included some common libraries and patterns in the dev
dependencies of the package with usage examples in the tests.

### Why?

There's nothing wrong with `supertest`, except that in my experience it can be a
bit hard to debug because of its dependency on `superagent`, and its server
listen/close logic doesn't play well with the Jest test runner. I thought I'd
try my hand at building a simple, one file utility based around the `fetch` api,
which most web developers are familiar with. I had two goals for the library:

1. It should be easy to read to read the source understand what it was doing to
   your server.
2. It should be framework and test-runner agnostic.

I wrote this library as a personal utility to address a couple of my own
frustrations. If you're happy with supertest, this library probably won't be
that useful for you, and that's just fine. :) As it is, this library is probably
full of edge cases that I haven't thought of because the limited range of
services I end up testing.

### LICENSE

MIT
