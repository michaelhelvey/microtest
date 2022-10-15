import express from 'express'
import http from 'node:http'
import { determinePort, runner, withApp } from '~/runner'
import { microtest } from '..'

const app = express()

app.get('/', (_req, res) => {
	res.status(200).send('Hello, World')
})

app.get('/json', (_req, res) => {
	res.status(200).send({ foo: 'bar' })
})

app.get('/query', (req, res) => {
	res.send(req.query)
})

let server: http.Server

beforeAll(() => {
	return new Promise((resolve) => {
		server = app.listen(9999, resolve)
	})
})

afterAll(() => {
	server.close()
})

const host = 'http://localhost:9999'
const request = runner(host)

test('can get a raw response', async () => {
	const response = await request((ctx) => ctx.get('/')).raw()
	expect(response.status).toEqual(200)
})

test('can get a json response', async () => {
	const response = await request((ctx) => ctx.get('/json')).json<{
		foo: 'bar'
	}>()
	expect(response.foo).toEqual('bar')
})

test('throws pretty error when json cannot be parsed', async () => {
	const response = request((ctx) => ctx.get('/')).json()
	await expect(response).rejects.toThrowError(
		/microtest#json: unable to parse response as json/i
	)
})

test('can get a text response', async () => {
	const response = await request((ctx) => ctx.get('/')).text()
	expect(response).toEqual('Hello, World')
})

test('can assert response status', async () => {
	const response = request((ctx) => ctx.get('/'))
		.status(404)
		.text()
	await expect(response).rejects.toThrowError(/failed status code check/i)
})

test('can provide custom query parser', async () => {
	const customParser = microtest(host, { queryParser: (params) => 'foo=bar' })
	const response = await customParser((ctx) =>
		ctx.get('/query').query({ bar: 'baz' })
	)
		.status(200)
		.json()

	expect(response).toMatchObject({ foo: 'bar' })
})

describe('withApp', () => {
	test('can construct a new app on the fly', async () => {
		const wrappedRequest = withApp(app)()
		const response = await wrappedRequest((ctx) => ctx.get('/')).text()
		expect(response).toEqual('Hello, World')
	})

	test('determinePort: throws if server is not started', () => {
		const mockServer = {
			address: () => null,
		}

		expect(() => determinePort(mockServer as any)).toThrow(
			/server#address returned null/i
		)
	})

	test('determinePort: throws if server is listing on pipe rather than port', () => {
		const mockServer = {
			address: () => 'foo',
		}

		expect(() => determinePort(mockServer as any)).toThrow(
			/servers that listen on a unix domain socket or pipe are not supported/i
		)
	})

	test('determinePort: otherwise returns server port', () => {
		const mockServer = {
			address: () => ({
				port: 1234,
			}),
		}

		expect(determinePort(mockServer as any)).toEqual(1234)
	})
})
