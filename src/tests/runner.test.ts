import express from 'express'
import http from 'node:http'
import { runner } from '~/runner'

const app = express()

app.get('/', (_req, res) => {
	res.status(200).send('Hello, World')
})

app.get('/json', (_req, res) => {
	res.status(200).send({ foo: 'bar' })
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

const request = runner('http://localhost:9999')

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
