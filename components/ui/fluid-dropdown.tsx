"use client"

import * as React from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Custom hook for click outside detection
function useClickAway(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) {
    React.useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return
            }
            handler(event)
        }

        document.addEventListener("mousedown", listener)
        document.addEventListener("touchstart", listener)

        return () => {
            document.removeEventListener("mousedown", listener)
            document.removeEventListener("touchstart", listener)
        }
    }, [ref, handler])
}

// Button component for the trigger
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "outline"
    children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    variant === "outline" && "border border-neutral-700 bg-transparent shadow-sm",
                    className
                )}
                {...props}
            >
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"

export interface DropdownItem {
    id: string
    label: string
    icon: React.ElementType
    color?: string
}

// Icon wrapper with animation
const IconWrapper = ({
    icon: Icon,
    isHovered,
    color = "currentColor",
}: { icon: React.ElementType; isHovered: boolean; color?: string }) => (
    <motion.div
        className="w-4 h-4 mr-2 relative flex items-center justify-center"
        initial={false}
        animate={isHovered ? { scale: 1.25 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
        <Icon 
            className="w-4 h-4 transition-colors duration-200" 
            style={{ color: color }} 
            strokeWidth={isHovered ? 2.5 : 2}
        />
    </motion.div>
)

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            when: "beforeChildren",
            staggerChildren: 0.05,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.32, 0.725, 0.32, 1] as any,
        },
    },
}

interface FluidDropdownProps {
    items: DropdownItem[];
    value?: string;
    onSelect?: (item: DropdownItem) => void;
    className?: string;
    placeholder?: string;
}

export function FluidDropdown({ items, value, onSelect, className, placeholder = "Select item" }: FluidDropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [hoveredId, setHoveredId] = React.useState<string | null>(null)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    const selectedItem = items.find(item => item.id === value) || items[0]

    useClickAway(dropdownRef as React.RefObject<HTMLElement>, () => setIsOpen(false))

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setIsOpen(false)
        }
    }

    const handleSelect = (item: DropdownItem) => {
        setIsOpen(false);
        onSelect?.(item);
    }

    return (
        <MotionConfig reducedMotion="user">
            <div
                className={cn("w-full relative", className)}
                ref={dropdownRef}
                onKeyDown={handleKeyDown}
            >
                <Button
                    variant="outline"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full justify-between bg-card/50 backdrop-blur-sm text-foreground",
                        "hover:bg-card/80",
                        "focus:ring-2 focus:ring-primary/50 focus:ring-offset-0",
                        "transition-all duration-200 ease-in-out",
                        "border border-white/10 shadow-lg",
                        "h-12 px-4 rounded-xl",
                        isOpen && "bg-card/80 border-primary/50",
                    )}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    type="button"
                >
                    <span className="flex items-center">
                        {selectedItem && (
                            <IconWrapper
                                icon={selectedItem.icon}
                                isHovered={false}
                                color={selectedItem.color}
                            />
                        )}
                        {selectedItem ? selectedItem.label : placeholder}
                    </span>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center w-5 h-5 opacity-50"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </Button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                height: "auto",
                                transition: {
                                    duration: 0.4,
                                    ease: [0.32, 0.725, 0.32, 1] as any,
                                },
                            }}
                            exit={{
                                opacity: 0,
                                y: -10,
                                height: 0,
                                transition: {
                                    duration: 0.3,
                                    ease: [0.32, 0.725, 0.32, 1] as any,
                                },
                            }}
                            className="absolute left-0 right-0 top-full mt-2 z-[100] overflow-hidden"
                        >
                            <motion.div
                                className="w-full rounded-xl border border-white/10 bg-card/95 backdrop-blur-xl p-1 shadow-2xl overflow-hidden"
                                initial={{ borderRadius: 12 }}
                                animate={{
                                    borderRadius: 16,
                                    transition: { duration: 0.2 },
                                }}
                                style={{ transformOrigin: "top" }}
                            >
                                <motion.div
                                    className="py-1 relative"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {/* Sliding Highlight */}
                                    <AnimatePresence>
                                        {(hoveredId || value) && (
                                            <motion.div
                                                layoutId="hover-highlight"
                                                className="absolute inset-x-1 bg-primary/20 rounded-lg h-10"
                                                initial={false}
                                                animate={{
                                                    y: items.findIndex((c) => (hoveredId || value) === c.id) * 40,
                                                }}
                                                transition={{
                                                    type: "spring",
                                                    bounce: 0.15,
                                                    duration: 0.4,
                                                }}
                                            />
                                        )}
                                    </AnimatePresence>

                                    {items.map((item) => (
                                        <motion.button
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            onHoverStart={() => setHoveredId(item.id)}
                                            onHoverEnd={() => setHoveredId(null)}
                                            className={cn(
                                                "relative flex w-full items-center px-4 h-10 text-sm rounded-lg",
                                                "transition-colors duration-150",
                                                "focus:outline-none",
                                                value === item.id || hoveredId === item.id
                                                    ? "text-primary font-semibold"
                                                    : "text-muted-foreground",
                                            )}
                                            whileTap={{ scale: 0.98 }}
                                            variants={itemVariants}
                                            type="button"
                                        >
                                            <IconWrapper
                                                icon={item.icon}
                                                isHovered={hoveredId === item.id}
                                                color={value === item.id || hoveredId === item.id ? "var(--primary)" : item.color}
                                            />
                                            <span className="transition-colors">
                                                {item.label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MotionConfig>
    )
}
