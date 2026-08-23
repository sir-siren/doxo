export interface BoardPreset {
    id: string;
    name: string;
    size: number;
    description: string;
}

export const BOARD_PRESETS: readonly BoardPreset[] = [
    {
        id: "quick",
        name: "Quick",
        size: 3,
        description: "3×3 · Fast & Casual",
    },
    {
        id: "standard",
        name: "Standard",
        size: 5,
        description: "5×5 · Balanced Strategy",
    },
    {
        id: "marathon",
        name: "Marathon",
        size: 8,
        description: "8×8 · Deep & Complex",
    },
] as const;

export const findPresetBySize = (size: number): BoardPreset | undefined =>
    BOARD_PRESETS.find((preset) => preset.size === size);
