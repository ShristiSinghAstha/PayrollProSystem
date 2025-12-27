import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const OTPInput = ({ length = 6, onComplete, disabled = false }) => {
    const [otp, setOtp] = useState(Array(length).fill(''));
    const inputRefs = useRef([]);

    useEffect(() => {
        // Focus first input on mount
        if (inputRefs.current[0] && !disabled) {
            inputRefs.current[0].focus();
        }
    }, [disabled]);

    const handleChange = (index, value) => {
        if (disabled) return;

        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if value entered
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Call onComplete if all filled
        if (newOtp.every(digit => digit !== '') && onComplete) {
            onComplete(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (disabled) return;

        // Handle backspace
        if (e.key === 'Backspace') {
            e.preventDefault();
            const newOtp = [...otp];

            if (otp[index]) {
                // Clear current box
                newOtp[index] = '';
                setOtp(newOtp);
            } else if (index > 0) {
                // Move to previous and clear
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            }
        }
        // Handle left arrow
        else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        // Handle right arrow
        else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        if (disabled) return;

        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').trim();

        // Only accept 6 digits
        if (!/^\d{6}$/.test(pastedData)) return;

        const digits = pastedData.split('');
        setOtp(digits);

        // Focus last input
        inputRefs.current[length - 1]?.focus();

        // Call onComplete
        if (onComplete) {
            onComplete(pastedData);
        }
    };

    return (
        <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={cn(
                        "w-12 h-14 text-center text-2xl font-semibold rounded-lg border-2 transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                        disabled
                            ? "bg-muted cursor-not-allowed"
                            : "bg-background",
                        digit
                            ? "border-primary"
                            : "border-border hover:border-muted-foreground"
                    )}
                />
            ))}
        </div>
    );
};

export default OTPInput;
