import { useEffect, useRef } from 'react'

export function integrationRequest(installation, command, project, chatId) {
  if (typeof command !== 'string' || installation?.state !== 'succeeded' || installation.command !== command ||
      !chatId || installation.chatId !== chatId || !installation.requestId ||
      !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(installation.target || '') ||
      !/^Playground\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(project || '')) return null
  const named = command.match(/Playground\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}/g) || []
  if (named.some(path => path !== project)) return null
  // Continue with actual model/tool work, not a synthetic assistant result or
  // another slash installation. The original request remains in chat history.
  return `Continue the preceding request by integrating @${installation.target} into ${project}. ` +
    'The extension is ready; project integration is still pending. ' +
    'Use its current integration guidance and the actual project files to make the requested changes. ' +
    'Preserve existing work, keep credentials private, and verify what the original request allows. ' +
    'If this application needs no code connection, explain how to use it with the project instead of creating placeholder files.'
}

export default function useExtensionProjectIntegration({ chatId, installation, command, project, idle, sendMessage }) {
  const handled = useRef(new Set())
  const scope = useRef(chatId)
  useEffect(() => {
    if (scope.current !== chatId) { handled.current.clear(); scope.current = chatId }
    const request = integrationRequest(installation, command, project, chatId)
    if (!idle || !request) return
    const key = JSON.stringify([chatId, installation.requestId || command, installation.target, project])
    if (handled.current.has(key)) return
    // Mark before invoking the sender: React rerenders/StrictMode must not
    // enqueue a second model turn. Historical conversations have no live
    // successful installation receipt and never reach this point.
    handled.current.add(key)
    void sendMessage(request)
  }, [chatId, installation, command, project, idle, sendMessage])
}
