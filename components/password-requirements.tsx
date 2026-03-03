import React from 'react';
import { Check, X } from 'lucide-react';
import { PasswordStrength, validatePassword } from '@/utils/password-validation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PasswordRequirementsProps {
    password?: string;
    showIfEmpty?: boolean; // If true, shows requirements even if password is empty (all red/gray)
}

export function PasswordRequirements({ password = '', showIfEmpty = false }: PasswordRequirementsProps) {
    // If we shouldn't show when empty and it IS empty, return null
    if (!showIfEmpty && !password) return null;

    const strength = validatePassword(password);

    const RequirementItem = ({ met, label }: { met: boolean; label: string }) => (
        <div className={cn("flex items-center gap-2 text-xs transition-colors duration-200", met ? "text-green-500" : "text-muted-foreground/60")}>
            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-200",
                met ? "bg-green-500/10 border-green-500/50" : "bg-muted/10 border-muted-foreground/20"
            )}>
                {met ? <Check className="w-2.5 h-2.5" /> : <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />}
            </div>
            <span>{label}</span>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 p-3 rounded-lg bg-muted/30 border border-muted/20"
        >
            <p className="text-xs font-medium text-muted-foreground mb-2">Password Requirements:</p>
            <div className="grid grid-cols-1 gap-1">
                <RequirementItem met={strength.length} label="At least 8 characters" />
                <RequirementItem met={strength.uppercase} label="One uppercase letter" />
                <RequirementItem met={strength.lowercase} label="One lowercase letter" />
                <RequirementItem met={strength.number} label="One number" />
                <RequirementItem met={strength.symbol} label="One symbol" />
            </div>
        </motion.div>
    );
}
