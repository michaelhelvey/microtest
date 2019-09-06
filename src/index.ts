import * as http from 'http'
import fetch, { RequestInit, Response } from 'node-fetch'
import * as assert from 'assert'
import { AddressInfo } from 'net'

interface ImplementsListen {
  listen: (...args: any[]) => http.Server | Promise<{ server: http.Server }>
}

type HTTPMethod = 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE'

interface RequestBuilderOptions {
  path?: string
  headers: any
  method: HTTPMethod
  port: number
  requestOptionsOverrides: any
  postBody?: any
}

class TestDriver {
  private app: ImplementsListen
  private server: http.Server
  private statusAssertion: number | null = null
  private options: RequestBuilderOptions = {
    headers: {},
    method: 'GET',
    port: 0,
    requestOptionsOverrides: {},
  }
  /**
   * creates a new test driver
   * @param app any object that impments a listen() function.  i.e. http.Server,
   * express(), new koa()
   */
  constructor(app: ImplementsListen) {
    this.app = app
  }

  /**
   * overrides the default port that the test server runs on. by default, the
   * server port is set to 0 so that a random port will be chosen
   * @param customPort
   */
  public port(customPort: number) {
    this.options.port = customPort
    return this
  }

  /**
   * sets the raw "body" options argument passed to node-fetch
   * @param postBody
   */
  public send(postBody: any) {
    this.options.postBody = postBody
    return this
  }

  /**
   * Sets the JSON-stingified "body" options argument passed to node-fetch
   * and sets 'Content-Type: application/json' header
   * @param json The json to be JSON.stringified
   */
  public sendJSON(json: any) {
    this.options.postBody = JSON.stringify(json)
    this.header('Content-Type', 'application/json')
    return this
  }

  /**
   *
   * @param options Custom options to be passed to node-fetch.  Will override
   * any option set by microtest.
   */
  public fetchOptions(options: Partial<RequestInit>) {
    this.options.requestOptionsOverrides = options
    return this
  }

  /**
   *
   * @param key header key, i.e. Content-Type
   * @param value header value, i.e. application/json
   */
  public header(key: string, value: string) {
    this.options.headers[key] = value
    return this
  }

  public get(path: string) {
    this._checkPath()
    this.options.path = path
    this.options.method = 'GET'
    return this
  }

  public put(path: string) {
    this._checkPath()
    this.options.path = path
    this.options.method = 'PUT'
    return this
  }

  public patch(path: string) {
    this._checkPath()
    this.options.path = path
    this.options.method = 'PATCH'
    return this
  }

  public post(path: string) {
    this._checkPath()
    this.options.path = path
    this.options.method = 'POST'
    return this
  }

  public delete(path: string) {
    this._checkPath()
    this.options.path = path
    this.options.method = 'DELETE'
    return this
  }

  /**
   * Tells microtest to assert a given response status before returning a response
   * from .raw(), .text() etc.
   * @param status
   */
  public assertStatus(status: number) {
    if (this.statusAssertion) {
      throw new Error('Can only assert one status per request')
    } else {
      this.statusAssertion = status
    }
    return this
  }

  /**
   * starts a test server, makes an HTTP request over localhost with the options
   * set by the previous functions, and returns a promise which resolves to the
   * raw Response object from node-fetch
   */
  public async raw() {
    const maybeServer = await this.app.listen(this.options.port)
    if (typeof (maybeServer as any).server === 'object') {
      this.server = (maybeServer as any).server
    } else {
      this.server = maybeServer as http.Server
    }

    let port: number = 0
    if (
      this.server.address &&
      this.server.address() &&
      typeof this.server.address() === 'object'
    ) {
      port = (this.server.address() as AddressInfo).port
    }
    const response = await fetch(
      `http://localhost:${port}${this.options.path}`,
      {
        method: this.options.method,
        headers: this.options.headers,
        body: this.options.postBody,
        ...this.options.requestOptionsOverrides,
      }
    )
    this.server.close()
    // before we return the response we need to call any status assertion handlers
    // that have been set
    this._handleStatusCodeAssertions(response)
    return response
  }

  /**
   * Calls this.raw() but additionally parses the Response as json
   */
  public async json() {
    const response = await this.raw()
    const json = await response.json()
    return json
  }

  /**
   * Calls this.raw() but additionally parses the Response as text
   */
  public async text() {
    const response = await this.raw()
    const text = await response.text()
    return text
  }

  private _checkPath() {
    if (this.options.path) {
      throw new Error(
        'Path has already been set.  You can only call a request method (get, put, patch, etc) one time per request builder.'
      )
    }
  }

  private _handleStatusCodeAssertions(response: Response) {
    if (this.statusAssertion) {
      assert.strictEqual(
        response.status,
        this.statusAssertion,
        `You asserted a status of ${this.statusAssertion} but a status of ${response.status} was received.`
      )
    }
  }
}

const test = (app: ImplementsListen) => new TestDriver(app)
export default test
