import * as http from 'http'
import fetch from 'node-fetch'

interface ImplementsListen {
  listen: (...args: any[]) => http.Server
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
  private options: RequestBuilderOptions = {
    headers: {},
    method: 'GET',
    port: 3456,
    requestOptionsOverrides: {},
  }
  constructor(app: ImplementsListen) {
    this.app = app
  }

  public port(customPort: number) {
    this.options.port = customPort
    return this
  }

  public send(postBody: any) {
    this.options.postBody = postBody
    return this
  }

  public sendJSON(json: any) {
    this.options.postBody = JSON.stringify(json)
    this.header('Content-Type', 'application/json')
    return this
  }

  public fetchOptions(options: any) {
    this.options.requestOptionsOverrides = options
    return this
  }

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

  public async raw() {
    this.server = this.app.listen(this.options.port)
    const response = await fetch(
      `http://localhost:${this.options.port}${this.options.path}`,
      {
        method: this.options.method,
        headers: this.options.headers,
        body: this.options.postBody,
        ...this.options.requestOptionsOverrides,
      }
    )
    this.server.close()
    return response
  }

  public async json() {
    const response = await this.raw()
    const json = await response.json()
    return json
  }

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
}

const test = (app: ImplementsListen) => new TestDriver(app)
export default test
