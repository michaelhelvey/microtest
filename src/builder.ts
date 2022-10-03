import FormData from 'form-data'
import { BodyInit, RequestInit } from 'node-fetch'
import { defaultQueryParser, QueryParser } from './query'

enum HttpMethod {
	Head = 'HEAD',
	Options = 'OPTIONS',
	Get = 'GET',
	Patch = 'PATCH',
	Put = 'PUT',
	Post = 'POST',
	Delete = 'DELETE',
}

interface BuilderConfig {
	baseURL: string
	path: string
	queryParams?: Record<string, unknown>
}

interface RequestOptions {
	url: string
	options: RequestInit
}

/**
 * Fluent-style API for building up HTTP requests.
 */
export class RequestBuilder {
	private _options: RequestInit = {}
	private config: BuilderConfig

	constructor(
		baseURL: string,
		private readonly queryParser: QueryParser = defaultQueryParser
	) {
		this.config = { baseURL, path: '' }
	}

	/**
	 * Serializes all the current options into an object which can be used to
	 * make a request using the `fetch` API.
	 *
	 * @returns {RequestOptions} options for making a fetch request
	 */
	public toRequestOptions(): RequestOptions {
		const path = this.config.path.startsWith('/')
			? this.config.path
			: `/${this.config.path}`

		return {
			url: `${this.config.baseURL}${path}${this.parseQueryParams()}`,
			options: this._options,
		}
	}

	/**
	 * Make a HEAD request
	 *
	 * @param path a url pathname
	 * @returns the builder object, for chaining
	 */
	public head(path = '') {
		return this.setMethod(HttpMethod.Head, path)
	}

	/**
	 * Make an OPTIONS request
	 *
	 * @param path a url pathname
	 * @returns the builder object, for chaining
	 */
	public options(path = '') {
		return this.setMethod(HttpMethod.Options, path)
	}

	/**
	 * Make a GET request
	 *
	 * @param path a url pathname
	 * @returns the builder object, for chaining
	 */
	public get(path = '') {
		return this.setMethod(HttpMethod.Get, path)
	}

	/**
	 * Make a PATCH request
	 *
	 * @param path a url pathname
	 * @returns the builder object, for chaining
	 */
	public patch(path = '') {
		return this.setMethod(HttpMethod.Patch, path)
	}

	/**
	 * Make a PUT request
	 *
	 * @param path a url pathname
	 * @returns the builder object, for chaining
	 */
	public put(path = '') {
		return this.setMethod(HttpMethod.Put, path)
	}

	/**
	 * Make a POST request
	 *
	 * @param path a url pathname
	 * @returns the builder object, for chaining
	 */
	public post(path = '') {
		return this.setMethod(HttpMethod.Post, path)
	}

	/**
	 * Make a DELETE request
	 *
	 * @param path a url pathname
	 * @returns the builder object, for chaining
	 */
	public delete(path = '') {
		return this.setMethod(HttpMethod.Delete, path)
	}

	/**
	 * Set the raw body on the request.  This could be as simple as a string, or
	 * as complex as a stream.
	 *
	 * @param body the raw body to be set on the request
	 * @returns the builder object, for chaining
	 */
	public body(body: BodyInit) {
		this._options.body = body
		return this
	}

	/**
	 * Encodes an object as form data and sets it as the body of the request, along
	 * with setting the Content-Type header to multipart/form-data
	 *
	 * @param params a JSON-like object to be encoded as form data on the request
	 * @returns the builder object, for chaining
	 */
	public formData(params: Record<string, unknown>) {
		const formData = Object.entries(params).reduce<FormData>(
			(form, [key, value]) => {
				form.append(key, value)
				return form
			},
			new FormData()
		)

		return this.body(formData).header('Content-Type', 'multipart/form-data')
	}

	/**
	 * Encodes a value as JSON and sets it as the body of the request, along
	 * with setting the Content-Type header to application/json
	 *
	 * @param value a JSON-stringifiable value to be encoded as JSON on the request
	 * @returns the builder object, for chaining
	 */
	public json(value: any) {
		return this.body(JSON.stringify(value)).header(
			'Content-Type',
			'application/json'
		)
	}

	/**
	 * Encodes and sets query parameters on the URL.  Uses the query parser that
	 * the RequestBuilder was intiialized with.  To customize how query
	 * parameters are parsed, you can pass in a function into the microtest
	 * runner configuration.
	 *
	 * @example
	 * const runner = microtest('http://localhost:3000', {
	 *     queryParser: (paramsObject) => 'custom parser logic'
	 * })
	 *
	 * @param params an object representing the query params to be stringified and set on the request
	 * @returns the builder object, for chaining
	 */
	public query(params: Record<string, unknown>) {
		this.config.queryParams = params
		return this
	}

	/**
	 * Sets a key/value pair as a header on the request.
	 *
	 * @param key the header key, e.g. 'Content-Type'
	 * @param value the header value, e.g. 'text/plain'
	 * @returns the builder object, for chaining
	 */
	public header(key: string, value: string) {
		if (!this._options.headers) {
			this._options.headers = {}
		}

		this._options.headers = {
			...this._options.headers,
			[key]: value,
		}

		return this
	}

	private setMethod(method: HttpMethod, path: string) {
		this._options.method = method
		this.config.path = path
		return this
	}

	private parseQueryParams() {
		const params = this.config.queryParams

		if (!params) {
			return ''
		}

		return `?${this.queryParser(params)}`
	}
}
