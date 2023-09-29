# microtest

![build](https://github.com/michaelhelvey/microtest/actions/workflows/nodejs.yml/badge.svg)
[![npm version](https://badge.fury.io/js/%40michaelhelvey%2Fmicrotest.svg)](https://badge.fury.io/js/%40michaelhelvey%2Fmicrotest)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

microtest is a simple API integration testing library for Node.js

microtest encourages you to test your APIs the same way you consume them,
increasing your confidence in your tests while decreasing the number of lines of
code you need to write.

It works with all frameworks, all test runners, and has a a simple, easy-to-read
codebase with very few dependencies.

## Quickstart

### Installation

```shell
pnpm add -D @michaelhelvey/microtest
```

_Or use the package manager of your choice._

### Usage

```ts
// Import your application.  To use microtest, you just need to point it at a
// server, so do whatever you need to get that started.  For this example, we'll
// assume you're testing an express application.
import { app } from '../app'
import http from 'node:http'
import { microtest } from '@michaelhelvey/microtest'

/*
 * Start your application server, using whatever mechanisms your server
 * framework and your test runner provide:
 */

let server: http.Server

beforeAll(async () => {
	return new Promise((resolve) => {
		server = app.listen(9999, resolve)
	})
})

afterAll(async () => {
	server.close()
})

/**
 * Use microtest to make requests to your API and parse the responses:
 */

const request = microtest('http://localhost:9999')

test('my api integration test', async () => {
	// In this example, we make a request to the /foo endpoint with a JSON payload
	const response = await request((ctx) => ctx.post('/foo').json({ a: 'b' }))
		// then assert that the response has a 200 status:
		.status(200)
		// and assert + decode the response as json
		.json<{ message: string }>()

	// then we can use our testing framework to make further assertions
	expect(response.message).toEqual('the message')
})
```

While this simple example, along with typescript autocomplete, is probably
enough to get started, for more information, see the [full API
documentation](https://michaelhelvey.github.io/microtest/).

### Re-creating the application on each test

Occassionally, your server will be constructed in such a way that you want to
create, listen, and then tear down the server on every request, rather than
starting and stopping your server in before & after each hooks. To accomodate
this use-case, `microtest` provides the `withApp` higher order function:

```ts
test('my api integration test', async () => {
	// This single change will cause microtest to start and stop your server on
	// a random port for each request.
	const request = withApp(app)({
		/* normal microtest configuration args */
	})

	// The rest of your test is identical:
	const response = await request((ctx) => ctx.post('/foo').json({ a: 'b' }))
		.status(200)
		.json<{ message: string }>()

	// by this point in your test, the server will have been stopped
	expect(response.message).toEqual('the message')
})
```

## Contributing

Contributions through pull requests are welcome. If you make a pull request,
feel free to add yourself to the [Contributors](#contributors) section below.
Thank you!

### Local Development

-   `pnpm test` (or `pnpm test:coverage`) for running unit tests
-   `pnpm build` to build the library for publishing
-   `pnpm publish` to publish a new version (if you have permissions)

## Contributors

-   [Michael Helvey](https://michaelhelvey.dev)

## License

[MIT](./LICENSE.md)
