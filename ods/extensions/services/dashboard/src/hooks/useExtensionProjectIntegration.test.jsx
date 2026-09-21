import { StrictMode } from 'react'
import { renderHook } from '@testing-library/react'
import useExtensionProjectIntegration, { integrationRequest } from './useExtensionProjectIntegration'

const command = '/extensions @demo use it in this project'
const installed = {state: 'succeeded', command, target: 'demo', chatId: 'chat', requestId: 'turn'}
const props = () => ({chatId: 'chat', installation: installed, command, project: 'Playground/app', idle: true, sendMessage: vi.fn()})

test('continues through the real sender once after readiness without replaying the slash command', () => {
  const input = props()
  const view = renderHook(value => useExtensionProjectIntegration(value), {initialProps: {...input, idle: false}, wrapper: StrictMode})
  expect(input.sendMessage).not.toHaveBeenCalled()
  view.rerender(input)
  expect(input.sendMessage).toHaveBeenCalledTimes(1)
  const prompt = input.sendMessage.mock.calls[0][0]
  expect(prompt).toContain('@demo into Playground/app')
  expect(prompt).toContain('project integration is still pending')
  expect(prompt).not.toContain('/extensions')
  view.rerender({...input, installation: {...installed}})
  expect(input.sendMessage).toHaveBeenCalledTimes(1)
})

test.each([undefined, {...installed, state: 'pending'}, {...installed, state: 'blocked'},
  {...installed, chatId: 'old-chat'}, {...installed, requestId: undefined}, {...installed, command: 'other request'}])(
  'history, unfinished operations and unrelated receipts cannot trigger code changes: %j', installation => {
    const input = {...props(), installation}
    renderHook(() => useExtensionProjectIntegration(input))
    expect(input.sendMessage).not.toHaveBeenCalled()
  })

test('a chat switch cannot reuse the previous chat installation receipt', () => {
  const input = props()
  const view = renderHook(value => useExtensionProjectIntegration(value), {initialProps: {...input, idle: false}})
  view.rerender({...input, chatId: 'new-chat'})
  expect(input.sendMessage).not.toHaveBeenCalled()
})

test('an explicit different project requires resolution before integration', () => {
  const other = '/extensions @demo use Playground/other'
  expect(integrationRequest({...installed, command: other}, other, 'Playground/app', 'chat')).toBeNull()
  expect(integrationRequest(installed, command, '../app', 'chat')).toBeNull()
})
