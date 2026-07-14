import { useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import { Plus } from "lucide-react";

type FabAction = {
  key: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
};

const POSITION_KEY = "radnik-fab-position";
const HOLD_MS = 350;

// pozicija je translate offset preko default kuta (className) -> preziv refresh
function loadPosition(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return { x: 0, y: 0 };
    const p = JSON.parse(raw);
    return { x: p.x ?? 0, y: p.y ?? 0 };
  } catch {
    return { x: 0, y: 0 };
  }
}

// jedan floating button umjesto vise pojedinacnih -> "+" se otvara u stog akcija, rotira u "X"
// drzi (touch/mis) 350ms -> ulazi u drag mod, pomakni pa pusti -> pozicija se sprema
export function FloatingActionMenu({ actions, className = "" }: { actions: FabAction[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const boundsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const holdTimer = useRef<number>();
  const draggedRef = useRef(false);
  const initialPos = useRef(loadPosition());
  const x = useMotionValue(initialPos.current.x);
  const y = useMotionValue(initialPos.current.y);

  const startHold = (e: React.PointerEvent) => {
    draggedRef.current = false;
    holdTimer.current = window.setTimeout(() => {
      setHolding(true);
      draggedRef.current = true;
      dragControls.start(e);
    }, HOLD_MS);
  };

  const cancelHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
  };

  const handleClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <div ref={boundsRef} className="pointer-events-none fixed inset-4 z-40" />
      <motion.div
        data-fab-menu
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={boundsRef}
        style={{ x, y, touchAction: "none" }}
        onDragEnd={() => {
          setHolding(false);
          try {
            localStorage.setItem(POSITION_KEY, JSON.stringify({ x: x.get(), y: y.get() }));
          } catch {
            // ponytail: storage full/privatni mod -> pozicija se nece pamtiti, ne blokiraj app
          }
        }}
        className={`fixed z-50 flex flex-col items-center gap-3 ${className}`}
      >
        <AnimatePresence>
          {open &&
            actions.map((action, i) => {
              const Comp = action.href ? motion.a : motion.button;
              return (
                <Comp
                  key={action.key}
                  href={action.href}
                  target={action.href ? "_blank" : undefined}
                  rel={action.href ? "noreferrer" : undefined}
                  onClick={() => {
                    action.onClick?.();
                    setOpen(false);
                  }}
                  aria-label={action.label}
                  initial={{ opacity: 0, y: 14, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14, scale: 0.9 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-foreground text-background shadow-lg"
                >
                  {action.icon}
                </Comp>
              );
            })}
        </AnimatePresence>

        <motion.button
          type="button"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onClick={handleClick}
          aria-label={open ? "Zatvori izbornik" : "Otvori izbornik"}
          animate={{ scale: holding ? 1.15 : 1 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          whileTap={{ scale: 0.95 }}
          className={`flex h-14 w-14 items-center justify-center rounded-full text-background shadow-lg ${
            holding ? "cursor-grabbing bg-primary" : "cursor-pointer bg-foreground"
          }`}
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center justify-center"
          >
            <Plus className="h-6 w-6" />
          </motion.span>
        </motion.button>
      </motion.div>
    </>
  );
}
