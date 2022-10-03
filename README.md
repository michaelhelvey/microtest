# microtest

![build](https://github.com/michaelhelvey/microtest/actions/workflows/nodejs.yml/badge.svg)

A small utility library for writing API integration tests in Node.js

```ts
import { app } from '../app'
import { microtest } from '@michaelhelvey/microtest'

/*
Alternative APIs to support:
    1) Anything that implements listen...
        e.g. `microtest(app)`
    2) Pass a base url to an already running server...
        .e.g. `microtest('http://localhost:3000')`
*/

const request = microtest('http://localhost:9000')

beforeAll(async () => {
	await app.listen(9000)
})

afterAll(async () => {
	await app.server.close()
})

test('the API works', () => {
	const response = request((ctx) => ctx.post('/foo').json({ a: 'b' }))
		.status(200)
		.json<{ message: string }>()

	expect(response.message).toEqual('the message')
})
```

## Installation and Running Locally

-   `pnpm dev` Run application with esbuild and `tsx`
-   `pnpm test` (or `pnpm test:coverage`) for running unit tests
-   `pnpm build` to build the library for publishing

## Authors

-   [Michael Helvey](https://michaelhelvey.dev)

## License

[MIT](./LICENSE.md)
