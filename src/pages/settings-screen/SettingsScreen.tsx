import { useRef, useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Toggle } from "@/shared/ui/Toggle";
import { PageContainer } from "@/shared/layout";
import { cn } from "@/shared/lib/cn";
import type { ThemeName } from "@/features/settings/state/settings.types";
import {
    exportSaveData,
    triggerJsonDownload,
    validateAndParseSaveData,
    type PersistedState,
} from "@/shared/lib/persistence/storage";
import { useAppSelector } from "@/app/store/hooks";

export type SoundSetting = boolean;
export type HapticsSetting = boolean;
export type MotionOverride = "system" | "on" | "off";

interface SettingsScreenProps {
    theme: ThemeName;
    soundEnabled: boolean;
    hapticsEnabled: boolean;
    motion: MotionOverride;
    onThemeChange: (theme: ThemeName) => void;
    onSoundChange: (enabled: boolean) => void;
    onHapticsChange: (enabled: boolean) => void;
    onMotionChange: (motion: MotionOverride) => void;
    onResetStatistics: () => void;
    onResetSettings: () => void;
    onImportData: (data: PersistedState) => void;
    onBack: () => void;
}

function ToggleRow({
    id,
    label,
    checked,
    onChange,
}: {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <label htmlFor={id} className="cursor-pointer font-semibold">
                {label}
            </label>
            <Toggle id={id} checked={checked} onChange={onChange} />
        </div>
    );
}

const MOTION_OPTIONS: MotionOverride[] = ["system", "on", "off"];

const THEME_OPTIONS: Array<{
    id: ThemeName;
    name: string;
    p1Color: string;
    p2Color: string;
    bgColor: string;
}> = [
    {
        id: "default",
        name: "Neo-Brutal",
        p1Color: "#7fd8de",
        p2Color: "#f9b8c6",
        bgColor: "#fdfcf7",
    },
    {
        id: "minimal",
        name: "Minimal",
        p1Color: "#38bdf8",
        p2Color: "#fb7185",
        bgColor: "#f8fafc",
    },
    {
        id: "dark",
        name: "Dark",
        p1Color: "#2dd4bf",
        p2Color: "#f472b6",
        bgColor: "#0f172a",
    },
    {
        id: "colorblind",
        name: "Accessible",
        p1Color: "#1d4ed8",
        p2Color: "#d97706",
        bgColor: "#fdfbf7",
    },
];

