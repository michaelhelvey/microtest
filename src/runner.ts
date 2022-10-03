import chalk from 'chalk'
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

/**
 * ResponseParser parses and makes assertions about responses.
 */
export class ResponseParser {
	private assertions: ResponseAssertion[] = []

	constructor(private readonly response: Promise<Response>) {}

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
