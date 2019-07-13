import * as koa from 'koa'
import * as express from 'express'
import * as http from 'http'
import * as bodyParser from 'body-parser'
import * as FormData from 'form-data'
import * as multer from 'multer'
import test from '../src'

// tslint:disable:no-floating-promises

describe('express:microtest', () => {
  const app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(multer().array())
  // basic test routes
  app.get('/testget', (req, res) => res.send('get response'))
  app.post('/testpost', (req, res) => res.send('post response'))
  app.put('/testput', (req, res) => res.send('put response'))
  app.patch('/testpatch', (req, res) => res.send('patch response'))
  app.delete('/testdelete', (req, res) => res.send('delete response'))

  app.post('/testformdata', (req, res) => {
    res.send(req.body.testField)
  })

  app.post('/testurlencoded', (req, res) => res.send(req.body.name))
  app.post('/testjsonpost', (req, res) => res.json({ result: req.body.name }))

  // other
  it('get', async () => {
    const response = await test(app)
      .get('/testget')
      .text()
    expect(response).toEqual('get response')
  })

  it('post', async () => {
    const response = await test(app)
      .post('/testpost')
      .text()
    expect(response).toEqual('post response')
  })

  it('put', async () => {
    const response = await test(app)
      .put('/testput')
      .text()
    expect(response).toEqual('put response')
  })
  it('patch', async () => {
    const response = await test(app)
      .patch('/testpatch')
      .text()
    expect(response).toEqual('patch response')
  })

  it('delete', async () => {
    const response = await test(app)
      .delete('/testdelete')
      .text()
    expect(response).toEqual('delete response')
  })

  it('works with form-data post requests', async () => {
    const form = new FormData()
    form.append('testField', 'successful form data value')
    const response = await test(app)
      .post('/testformdata')
      .send(form)
      .text()
    expect(response).toEqual('successful form data value')
  })

  it('works with url encoded requests', async () => {
    const urlRequest = `name=Tester`
    const response = await test(app)
      .header('Content-Type', 'application/x-www-form-urlencoded')
      .post('/testurlencoded')
      .send(urlRequest)
      .text()
    expect(response).toEqual('Tester')
  })

  it('works with json encoded request', async () => {
    const response = await test(app)
      .post('/testjsonpost')
      .sendJSON({ name: 'JSON Test' })
      .json()
    expect(response).toMatchObject({ result: 'JSON Test' })
  })

  it('works with raw response', async () => {
    const response = await test(app)
      .get('/testget')
      .raw()
    expect(response.ok).toBeTruthy()
  })

  it('passes through custom options', async () => {
    const response = await test(app)
      .post('/testget') // cannot post to /testget
      .fetchOptions({ compress: true })
      .raw()
    expect(response.status).toBe(404)
  })

  it('assert response status: 200', () => {
    const response = test(app)
      .get('/testget')
      .assertStatus(200)
      .text()
    expect(response).resolves.toBe('get response')
  })

  it('assert response status: 404', () => {
    const response = test(app)
      .get('/asdfasdfasdf')
      .assertStatus(404)
      .text()
    expect(response).resolves.toBeTruthy()
  })
  it('assert response status: throws when not met', () => {
    const response = test(app)
      .get('/asdfasdfasdf')
      .assertStatus(200)
      .text()
    expect(response).rejects.toBeTruthy()
  })
  it('assert response status: throws if called multiple times', () => {
    const testThrow = () =>
      test(app)
        .get('/asdfasdfasdf')
        .assertStatus(200)
        .assertStatus(404)
    expect(testThrow).toThrowError('Can only assert one status per request')
  })
})

describe('koa:microtest', () => {
  // there is no framework logic in the library, so we just need to test that the app
  // constructor works correctly
  const app = new koa()
  app.use(async ctx => {
    ctx.body = 'Hello ' + ctx.request.headers['x-name']
  })
  it('constructs a koa app', async () => {
    const response = await test(app)
      .get('/whatever')
      .header('x-name', 'Tester')
      .text()
    expect(response).toBe('Hello Tester')
  })
})

describe('http-server:microtest', () => {
  // same with koa, don't need to test the library, just the contructor
  const app = http.createServer((req, res) => {
    res.write('Hello from raw node.js!')
    res.end()
  })
  it('constructs a raw node.js server', async () => {
    const response = await test(app)
      .get('/whatever')
      .text()
    expect(response).toBe('Hello from raw node.js!')
  })
})
