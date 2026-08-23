import { useCallback, useState } from "react";
import { WelcomeScreen } from "@/pages/welcome-screen/WelcomeScreen";
import { SetupScreen, type GameMode } from "@/pages/setup-screen";
import { HowToPlayScreen } from "@/pages/how-to-play-screen";
import { StatisticsScreen } from "@/pages/statistics-screen";
import { SettingsScreen } from "@/pages/settings-screen";
import { GameScreen } from "@/pages/game-screen/GameScreen";
import type {
    BoardShape,
    Difficulty,
    Player,
    PlayerId,
} from "@/features/game/types/game.types";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
    recordGameResult,
    resetStatistics,
    setStatisticsState,
} from "@/features/statistics/state/statistics.slice";
import {
    setSoundEnabled,
    setHapticsEnabled,
    setReducedMotionOverride,
    setTheme,
    setSettingsState,
    resetSettings,
} from "@/features/settings/state/settings.slice";
import {
    savePersistedState,
    type PersistedState,
} from "@/shared/lib/persistence/storage";

export type ScreenName =
    "welcome" | "setup" | "game" | "how-to-play" | "settings" | "statistics";

interface SetupConfig {
    mode: GameMode;
    boardSize: number;
    shape: BoardShape;
    difficulty: Difficulty;
    playerOneName: string;
    playerTwoName: string;
}

const DEFAULT_SETUP: SetupConfig = {
    mode: "local",
    boardSize: 6,
    shape: "rectangle",
    difficulty: "medium",
    playerOneName: "Player 1",
    playerTwoName: "Player 2",
};

export function AppRouter() {
    const dispatch = useAppDispatch();
    const statsState = useAppSelector((state) => state.statistics);
    const settingsState = useAppSelector((state) => state.settings);

    const [screen, setScreen] = useState<ScreenName>("welcome");
    const [setup, setSetup] = useState<SetupConfig>(DEFAULT_SETUP);
    const [gameKey, setGameKey] = useState(0);

    const startGame = useCallback(() => {
        setGameKey((key) => key + 1);
        setScreen("game");
    }, []);

    const goHome = useCallback(() => setScreen("welcome"), []);

    const handleGameOver = useCallback(
        (
            winner: "p1" | "p2" | "draw",
            p1Score: number,
            p2Score: number,
        ) => {
            const playerOne: Player = {
                id: "p1",
                name: setup.playerOneName || "Player 1",
                kind: "human",
            };
            const playerTwo: Player =
                setup.mode === "ai"
                    ? {
                          id: "p2",
                          name: setup.playerTwoName || "Computer",
                          kind: "ai",
                          difficulty: setup.difficulty,
                      }
                    : {
                          id: "p2",
                          name: setup.playerTwoName || "Player 2",
                          kind: "human",
                      };

            dispatch(
                recordGameResult({
                    mode: setup.mode,
                    difficulty: setup.difficulty,
                    shape: setup.shape,
                    boardSize: setup.boardSize,
                    players: [playerOne, playerTwo],
                    scores: { p1: p1Score, p2: p2Score },
                    winner,
                }),
            );
        },
        [
            dispatch,
            setup.mode,
            setup.difficulty,
            setup.shape,
            setup.boardSize,
            setup.playerOneName,
            setup.playerTwoName,
        ],
    );

    const handleImportData = useCallback(
        (data: PersistedState) => {
            dispatch(setSettingsState(data.settings));
            dispatch(setStatisticsState(data.statistics));
            savePersistedState(data);
        },
        [dispatch],
    );

    if (screen === "welcome") {
        return (
            <WelcomeScreen
                onPlay={() => setScreen("setup")}
                onHowToPlay={() => setScreen("how-to-play")}
                onSettings={() => setScreen("settings")}
                onStatistics={() => setScreen("statistics")}
            />
        );
    }

    if (screen === "setup") {
        return (
            <SetupScreen
                mode={setup.mode}
                boardSize={setup.boardSize}
                shape={setup.shape}
                difficulty={setup.difficulty}
                playerOneName={setup.playerOneName}
                playerTwoName={setup.playerTwoName}
                onModeChange={(mode) => {
                    setSetup((prev) => ({
                        ...prev,
                        mode,
                        playerOneName: mode === "ai" ? "You" : "Player 1",
                        playerTwoName: mode === "ai" ? "Computer" : "Player 2",
                    }));
                }}
                onBoardSizeChange={(boardSize) =>
                    setSetup((prev) => ({ ...prev, boardSize }))
                }
                onShapeChange={(shape) =>
                    setSetup((prev) => ({ ...prev, shape }))
                }
                onDifficultyChange={(difficulty) =>
                    setSetup((prev) => ({ ...prev, difficulty }))
                }
                onPlayerOneNameChange={(playerOneName) =>
                    setSetup((prev) => ({ ...prev, playerOneName }))
                }
                onPlayerTwoNameChange={(playerTwoName) =>
                    setSetup((prev) => ({ ...prev, playerTwoName }))
                }
                onStart={startGame}
                onBack={goHome}
            />
        );
    }

    if (screen === "game") {
        return (
            <GameScreen
                key={gameKey}
                config={{
                    rows: setup.boardSize,
                    cols: setup.boardSize,
                    shape: setup.shape,
                    mode: setup.mode,
                    difficulty: setup.difficulty,
                    playerOne: {
                        id: "p1",
                        name: setup.playerOneName || "Player 1",
                        kind: "human",
                    },
                    playerTwo:
                        setup.mode === "ai"
                            ? {
                                  id: "p2",
                                  name: setup.playerTwoName || "Computer",
                                  kind: "ai",
                                  difficulty: setup.difficulty,
                              }
                            : {
                                  id: "p2",
                                  name: setup.playerTwoName || "Player 2",
                                  kind: "human",
                              },
                }}
                soundEnabled={settingsState.soundEnabled}
                hapticsEnabled={settingsState.hapticsEnabled}
                motion={settingsState.reducedMotionOverride}
                onHome={goHome}
                onBack={() => setScreen("setup")}
                onNewGame={() => setScreen("setup")}
                onReplay={startGame}
                onGameOver={handleGameOver}
            />
        );
    }

    if (screen === "how-to-play") {
        return <HowToPlayScreen onBack={goHome} />;
    }

    if (screen === "settings") {
        return (
            <SettingsScreen
                theme={settingsState.theme}
                soundEnabled={settingsState.soundEnabled}
                hapticsEnabled={settingsState.hapticsEnabled}
                motion={settingsState.reducedMotionOverride}
                onThemeChange={(theme) => dispatch(setTheme(theme))}
                onSoundChange={(enabled) => dispatch(setSoundEnabled(enabled))}
                onHapticsChange={(enabled) =>
                    dispatch(setHapticsEnabled(enabled))
                }
                onMotionChange={(motion) =>
                    dispatch(setReducedMotionOverride(motion))
                }
                onResetStatistics={() => dispatch(resetStatistics())}
                onResetSettings={() => dispatch(resetSettings())}
                onImportData={handleImportData}
                onBack={goHome}
            />
        );
    }

    return (
        <StatisticsScreen
            statistics={statsState}
            onReset={() => dispatch(resetStatistics())}
            onBack={goHome}
            onPlay={() => setScreen("setup")}
        />
    );
}

export type { PlayerId };

