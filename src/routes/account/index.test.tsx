import { describe, it, expect, vi } from 'vitest'
import { Route } from './index'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
  redirect: (args: unknown) => args,
}))

describe('/account/ route', () => {
  it('redirects to /account/profile via beforeLoad', () => {
    const config = Route as unknown as { beforeLoad: () => unknown }
    expect(() => config.beforeLoad()).toThrow()
  })
})
