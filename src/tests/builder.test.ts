import FormData from 'form-data'
import { RequestBuilder } from '~/builder'

const host = 'http://localhost:3000'

describe('Builder', () => {
	test('can build up a request configuration', () => {
		const builder = new RequestBuilder(host).get('/foo')

		expect(builder.toRequestOptions()).toEqual({
			url: `${host}/foo`,
			options: {
				method: 'GET',
			},
		})
	})

	test('can add headers', () => {
		const builder = new RequestBuilder(host)
			.get()
			.header('x-custom-header', 'foo')

		expect(builder.toRequestOptions().options).toEqual({
			method: 'GET',
			headers: {
				'x-custom-header': 'foo',
			},
		})
	})

	test('basic POST request', () => {
		const builder = new RequestBuilder(host).post('/foo').body('bar')

		expect(builder.toRequestOptions().options).toEqual({
			method: 'POST',
			body: 'bar',
		})
	})

	test('POST request - form data', () => {
		const builder = new RequestBuilder(host)
			.post('/foo')
			.formData({ foo: 'bar' })

		expect(builder.toRequestOptions().options).toEqual({
			method: 'POST',
			body: expect.any(FormData),
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		})
	})

	test('POST request - json', () => {
		const builder = new RequestBuilder(host)
			.post('/foo')
			.json({ foo: 'bar' })

		expect(builder.toRequestOptions().options).toEqual({
			method: 'POST',
			body: '{"foo":"bar"}',
			headers: {
				'Content-Type': 'application/json',
			},
		})
	})

	const methods = [
		'head',
		'options',
		'get',
		'patch',
		'put',
		'post',
		'delete',
	] as const

	test.each(methods)('builder handles %s method', (method) => {
		const builder = new RequestBuilder(host)[method]()
		expect(builder.toRequestOptions().options.method).toEqual(
			method.toUpperCase()
		)
	})

	test('parses query params', () => {
		const builder = new RequestBuilder(host)
			.get('/foo')
			.query({ a: [1, 2, 3] })

		expect(builder.toRequestOptions().url).toEqual(`${host}/foo?a=1,2,3`)
	})

	test('allows injecting custom query parser', () => {
		const builder = new RequestBuilder(host, (params) => 'gottem')
			.get('/foo')
			.query({ a: [1, 2, 3] })

		expect(builder.toRequestOptions().url).toEqual(`${host}/foo?gottem`)
	})

	test('handles paths with starting slash', () => {
		const builder = new RequestBuilder(host).get('foo')
		expect(builder.toRequestOptions().url).toEqual(`${host}/foo`)
	})

	test('allows passing custom fetch options', () => {
		const builder = new RequestBuilder(host)
			.get()
			.fetchOptions({ port: 1000 })

		expect(builder.toRequestOptions().options).toMatchObject({ port: 1000 })
	})
})
