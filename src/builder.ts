import FormData from 'form-data'
import { BodyInit, RequestInit } from 'node-fetch'
import qs from 'qs'

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
	host: string
	path: string
	queryParams?: Record<string, unknown>
}

interface RequestOptions {
	url: string | URL
	options: RequestInit
}

type QueryParser = (params: Record<string, unknown>) => string

const defaultQueryParser = (params: Record<string, unknown>) =>
	qs.stringify(params, { encode: false, arrayFormat: 'comma' })

/**
 * Fluent-style API for building up HTTP requests
 */
export class RequestBuilder {
	private _options: RequestInit = {}
	private config: BuilderConfig

	constructor(
		host: string,
		private readonly queryParser: QueryParser = defaultQueryParser
	) {
		this.config = { host, path: '' }
	}

	public toRequestOptions(): RequestOptions {
		const path = this.config.path.startsWith('/')
			? this.config.path
			: `/${this.config.path}`

		return {
			url: `${this.config.host}${path}${this.parseQueryParams()}`,
			options: this._options,
		}
	}

	public head(path = '') {
		return this.setMethod(HttpMethod.Head, path)
	}

	public options(path = '') {
		return this.setMethod(HttpMethod.Options, path)
	}

	public get(path = '') {
		return this.setMethod(HttpMethod.Get, path)
	}

	public patch(path = '') {
		return this.setMethod(HttpMethod.Patch, path)
	}

	public put(path = '') {
		return this.setMethod(HttpMethod.Put, path)
	}

	public post(path = '') {
		return this.setMethod(HttpMethod.Post, path)
	}

	public delete(path = '') {
		return this.setMethod(HttpMethod.Delete, path)
	}

	public body(body: BodyInit) {
		this._options.body = body
		return this
	}

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

	public json(value: unknown) {
		return this.body(JSON.stringify(value)).header(
			'Content-Type',
			'application/json'
		)
	}

	public query(params: Record<string, unknown>) {
		this.config.queryParams = params
		return this
	}

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