export function SettingsScreen(props: SettingsScreenProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const settingsState = useAppSelector((state) => state.settings);
    const statsState = useAppSelector((state) => state.statistics);

    const [confirmAction, setConfirmAction] = useState<
        "stats" | "settings" | null
    >(null);
    const [pendingImport, setPendingImport] = useState<PersistedState | null>(
        null,
    );
    const [importError, setImportError] = useState<string | null>(null);
    const [statusToast, setStatusToast] = useState<string | null>(null);

    const handleExport = () => {
        const payload: PersistedState = {
            schemaVersion: 1,
            settings: settingsState,
            statistics: statsState,
        };
        const json = exportSaveData(payload);
        triggerJsonDownload(
            `doxo-backup-${new Date().toISOString().slice(0, 10)}.json`,
            json,
        );
        setStatusToast("Backup downloaded successfully!");
        setTimeout(() => setStatusToast(null), 3000);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            if (typeof content !== "string") return;

            const res = validateAndParseSaveData(content);
            if (res.valid) {
                setPendingImport(res.data);
                setImportError(null);
            } else {
                setImportError(res.error);
            }
        };
        reader.readAsText(file);
        // Reset file input so same file can be selected again
        event.target.value = "";
    };

    const handleConfirmImport = () => {
        if (!pendingImport) return;
        props.onImportData(pendingImport);
        setPendingImport(null);
        setStatusToast("Save data imported successfully!");
        setTimeout(() => setStatusToast(null), 3000);
    };

    return (
        <PageContainer className="min-h-dvh py-6">
            <h1 className="animate-card-spring stagger-1 text-center text-3xl font-black uppercase tracking-widest">
                Settings
            </h1>

            {/* Theme Picker */}
            <Card className="animate-card-spring stagger-2 flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Theme
                </h2>
                <div
                    role="radiogroup"
                    aria-label="Color theme"
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                >
                    {THEME_OPTIONS.map((themeOpt) => {
                        const isSelected = props.theme === themeOpt.id;
                        return (
                            <button
                                key={themeOpt.id}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                onClick={() => props.onThemeChange(themeOpt.id)}
                                className={cn(
                                    "flex flex-col items-center gap-2 rounded-xl border-2 border-border p-3 text-xs font-bold uppercase shadow-brutal-sm transition-all duration-200 ease-spring active:translate-x-0.5 active:translate-y-0.5 focus:outline-none focus-visible:outline-none",
                                    isSelected
                                        ? "bg-surface-elevated ring-2 ring-foreground scale-[1.02]"
                                        : "bg-surface opacity-80 hover:opacity-100",
                                )}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="size-4 rounded-full border border-border shadow-brutal-sm"
                                        style={{
                                            backgroundColor: themeOpt.p1Color,
                                        }}
                                    />
                                    <span
                                        className="size-4 rounded-full border border-border shadow-brutal-sm"
                                        style={{
                                            backgroundColor: themeOpt.p2Color,
                                        }}
                                    />
                                </div>
                                <span>{themeOpt.name}</span>
                            </button>
                        );
                    })}
                </div>
            </Card>

            {/* Accessibility */}
            <Card className="animate-card-spring stagger-3 flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Accessibility
                </h2>
                <ToggleRow
                    id="setting-sound"
                    label="Sound effects"
                    checked={props.soundEnabled}
                    onChange={props.onSoundChange}
                />
                <ToggleRow
                    id="setting-haptics"
                    label="Vibration"
                    checked={props.hapticsEnabled}
                    onChange={props.onHapticsChange}
                />
                <fieldset className="m-0 flex items-center justify-between gap-4 border-0 p-0">
                    <legend className="font-semibold">Reduced motion</legend>
                    <div
                        role="radiogroup"
                        aria-label="Reduced motion"
                        className="flex gap-2"
                    >
                        {MOTION_OPTIONS.map((option) => (
                            <button
                                key={option}
                                type="button"
                                role="radio"
                                aria-checked={props.motion === option}
                                onClick={() => props.onMotionChange(option)}
                                className={cn(
                                    "min-h-9 rounded-lg border-2 border-border px-3 text-xs font-bold uppercase shadow-brutal-sm transition-all duration-300 ease-spring active:scale-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus:outline-none focus-visible:outline-none",
                                    props.motion === option
                                        ? "bg-player-one"
                                        : "bg-surface",
                                )}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </fieldset>
            </Card>

            {/* Save Data Export / Import */}
            <Card className="animate-card-spring stagger-4 flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Backup & Storage
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button variant="secondary" onClick={handleExport}>
                        Export Data (JSON)
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Import Data (JSON)
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </Card>

            {/* Reset Data */}
            <Card className="animate-card-spring stagger-5 flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Reset
                </h2>
                <Button
                    variant="danger"
                    fullWidth
                    onClick={() => setConfirmAction("stats")}
                >
                    Reset Statistics
                </Button>
                <Button
                    variant="danger"
                    fullWidth
                    onClick={() => setConfirmAction("settings")}
                >
                    Reset All Settings
                </Button>
            </Card>

            <Button variant="secondary" fullWidth onClick={props.onBack}>
                Back
            </Button>

            {/* Reset Confirmation Modal */}
            <Modal
                open={confirmAction !== null}
                title="Are you sure?"
                onClose={() => setConfirmAction(null)}
            >
                <p className="mb-4 font-medium">
                    {confirmAction === "stats"
                        ? "This permanently deletes all your statistics."
                        : "This restores every setting to its default value."}
                </p>
                <div className="flex gap-3">
                    <Button
                        variant="danger"
                        fullWidth
                        onClick={() => {
                            if (confirmAction === "stats")
                                props.onResetStatistics();
                            if (confirmAction === "settings")
                                props.onResetSettings();
                            setConfirmAction(null);
                        }}
                    >
                        Confirm
                    </Button>
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => setConfirmAction(null)}
                    >
                        Cancel
                    </Button>
                </div>
            </Modal>

            {/* Import Confirmation Modal */}
            <Modal
                open={pendingImport !== null}
                title="Import Save Data"
                onClose={() => setPendingImport(null)}
            >
                <p className="mb-4 font-medium">
                    Are you sure you want to import this save file? This will
                    overwrite your existing statistics and settings.
                </p>
                <div className="flex gap-3">
                    <Button fullWidth onClick={handleConfirmImport}>
                        Overwrite & Import
                    </Button>
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => setPendingImport(null)}
                    >
                        Cancel
                    </Button>
                </div>
            </Modal>

            {/* Import Error Modal */}
            <Modal
                open={importError !== null}
                title="Import Failed"
                onClose={() => setImportError(null)}
            >
                <p className="mb-4 font-medium text-danger">{importError}</p>
                <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setImportError(null)}
                >
                    Dismiss
                </Button>
            </Modal>

            {/* Toast Notification */}
            {statusToast && (
                <div
                    role="alert"
                    aria-live="polite"
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border-2 border-border bg-success px-4 py-2.5 font-bold text-sm shadow-brutal"
                >
                    {statusToast}
                </div>
            )}
        </PageContainer>
    );
}
