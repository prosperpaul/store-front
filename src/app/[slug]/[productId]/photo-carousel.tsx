'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

/**
 * The photo strip, with arrows.
 *
 * Each slide is exactly the width of the frame and snaps to its start. That
 * combination matters: with part-width slides and centre snapping, the first
 * and last photos need scroll positions that don't exist (you'd have to
 * scroll past the ends to centre them), and mandatory snapping can refuse to
 * move at all. Full-width slides make every snap point exactly
 * `index * frame width` -- reachable, and simple to drive from a button.
 *
 * Swiping still works; this is a real scroll container underneath.
 */
export function PhotoCarousel({
  photos,
  name,
}: {
  photos: string[]
  name: string
}) {
  const stripRef = useRef<HTMLUListElement>(null)
  const [index, setIndex] = useState(0)

  const many = photos.length > 1

  // Follow the strip's own scrolling, so swiping and tapping stay in sync.
  useEffect(() => {
    const strip = stripRef.current
    if (!strip || !many) return

    let frame = 0

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const width = strip.clientWidth
        if (width > 0) setIndex(Math.round(strip.scrollLeft / width))
      })
    }

    strip.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      strip.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [many])

  /** Wraps at both ends, so neither arrow is ever a dead button. */
  function go(to: number) {
    const strip = stripRef.current
    if (!strip) return

    const count = photos.length
    const wrapped = ((to % count) + count) % count

    strip.scrollTo({ left: wrapped * strip.clientWidth, behavior: 'smooth' })
    setIndex(wrapped)
  }

  return (
    <div className="mt-4">
      {/*
        This box is both the photo frame and the arrows' positioning context,
        so the two can't drift apart. Capping height on an inner element was
        the bug: the frame shrank, the wrapper didn't, and the arrows stayed
        pinned to the wrapper -- one on the photo, one adrift in the margin.

        min() caps the width by whichever bites first: 28rem on a wide screen,
        58vh on a short one, so the square never crowds the price and order
        button out of view.
      */}
      <div
        className="relative mx-auto aspect-square w-full"
        style={{ maxWidth: 'min(28rem, 58vh)' }}
      >
        <ul
          ref={stripRef}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl border-2 border-line scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, position) => (
            <li
              key={photo}
              className="relative h-full w-full shrink-0 snap-start bg-surface"
            >
              <Image
                src={photo}
                alt={`${name} photo ${position + 1}`}
                fill
                sizes="(min-width: 640px) 448px, 100vw"
                className="object-cover"
                priority={position === 0}
              />
            </li>
          ))}
        </ul>

        {many && (
          <>
            <Arrow direction="prev" onClick={() => go(index - 1)} />
            <Arrow direction="next" onClick={() => go(index + 1)} />

            {/* Plain count, for when the dots get too many to read at a glance. */}
            <span className="badge absolute right-3 top-3 bg-background/90">
              {index + 1}/{photos.length}
            </span>
          </>
        )}
      </div>

      {many && (
        <ul className="mt-3 flex justify-center gap-2">
          {photos.map((photo, position) => (
            <li key={photo}>
              <button
                type="button"
                onClick={() => go(position)}
                aria-label={`Photo ${position + 1} of ${photos.length}`}
                aria-current={position === index ? 'true' : undefined}
                className={`h-2.5 rounded-full border-2 border-line transition-all ${
                  position === index ? 'w-6 bg-brand' : 'w-2.5 bg-background'
                }`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Arrow({
  direction,
  onClick,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
}) {
  const isPrev = direction === 'prev'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? 'Previous photo' : 'Next photo'}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center
                  justify-center rounded-full border-2 border-line bg-background/90
                  text-2xl font-bold leading-none backdrop-blur
                  active:translate-y-[calc(-50%+2px)] active:translate-x-0.5
                  ${isPrev ? 'left-2' : 'right-2'}`}
      style={{ boxShadow: '2px 2px 0 var(--shadow-hard)' }}
    >
      <span aria-hidden="true" className="-mt-0.5">
        {isPrev ? '‹' : '›'}
      </span>
    </button>
  )
}
