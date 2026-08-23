import { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Toggle } from "@/shared/ui/Toggle";
import { PageContainer } from "@/shared/layout";
import { cn } from "@/shared/lib/cn";

export type SoundSetting = boolean;
export type HapticsSetting = boolean;
export type MotionOverride = "system" | "on" | "off";

interface SettingsScreenProps {
    soundEnabled: boolean;
    hapticsEnabled: boolean;
    motion: MotionOverride;
    onSoundChange: (enabled: boolean) => void;
    onHapticsChange: (enabled: boolean) => void;
    onMotionChange: (motion: MotionOverride) => void;
    onResetStatistics: () => void;
    onResetSettings: () => void;
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

export function SettingsScreen(props: SettingsScreenProps) {
    const [confirmAction, setConfirmAction] = useState<
        "stats" | "settings" | null
    >(null);

    return (
        <PageContainer className="min-h-dvh">
            <h1 className="text-center text-3xl font-black uppercase tracking-widest">
                Settings
            </h1>
            <Card className="flex flex-col gap-3 p-4">
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
                                    "min-h-9 rounded-lg border-2 border-border px-3 text-xs font-bold uppercase shadow-brutal-sm transition-all duration-300 ease-spring active:scale-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
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
            <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Data
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
        </PageContainer>
    );
}
