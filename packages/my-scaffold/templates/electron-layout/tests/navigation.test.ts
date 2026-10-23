import assert from 'node:assert/strict'
import { test } from 'vitest'
import { isRendererUrl } from '../electron/navigation'

test('the renderer can use hash routes in development and packaged builds', () => {
  for (const url of ['http://127.0.0.1:5173/', 'file:///Applications/My%20App/dist/index.html']) {
    assert.equal(isRendererUrl(url, url), true)
    assert.equal(isRendererUrl(`${url}#settings`, url), true)
  }
})

test('different origins, ports, paths, queries, and malformed URLs are rejected', () => {
  const rendererUrl = 'http://127.0.0.1:5173/'
  for (const url of [
    'https://example.com/',
    'http://127.0.0.1:5174/',
    'http://127.0.0.1:5173/other',
    'http://127.0.0.1:5173/?redirect=outside',
    'http://127.0.0.1:5173@evil.example/',
    'not a URL',
  ]) {
    assert.equal(isRendererUrl(url, rendererUrl), false)
  }
  assert.equal(isRendererUrl('file:///other/index.html', 'file:///app/dist/index.html'), false)
})
