import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, loadSettings, parseSettings, saveSettings } from './storage'

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  }
}

describe('settings storage', () => {
  it('round-trips valid settings', () => {
    const storage = fakeStorage()
    saveSettings({ amount: 25, category: 17, difficulty: 'hard' }, storage)
    expect(loadSettings(storage)).toEqual({ amount: 25, category: 17, difficulty: 'hard' })
  })

  it('falls back to defaults when nothing is stored', () => {
    expect(loadSettings(fakeStorage())).toEqual(DEFAULT_SETTINGS)
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS)
  })

  it('falls back to defaults for corrupt JSON', () => {
    expect(parseSettings('{not json')).toEqual(DEFAULT_SETTINGS)
  })

  it('sanitises each field independently', () => {
    expect(parseSettings(JSON.stringify({ amount: 999, category: 'x', difficulty: 'impossible' }))).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings(JSON.stringify({ amount: 7, category: 9, difficulty: 'easy' }))).toEqual({
      amount: 7,
      category: 9,
      difficulty: 'easy',
    })
  })

  it('never throws when storage is unavailable or full', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('quota')
      },
    }
    expect(loadSettings(broken)).toEqual(DEFAULT_SETTINGS)
    expect(() => saveSettings(DEFAULT_SETTINGS, broken)).not.toThrow()
  })
})
