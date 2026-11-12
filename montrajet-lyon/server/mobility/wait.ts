/** Cancel a queued operation without bypassing the work already ahead of it. */
export function waitForTurn(turn: Promise<void>, signal?: AbortSignal): Promise<void> {
  if (!signal) return turn
  signal.throwIfAborted()
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener('abort', abort)
      reject(signal.reason)
    }
    signal.addEventListener('abort', abort, { once: true })
    void turn.then(
      () => { signal.removeEventListener('abort', abort); resolve() },
      error => { signal.removeEventListener('abort', abort); reject(error) }
    )
    if (signal.aborted) abort()
  })
}

/** An interruptible rate-limit delay. An aborted search never waits for the timer. */
export function pause(ms: number, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted()
  if (ms <= 0) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => signal?.removeEventListener('abort', abort)
    const abort = () => {
      clearTimeout(timer)
      cleanup()
      reject(signal?.reason)
    }
    const timer = setTimeout(() => { cleanup(); resolve() }, ms)
    signal?.addEventListener('abort', abort, { once: true })
    if (signal?.aborted) abort()
  })
}
