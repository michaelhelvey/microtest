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

test('my api integration test', () => {
	// In this example, we make a request to the /foo endpoint with a JSON payload
	const response = request((ctx) => ctx.post('/foo').json({ a: 'b' }))
		// then assert that the response has a 200 status:
		.status(200)
		// and assert + decode the response as json
		.json<{ message: string }>()

	// then we can use our testing framework to make further assertions
	expect(response.message).toEqual('the message')
})
```

For more information, see the complete docs. (TODO)

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
