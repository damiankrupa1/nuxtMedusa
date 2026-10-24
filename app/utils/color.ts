// Medusa variant color option values are plain names (e.g. "Black"), no hex
// — see missing-medusa-api-data skill. Small name -> swatch color mock,
// falls back to a neutral gray for anything unrecognized.
const colorSwatches: Record<string, string> = {
  black: '#1a1a1a',
  white: '#faf9f4',
  ecru: '#ddd4c3',
  beige: '#ddd4c3',
  cream: '#f0eee8',
  ivory: '#f0eee8',
  grey: '#777568',
  gray: '#777568',
  graphite: '#494943',
  navy: '#2b3142',
  blue: '#3b5272',
  brown: '#4d392b',
  camel: '#a38a66',
  tan: '#a38a66',
  khaki: '#777568',
  green: '#4b5a42',
  olive: '#555c45',
  red: '#8a3324',
  burgundy: '#5c2330',
  pink: '#d9b8b0',
}

export const getSwatchColor = (name: string) =>
  colorSwatches[name.trim().toLowerCase()] || '#bdb5a6'
