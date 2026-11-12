import test from 'node:test'
import assert from 'node:assert/strict'
import { pause, waitForTurn } from '../server/mobility/wait.ts'

test('an already cancelled queue entry fails immediately', async () => {
  const controller = new AbortController()
  controller.abort(new Error('cancelled'))
  assert.throws(() => waitForTurn(Promise.resolve(), controller.signal), /cancelled/)
})

test('aborting a queued entry does not require earlier work to finish', async () => {
  let release
  const blocking = new Promise(resolve => { release = resolve })
  const controller = new AbortController()
  const queued = waitForTurn(blocking, controller.signal)
  controller.abort(new Error('cancelled'))
  await assert.rejects(queued, /cancelled/)
  release()
  await blocking
})

test('an aborted pacing delay clears its timer promptly', async () => {
  const controller = new AbortController()
  const start = performance.now()
  const waiting = pause(1000, controller.signal)
  controller.abort(new Error('cancelled'))
  await assert.rejects(waiting, /cancelled/)
  assert.ok(performance.now() - start < 500)
})

test('an already cancelled pacing delay rejects even for zero milliseconds', async () => {
  const controller = new AbortController()
  controller.abort(new Error('cancelled'))
  assert.throws(() => pause(0, controller.signal), /cancelled/)
})
