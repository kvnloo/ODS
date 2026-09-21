import { act, renderHook } from '@testing-library/react'
import useGithubExtensionRequest, { githubExtensionRepository, advanceGithubExtension } from './useGithubExtensionRequest'

const command = '/extensions https://github.com/Owner/Repo.git configure for my project'
const identity = { chatId: 'chat', requestId: 'turn' }
const receipt = { schemaVersion: 1, ...identity, repository: 'https://github.com/owner/repo',
  state: 'pending', installationStarted: false }
const response = value => ({ ok: true, json: async () => value })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

const proposal = { draftId: 'a'.repeat(64), recipeDigest: 'b'.repeat(64), extensionId: 'example' }
const proposed = { ...receipt, proposal }
const prepared = { schemaVersion: 1, extensionId: 'example', recipeDigest: proposal.recipeDigest,
  state: 'available', installationStarted: false, registered: false, runtimeVerified: false }
const ready = { schemaVersion: 1, extensionId: 'example', state: 'succeeded', dispatched: false,
  plan: { extensionId: 'example', steps: [{ extensionId: 'example', action: 'none', status: 'enabled' }] } }

test('validated proposal prepares exact request before normal coordinator confirms readiness', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(response(prepared))
    .mockResolvedValueOnce(response(proposed)).mockResolvedValueOnce(response(ready))
  const report = vi.fn()
  await advanceGithubExtension(receipt, proposed, new AbortController().signal, report, fetcher)
  expect(fetcher.mock.calls.map(call => call[0])).toEqual([
    '/api/extensions/github/requests/prepare', '/api/extensions/github/requests', '/api/extensions/example/install-next',
  ])
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(identity)
  expect(report).toHaveBeenLastCalledWith({ target: 'example', state: 'succeeded' })
})

test('waits for proposal and cancellation prevents preparation or installation', async () => {
  vi.useFakeTimers()
  const controller = new AbortController()
  const fetcher = vi.fn().mockResolvedValue(response(receipt))
  const pending = advanceGithubExtension(receipt, receipt, controller.signal, vi.fn(), fetcher)
  await vi.advanceTimersByTimeAsync(5000)
  expect(fetcher).toHaveBeenCalledTimes(1)
  controller.abort()
  await pending
  await vi.advanceTimersByTimeAsync(10000)
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(JSON.parse(fetcher.mock.calls[0][1].body).action).toBe('read')
})

test.each([{ state: 'cancelled' }, { proposal: { ...proposal, recipeDigest: 'c'.repeat(64) } }])(
  'changed request cannot advance after recipe preparation: %j', async change => {
    const fetcher = vi.fn().mockResolvedValueOnce(response(prepared)).mockResolvedValueOnce(response({ ...proposed, ...change }))
    await expect(advanceGithubExtension(receipt, proposed, new AbortController().signal, vi.fn(), fetcher)).rejects.toThrow()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(fetcher.mock.calls.some(call => call[0].endsWith('/install-next'))).toBe(false)
  })

test('ambiguous preparation is not retried and cannot claim installation', async () => {
  const fetcher = vi.fn().mockRejectedValue(new Error('acknowledgement lost'))
  const report = vi.fn()
  await expect(advanceGithubExtension(receipt, proposed, new AbortController().signal, report, fetcher)).rejects.toThrow()
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(report).not.toHaveBeenCalledWith(expect.objectContaining({ state: 'succeeded' }))
})

test('parses only explicit repository commands, preserving the repository boundary', () => {
  expect(githubExtensionRepository(command)).toBe('https://github.com/owner/repo')
  for (const invalid of ['discuss ' + command, '/extensions @repo', '/extensions https://github.com/o/r/tree/main',
    '/extensions https://github.com/o/r?token=secret', '/extensions https://github.com.evil/o/r']) {
    expect(githubExtensionRepository(invalid)).toBeNull()
  }
})

test('history rendering has no effect; a fresh accepted command registers once and never installs', async () => {
  const fetcher = vi.fn().mockResolvedValue(response(receipt))
  vi.stubGlobal('fetch', fetcher)
  const view = renderHook(() => useGithubExtensionRequest('chat'))
  expect(fetcher).not.toHaveBeenCalled()
  await act(async () => { view.result.current.start(command, identity); await Promise.resolve() })
  await act(async () => { view.result.current.start(command, identity) })
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(fetcher.mock.calls[0][0]).toBe('/api/extensions/github/requests')
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ action: 'create', ...identity, command })
  view.unmount()
})

test('abort records cancellation before a slow creation response and never revives it', async () => {
  let finish
  const fetcher = vi.fn().mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    .mockResolvedValue(response({ ...receipt, state: 'cancelled' }))
  vi.stubGlobal('fetch', fetcher)
  const view = renderHook(() => useGithubExtensionRequest('chat'))
  const controller = new AbortController()
  act(() => view.result.current.start(command, identity, controller.signal))
  await act(async () => controller.abort())
  expect(JSON.parse(fetcher.mock.calls[1][1].body).action).toBe('cancel')
  await act(async () => finish(response(receipt)))
  expect(fetcher).toHaveBeenCalledTimes(2)
  view.unmount()
})

test('changing chats cancels only the original chat and turn', async () => {
  const fetcher = vi.fn().mockResolvedValue(response(receipt))
  vi.stubGlobal('fetch', fetcher)
  const view = renderHook(({ chat }) => useGithubExtensionRequest(chat), { initialProps: { chat: 'chat' } })
  await act(async () => view.result.current.start(command, identity))
  view.rerender({ chat: 'next' })
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ action: 'cancel', ...identity })
  view.unmount()
})
