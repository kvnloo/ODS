import { useCallback, useEffect, useRef, useState } from 'react'
import { advanceCatalogInstallation } from './useExtensionInstallation'

export function githubExtensionRepository(command) {
  const match = typeof command === 'string' && command.trim().match(/^(?:\/goal\s+)?\/extensions?\s+(https:\/\/github\.com\/[^\s]+)(?:\s|$)/i)
  if (!match) return null
  try {
    const url = new URL(match[1])
    if (url.protocol !== 'https:' || url.host !== 'github.com' || url.search || url.hash || url.username || url.password) return null
    const parts = url.pathname.replace(/\/$/, '').split('/').slice(1)
    if (parts.length !== 2) return null
    const [owner, rawName] = parts
    const name = rawName.replace(/\.git$/, '')
    if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(owner) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(name)) return null
    return `https://github.com/${owner}/${name}`.toLowerCase()
  } catch { return null }
}

async function requestScope(body, { signal, fetcher = fetch, prepare = false } = {}) {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) abort()
  const timeout = setTimeout(abort, prepare ? 120000 : 15000)
  try {
    const response = await fetcher('/api/extensions/github/requests' + (prepare ? '/prepare' : ''), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), cache: 'no-store', signal: controller.signal,
      keepalive: body.action === 'cancel',
    })
    if (!response.ok) throw new Error('Extension request unavailable')
    return await response.json()
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort) }
}

function verifyScope(receipt, run, proposal) {
  if (receipt?.schemaVersion !== 1 || receipt.chatId !== run.chatId || receipt.requestId !== run.requestId ||
      receipt.repository !== run.repository || receipt.state !== 'pending' || receipt.installationStarted !== false) {
    throw new Error('Extension request is no longer active')
  }
  const next = receipt.proposal
  if (next && (!/^[a-f0-9]{64}$/.test(next.draftId) || !/^[a-f0-9]{64}$/.test(next.recipeDigest) ||
      !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(next.extensionId))) throw new Error('Invalid extension proposal')
  if (proposal && (!next || ['draftId', 'recipeDigest', 'extensionId'].some(key => next[key] !== proposal[key]))) {
    throw new Error('Extension proposal changed')
  }
  return next
}

const waitForProposal = signal => new Promise(resolve => {
  const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve() }
  const timer = setTimeout(finish, 5000)
  signal.addEventListener('abort', finish, { once: true })
  if (signal.aborted) finish()
})

export async function advanceGithubExtension(run, initialReceipt, signal, report, fetcher = fetch) {
  const identity = { chatId: run.chatId, requestId: run.requestId }
  let receipt = initialReceipt
  for (let attempt = 0; attempt < 720 && !signal.aborted; attempt++) {
    const proposal = verifyScope(receipt, run)
    if (!proposal) {
      await waitForProposal(signal)
      if (signal.aborted) return
      receipt = await requestScope({ action: 'read', ...identity }, { signal, fetcher })
      continue
    }
    const prepared = await requestScope(identity, { signal, fetcher, prepare: true })
    if (signal.aborted) return
    if (prepared?.schemaVersion !== 1 || prepared.extensionId !== proposal.extensionId ||
        prepared.recipeDigest !== proposal.recipeDigest || prepared.state !== 'available' ||
        prepared.installationStarted !== false || prepared.registered !== false || prepared.runtimeVerified !== false) {
      throw new Error('Recipe preparation could not be confirmed')
    }
    report({ target: proposal.extensionId, state: 'pending' })
    // The normal coordinator owns dependencies, configuration and durable
    // host receipts. Recheck the live owner request before every advancement.
    const scopedFetch = async (url, options) => {
      const current = await requestScope({ action: 'read', ...identity }, { signal, fetcher })
      verifyScope(current, run, proposal)
      if (signal.aborted || options.signal?.aborted) throw new Error('Extension request cancelled')
      return fetcher(url, options)
    }
    await advanceCatalogInstallation(proposal.extensionId, signal, report, scopedFetch)
    return
  }
  if (!signal.aborted) throw new Error('Extension proposal was not received')
}

export default function useGithubExtensionRequest(chatId) {
  const current = useRef(null)
  const [state, setState] = useState(null)
  const stop = useCallback(() => {
    const run = current.current
    setState(null)
    if (!run) return
    current.current = null
    run.controller.abort()
    run.signal?.removeEventListener('abort', run.cancel)
    // The backend records cancellation even if creation has not arrived yet.
    void requestScope({ action: 'cancel', chatId: run.chatId, requestId: run.requestId }).catch(() => {})
  }, [])
  useEffect(() => { stop(); return stop }, [chatId, stop])
  const start = useCallback((command, identity, signal) => {
    if (current.current?.requestId === identity?.requestId && current.current?.chatId === identity?.chatId) return
    const repository = githubExtensionRepository(command)
    if (!repository) {
      // Keep the original request scope for conversational follow-ups. The
      // backend supplies its verified routing identity to the next model turn.
      if (typeof command === 'string' && command.trimStart().startsWith('/')) stop()
      return
    }
    if (signal?.aborted || !identity?.chatId || !identity?.requestId) return
    stop()
    const run = { ...identity, repository, command, signal, cancel: stop, controller: new AbortController() }
    current.current = run
    signal?.addEventListener('abort', run.cancel, { once: true })
    setState({ command, state: 'researching' })
    const report = value => {
      run.target = value.target
      if (current.current === run && !run.controller.signal.aborted) setState({ ...value, command, requestId: run.requestId, chatId: run.chatId })
    }
    const failed = () => {
      if (current.current === run) {
        // A timeout is not cancellation. Keep the original durable scope so
        // readback can recover an accepted proposal or host operation.
        run.busy = false
        setState({ target: run.target, command, requestId: run.requestId, chatId: run.chatId, state: 'reconciliation_required' })
      }
    }
    const execute = async receipt => {
      if (current.current !== run) return
      try { await advanceGithubExtension(run, receipt, run.controller.signal, report) }
      finally { run.busy = false }
    }
    run.busy = true
    run.resume = () => {
      if (run.busy || current.current !== run || run.controller.signal.aborted) return
      run.busy = true
      void requestScope({ action: 'read', ...identity }, { signal: run.controller.signal }).then(execute).catch(failed)
    }
    void requestScope({ action: 'create', ...identity, command }).then(execute).catch(failed)
  }, [stop])
  const resume = useCallback(() => current.current?.resume?.(), [])
  return { state, start, stop, resume }
}
