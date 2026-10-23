const PATHS = {
  home: 'M3 11 12 4l9 7M5 10v10h14V10',
  cal: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
  users:
    'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .8 3.2 2.6 3.6 5.2',
  rupee: 'M7 4h11M7 9h11M7 4c6 0 6 10 0 10l8 6',
  check: 'M4 5h16v14H4zM8 12l3 3 5-6',
  mega: 'M3 10v4l11 5V5L3 10zM14 8a4 4 0 0 1 0 8M6 15l1.5 5',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15l1.5 1.5-2.4 2.4-1.5-1.5-2 .8V20h-3.4v-1.8l-2-.8-1.5 1.5-2.4-2.4L7.2 15l-.8-2H4.6v-3.4h1.8l.8-2-1.5-1.5 2.4-2.4L9.6 5l2-.8V2.4H15v1.8l2 .8 1.5-1.5 2.4 2.4L19.4 7.4l.8 2h1.8v3.4h-1.8z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  back: 'm15 5-7 7 7 7',
  x: 'M6 6l12 12M18 6 6 18',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5',
  wa: 'M4 20l1.3-4A8 8 0 1 1 8 18.8L4 20z',
} as const
export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'more' ? 3 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
