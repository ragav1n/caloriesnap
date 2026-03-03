export interface PasswordStrength {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    symbol: boolean;
    isValid: boolean;
    error?: string;
}

export const validatePassword = (password: string): PasswordStrength => {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password),
    };

    const isValid = Object.values(checks).every(Boolean);
    let error: string | undefined;

    if (!isValid) {
        if (!checks.length) error = 'Password must be at least 8 characters';
        else if (!checks.uppercase) error = 'Password must contain at least one uppercase letter';
        else if (!checks.lowercase) error = 'Password must contain at least one lowercase letter';
        else if (!checks.number) error = 'Password must contain at least one number';
        else if (!checks.symbol) error = 'Password must contain at least one symbol';
    }

    return { ...checks, isValid, error };
};
