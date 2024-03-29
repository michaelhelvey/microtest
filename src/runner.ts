import chalk from 'chalk'
import type * as http from 'http'
import fetch, { Response } from 'node-fetch'
import { RequestBuilder } from '~/builder'
import { defaultQueryParser, QueryParser } from './query'

/**
 * Optional configuration to customize the request builder
 */
export interface RunnerConfiguration {
	/**
	 * An optional custom query parameter parser to pass through to the
	 * underlying request builder.  This parser will be used to parse the
	 * arguments passed to the `query` function on the builder.
	 *
	 * @example
	 * const request = microtest(
	 *     'host',
	 *     { queryParser: (params) => qs.stringify(params, { arrayFormat: 'repeat' })}
	 * )
	 */
	queryParser?: QueryParser
}

/**
 * Anything that listens on a port and returns an http.Server can be
 * considered a "RunnableApplication." This matches the API of most common
 * Node.js server frameworks, such as Express and Koa.
 *
 * If your framework does not support this API explicitly, a simple wrapper
 * should be easy enough to write to satisfy this interface.
 */
export interface RunnableApplication {
	listen: (port: number, ...args: any[]) => http.Server
}

/**
 * Occassionally, your server will be constructed in such a way that you want to
 * create, listen, and then tear down the server on every request, rather than
 * starting and stopping your server in before & after each hooks. To accomodate
 * this use-case, `microtest` provides the `withApp` higher order function.
 *
 * @param app The application to run on each request
 * @returns A function can you call to get the microtest request utility.
 *
 * @example
 * const request = withApp(myApplication)()
 * const response = await request({ ...args }) // normal args here
 */
export function withApp(app: RunnableApplication) {
	const server = app.listen(0) // 0 = choose random port
	const port = determinePort(server)
	const baseURL = `http://localhost:${port}`

	return (config?: Parameters<typeof runner>[1]) => {
		const callback = runner(baseURL, config)
		return (...args: Parameters<typeof callback>) => {
			const parser = callback(...args)

			return parser.addAfterHook(() => waitForServerToStop(server))
		}
	}
}

function waitForServerToStop(server: http.Server) {
	return new Promise<void>((resolve) => {
		server.close(() => resolve())
	})
}

export function determinePort(server: http.Server) {
	const address = server.address()

	if (!address) {
		throw new Error(
			'determinePort: server#address returned null.  Has the server been started?'
		)
	}

	if (typeof address === 'string') {
		throw new Error(
			'Servers that listen on a unix domain socket or pipe are not supported'
		)
	}

	return address.port
}

/**
 * Create a microtest runner.  This runner can be used to make requests, parse
 * the results, and make assertions about the response.
 *
 * @example
 * const request = microtest('http://localhost:9999')
 * const response = await request(ctx => ctx.get('/').query({ foo: 'bar' })).status(200).json()
 * expect(response.message).toEqual('something from my api')
 *
 * @param baseURL The base url that all requests should be made to
 * @param config Optionally, a configuration object customizing the behavior of the request builder
 * @returns a function that can be used to make and parse HTTP requests
 */
export function runner(
	baseURL: string,
	{ queryParser = defaultQueryParser }: RunnerConfiguration = {}
) {
	return (callback: (_: RequestBuilder) => RequestBuilder) => {
		const builder = callback(new RequestBuilder(baseURL, queryParser))
		const options = builder.toRequestOptions()

		const response = fetch(options.url, options.options)
		return new ResponseParser(response)
	}
}

type ResponseAssertion = (response: Response) => Response | Promise<Response>
type AfterHook = () => void | Promise<void>

/**
 * ResponseParser parses and makes assertions about responses.
 */
export class ResponseParser {
	private assertions: ResponseAssertion[] = []
	private afterHooks: AfterHook[] = []

	constructor(private readonly response: Promise<Response>) {}

	/**
	 * Hook into the response lifecycle to run arbitrary logic after a response
	 * has been received.  Useful, for example, if you need to automatically
	 * close a server when a response has been received.
	 *
	 * @param hook An arbitrary (possibly async) function to run after the
	 * response has been received.
	 */
	public addAfterHook(hook: AfterHook) {
		this.afterHooks.push(hook)
		return this
	}

	/**
	 * Runs assertions and returns a raw http response
	 *
	 * @returns a raw HttpResponse
	 */
	public raw() {
		return this.awaitRequest()
	}

	/**
	 * Runs assertions and returns the HTTP response body parsed as json
	 *
	 * @returns JSON response body, or throws an error if unparsable
	 */
	public async json<T = any>(): Promise<T> {
		const response = await this.awaitRequest()
		try {
			const asJson = (await response.clone().json()) as T
			return asJson
		} catch (e) {
			const text = await response.text()
			throw new Error(
				`microtest#json: Unable to parse response as json.\n\tError: ${String(
					e
				)}\n\tResponse: ${text}`
			)
		}
	}

	/**
	 * Runs assertions and returns the HTTP response body parsed as text
	 *
	 * @returns response body as text
	 */
	public async text() {
		const response = await this.awaitRequest()
		return response.text()
	}

	private async awaitRequest() {
		const response = await this.response

		// Run all lifecycle hooks prior to parsing or asserting about the response
		await Promise.all(this.afterHooks.map((fn) => fn()))

		// Then run all assertions
		await Promise.all(
			this.assertions.map((assertion) => assertion(response.clone()))
		)

		return response
	}

	public status(status: number) {
		const statusAssertion: ResponseAssertion = (response) => {
			if (response.status !== status) {
				throw new Error(
					prettyAssertion({
						message: 'failed status code check',
						expected: status,
						received: response.status,
					})
				)
			}

			return response
		}

		this.assertions.push(statusAssertion)
		return this
	}
}

interface FailedAssertion {
	message: string
	expected: any
	received: any
}

function prettyAssertion({ message, expected, received }: FailedAssertion) {
	return `microtest: ${message}:\n\t${chalk.bold.green(
		'Expected',
		expected
	)}\n\t${chalk.bold.red('Received', received)}`
}
