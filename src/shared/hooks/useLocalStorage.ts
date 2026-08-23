import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(
    key: string,
    read: (raw: string) => T | null,
    write: (value: T) => string,
): [T | null, (value: T) => void, () => void] {
    const [value, setValue] = useState<T | null>(() => {
        try {
            const raw = window.localStorage.getItem(key);
            return raw === null ? null : read(raw);
        } catch {
            return null;
        }
    });

    const update = useCallback(
        (next: T): void => {
            setValue(next);
            try {
                window.localStorage.setItem(key, write(next));
            } catch {
                // storage unavailable (private mode/quota); keep in-memory value only
            }
        },
        [key, write],
    );

    const clear = useCallback((): void => {
        setValue(null);
        try {
            window.localStorage.removeItem(key);
        } catch {
            // ignore
        }
    }, [key]);

    useEffect(() => {
        const handleStorage = (event: StorageEvent): void => {
            if (event.key !== key) return;
            try {
                setValue(event.newValue === null ? null : read(event.newValue));
            } catch {
                setValue(null);
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [key, read]);

    return [value, update, clear];
}
