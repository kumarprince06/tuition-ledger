import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Icon } from './Icon'

/* ---------- toast ---------- */
type ToastState = { text: string; undo?: () => void } | null
const ToastCtx = createContext<(text: string, undo?: () => void) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

/* ---------- sheets (dialogs) ---------- */
type SheetApi = { open: (node: ReactNode) => void; close: () => void }
const SheetCtx = createContext<SheetApi>({ open: () => {}, close: () => {} })
export const useSheet = () => useContext(SheetCtx)

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [toastState, setToast] = useState<ToastState>(null)
  const [sheet, setSheet] = useState<ReactNode>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const toast = useCallback((text: string, undo?: () => void) => {
    setToast({ text, undo })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), undo ? 7000 : 4500)
  }, [])
  const api = useMemo<SheetApi>(
    () => ({ open: (n) => setSheet(n), close: () => setSheet(null) }),
    [],
  )
  return (
    <ToastCtx.Provider value={toast}>
      <SheetCtx.Provider value={api}>
        {children}
        {sheet}
        {toastState && (
          <div className="toast" role="status">
            <span className="grow">{toastState.text}</span>
            {toastState.undo && (
              <button
                onClick={() => {
                  toastState.undo!()
                  setToast(null)
                }}
              >
                Undo
              </button>
            )}
            <button
              aria-label="Dismiss"
              style={{ color: 'var(--paper)', opacity: 0.7 }}
              onClick={() => setToast(null)}
            >
              ✕
            </button>
          </div>
        )}
      </SheetCtx.Provider>
    </ToastCtx.Provider>
  )
}

const FOCUSABLE =
  'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)'

/** Modal dialog: bottom sheet on phones. Takes focus, traps Tab, Escape closes, focus returns to the opener. */
export function Sheet({
  title,
  children,
  footer,
}: {
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  const { close } = useSheet()
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const el =
      box.current?.querySelector<HTMLElement>('[autofocus],input:not(:disabled),select,textarea') ||
      box.current?.querySelector<HTMLElement>('.sheet-ft .btn-primary,.sheet-ft .btn-danger,button')
    el?.focus()
    return () => opener?.focus?.()
  }, [])
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') close()
    if (e.key !== 'Tab' || !box.current) return
    const f = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (!f.length) return
    if (e.shiftKey && document.activeElement === f[0]) {
      e.preventDefault()
      f[f.length - 1].focus()
    } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
      e.preventDefault()
      f[0].focus()
    }
  }
  return (
    <div
      className="scrim"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
      onKeyDown={onKey}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        ref={box}
      >
        <div className="sheet-hd">
          <h2 id="sheet-title">{title}</h2>
          <button className="icon-btn" aria-label="Close" onClick={close}>
            <Icon name="x" />
          </button>
        </div>
        <div className="sheet-bd">{children}</div>
        {footer && <div className="sheet-ft">{footer}</div>}
      </div>
    </div>
  )
}

export function CancelButton({ label = 'Cancel' }: { label?: string }) {
  const { close } = useSheet()
  return (
    <button className="btn" onClick={close}>
      {label}
    </button>
  )
}

type ConfirmOpts = {
  title: string
  body: ReactNode
  confirm: string
  danger?: boolean
  cancel?: string
  preview?: string
  onConfirm: () => void
}
function ConfirmSheet(o: ConfirmOpts) {
  const { close } = useSheet()
  return (
    <Sheet
      title={o.title}
      footer={
        <>
          <CancelButton label={o.cancel} />
          <button
            className={`btn ${o.danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              close()
              o.onConfirm()
            }}
          >
            {o.confirm}
          </button>
        </>
      }
    >
      <div className="small">{o.body}</div>
      {o.preview && <Bubble text={o.preview} />}
    </Sheet>
  )
}
export function useConfirm() {
  const { open } = useSheet()
  return (o: ConfirmOpts) => open(<ConfirmSheet {...o} />)
}

export const Bubble = ({ text }: { text: string }) => (
  <div className="bubble-wrap">
    <div className="bubble">{text}</div>
  </div>
)
