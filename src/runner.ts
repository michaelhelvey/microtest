import chalk from 'chalk'
import fetch, { Response } from 'node-fetch'
import { RequestBuilder } from '~/builder'

export function runner(baseURL: string) {
	return (callback: (_: RequestBuilder) => RequestBuilder) => {
		const builder = callback(new RequestBuilder(baseURL))
		const options = builder.toRequestOptions()

		const response = fetch(options.url, options.options)
		return new ResponseParser(response)
	}
}

type ResponseAssertion = (response: Response) => Response | Promise<Response>

export class ResponseParser {
	private assertions: ResponseAssertion[] = []

	constructor(private readonly response: Promise<Response>) {}

	public raw() {
		return this.awaitRequest()
	}

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
