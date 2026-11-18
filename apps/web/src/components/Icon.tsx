import type { ReactNode, SVGProps } from 'react'

export type IconName = 'battery' | 'bulb' | 'switch' | 'wire' | 'star' | 'hint' | 'reset' | 'speaker' | 'home' | 'arrow' | 'check' | 'globe' | 'book' | 'quiz' | 'reflect' | 'group' | 'pulse' | 'plus' | 'close' | 'play' | 'spark' | 'back'

type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number }

export function Icon({ name, size = 24, ...props }: Props) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const shapes: Record<IconName, ReactNode> = {
    battery: <><rect x="4" y="7" width="16" height="10" rx="2"/><path d="M20 10h2v4h-2M9 10v4m-2-2h4m4-2v4"/></>,
    bulb: <><path d="M9 18h6m-5 3h4m-6-8a6 6 0 1 1 8 0c-1 1-1 2-1 3h-4c0-1 0-2-1-3Z"/><path d="M12 3v2m8 5h-2M6 10H4m13-5-1 2M7 5l1 2"/></>,
    switch: <><rect x="3" y="7" width="18" height="10" rx="3"/><circle cx="7" cy="12" r="1.5"/><circle cx="17" cy="12" r="1.5"/><path d="M7 12 16 6"/></>,
    wire: <><path d="M3 12h5c4 0 4-6 8-6h5M3 9v6m18-6v6"/></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>,
    hint: <><path d="M9 18h6m-5 3h4m-6-8a6 6 0 1 1 8 0c-1 1-1 2-1 3h-4c0-1 0-2-1-3Z"/><path d="M12 7v4m0 2h.01"/></>,
    reset: <><path d="M3 11a9 9 0 1 1 2.6 6.4M3 4v7h7"/><path d="M12 7v5l3 2"/></>,
    speaker: <><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M16 9a5 5 0 0 1 0 6m2-9a9 9 0 0 1 0 12"/></>,
    home: <><path d="m3 11 9-8 9 8v9h-6v-6H9v6H3z"/></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5.5V22m4-15h8"/></>,
    quiz: <><path d="M5 4h14v16H5zM9 8h6m-6 4h6"/><path d="m9 16 2 2 4-4"/></>,
    reflect: <><path d="M4 4h16v13H9l-5 4z"/><path d="M8 9h8m-8 4h5"/></>,
    group: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20v-1a6 6 0 0 1 12 0v1m1-5a5 5 0 0 1 5 5"/></>,
    pulse: <><path d="M3 12h4l3-7 4 14 3-7h4"/></>,
    plus: <path d="M12 5v14m-7-7h14"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    play: <path d="m8 5 12 7-12 7z"/>,
    spark: <path d="m12 2 1.9 7.1L21 12l-7.1 1.9L12 21l-1.9-7.1L3 12l7.1-2.9L12 2Z"/>,
    back: <><path d="M20 12H4m6-6-6 6 6 6"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...common} {...props}>{shapes[name]}</svg>
}
