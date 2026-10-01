import { describe, expect, it } from 'vitest'
import { summariseTopListening } from '../../server/utils/lastfm'

const track = (name: string, artist: string, url = `https://www.last.fm/music/${artist}/_/${name}`) =>
  ({ name, url, artist: { name: artist } })

describe('summariseTopListening', () => {
  it('keeps Last.fm\'s order, which is already by plays', () => {
    const { tracks, artists } = summariseTopListening(
      { toptracks: { track: [track('Rain', 'Sleep Token'), track('Ragnarok', 'Periphery')] } },
      { topartists: { artist: [{ name: 'Sleep Token' }, { name: 'Periphery' }] } },
    )
    expect(tracks).toEqual([
      { title: 'Rain', artist: 'Sleep Token', href: 'https://www.last.fm/music/Sleep Token/_/Rain' },
      { title: 'Ragnarok', artist: 'Periphery', href: 'https://www.last.fm/music/Periphery/_/Ragnarok' },
    ])
    expect(artists).toEqual(['Sleep Token', 'Periphery'])
  })

  it('accepts a lone item sent as an object rather than an array', () => {
    const { tracks, artists } = summariseTopListening(
      { toptracks: { track: track('Rain', 'Sleep Token') } },
      { topartists: { artist: { name: 'Sleep Token' } } },
    )
    expect(tracks.map(t => t.title)).toEqual(['Rain'])
    expect(artists).toEqual(['Sleep Token'])
  })

  it('caps both lists', () => {
    const many = Array.from({ length: 10 }, (_, i) => track(`Track ${i}`, `Artist ${i}`))
    const { tracks, artists } = summariseTopListening(
      { toptracks: { track: many } },
      { topartists: { artist: many.map(t => ({ name: t.artist.name })) } },
      { tracks: 4, artists: 3 },
    )
    expect(tracks).toHaveLength(4)
    expect(artists).toEqual(['Artist 0', 'Artist 1', 'Artist 2'])
  })

  it('skips items without a title or an artist, and trims the rest', () => {
    const { tracks, artists } = summariseTopListening(
      { toptracks: { track: [{ name: '  ', artist: { name: 'X' } }, { name: 'Rain' }, track(' Rain ', ' Sleep Token ')] } },
      { topartists: { artist: [{ name: '' }, {}, { name: ' Periphery ' }] } },
    )
    expect(tracks.map(t => `${t.title}/${t.artist}`)).toEqual(['Rain/Sleep Token'])
    expect(artists).toEqual(['Periphery'])
  })

  it('links only to last.fm', () => {
    const { tracks } = summariseTopListening(
      { toptracks: { track: [track('Odd', 'Someone', 'javascript:alert(1)'), { name: 'Bare', artist: { name: 'Someone' } }] } },
      {},
    )
    expect(tracks).toEqual([{ title: 'Odd', artist: 'Someone' }, { title: 'Bare', artist: 'Someone' }])
  })

  it('returns empty lists when nothing has been scrobbled', () => {
    expect(summariseTopListening({ toptracks: { track: [] } }, {})).toEqual({ tracks: [], artists: [] })
  })
})
