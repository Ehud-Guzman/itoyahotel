import { createClient } from '@sanity/client'
import { useState, useEffect } from 'react'

const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID || ''
const DATASET   = import.meta.env.VITE_SANITY_DATASET   || 'production'

export const SANITY_CONFIGURED = Boolean(PROJECT_ID)

// createClient throws on an empty projectId, which would blank the whole site
// when env vars are missing at build time — only create it when configured.
export const client = SANITY_CONFIGURED
  ? createClient({
      projectId: PROJECT_ID,
      dataset:   DATASET,
      useCdn:    true,
      apiVersion: '2024-06-01',
      // Default is 5 retries with backoff — on an origin missing from the Sanity
      // CORS allowlist that turns into a multi-second failed-request storm that
      // blocks page quiescence. One retry, then fall back to local content.
      maxRetries: 1,
    })
  : null

/**
 * Append Sanity CDN resize params to a Sanity image URL.
 * Local/relative paths are returned unchanged so fallback images still work.
 */
export function imgUrl(url, w, h) {
  if (!url || !url.startsWith('https://cdn.sanity.io')) return url
  const parts = [`w=${w}`, 'auto=format']
  if (h) parts.push(`h=${h}`, 'fit=crop')
  return `${url}?${parts.join('&')}`
}

/**
 * A responsive srcset for a Sanity CDN image, so the browser can pick a size
 * that fits the screen instead of downloading the full-resolution original.
 * Returns undefined for local/relative paths, so callers can safely do
 * `srcSet={imgSrcSet(src) || srcSet(src)}` and keep the local variants working.
 */
export function imgSrcSet(url, widths = [480, 640, 960, 1280, 1600, 2000, 2560]) {
  if (!url || !url.startsWith('https://cdn.sanity.io')) return undefined
  return widths.map((w) => `${url}?w=${w}&auto=format ${w}w`).join(', ')
}

/**
 * Fetches a GROQ query from Sanity once. Falls back to `fallback` when
 * Sanity is not yet configured or the result is empty.
 */
export function useSanity(query, fallback = null) {
  const [data, setData]       = useState(fallback)
  const [loading, setLoading] = useState(SANITY_CONFIGURED)

  useEffect(() => {
    if (!SANITY_CONFIGURED) return
    let cancelled = false
    client.fetch(query)
      .then((result) => {
        if (cancelled) return
        if (Array.isArray(result) && result.length > 0) setData(result)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [query])

  return { data, loading }
}

/**
 * Like useSanity, but for a single document (a "singleton") such as
 * siteSettings, where the result is an object rather than an array.
 * Starts at `fallback` and is replaced once a non-empty object arrives.
 */
export function useSanityObject(query, fallback = null) {
  const [data, setData] = useState(fallback)

  useEffect(() => {
    if (!SANITY_CONFIGURED) return
    let cancelled = false
    client.fetch(query)
      .then((result) => {
        if (cancelled) return
        if (result && typeof result === 'object') setData(result)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [query])

  return data
}
