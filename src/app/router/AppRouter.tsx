import { useCallback, useState } from "react";
import { WelcomeScreen } from "@/pages/welcome-screen/WelcomeScreen";
import { SetupScreen, type GameMode } from "@/pages/setup-screen";
import { HowToPlayScreen } from "@/pages/how-to-play-screen";
import { StatisticsScreen, type StatisticsData } from "@/pages/statistics-screen";
import { SettingsScreen } from "@/pages/settings-screen";
import { GameScreen } from "@/pages/game-screen/GameScreen";
import type { Difficulty, PlayerId } from "@/features/game/types/game.types";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { recordGameResult, resetStatistics } from "@/features/statistics/state/statistics.slice";
import {
    setSoundEnabled,
    setHapticsEnabled,
    setReducedMotionOverride,
    resetSettings,
} from "@/features/settings/state/settings.slice";

export type ScreenName =
    "welcome" | "setup" | "game" | "how-to-play" | "settings" | "statistics";

interface SetupConfig {
    mode: GameMode;
    boardSize: number;
    difficulty: Difficulty;
    playerOneName: string;
    playerTwoName: string;
}

const DEFAULT_SETUP: SetupConfig = {
    mode: "local",
    boardSize: 6,
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
        (winner: "p1" | "p2" | "draw", p1Score: number) => {
            const outcome =
                winner === "draw" ? "draw" : winner === "p1" ? "win" : "loss";
            dispatch(
                recordGameResult({
                    outcome,
                    difficulty: setup.difficulty,
                    boxesClaimedByHuman: p1Score,
                }),
            );
        },
        [dispatch, setup.difficulty],
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
                soundEnabled={settingsState.soundEnabled}
                hapticsEnabled={settingsState.hapticsEnabled}
                motion={settingsState.reducedMotionOverride}
                onSoundChange={(enabled) => dispatch(setSoundEnabled(enabled))}
                onHapticsChange={(enabled) => dispatch(setHapticsEnabled(enabled))}
                onMotionChange={(motion) => dispatch(setReducedMotionOverride(motion))}
                onResetStatistics={() => dispatch(resetStatistics())}
                onResetSettings={() => dispatch(resetSettings())}
                onBack={goHome}
            />
        );
    }

    const statsData: StatisticsData = {
        gamesPlayed: statsState.gamesPlayed,
        wins: statsState.wins,
        losses: statsState.losses,
        draws: statsState.draws,
        totalBoxesClaimed: statsState.totalBoxesClaimed,
        winRate:
            statsState.gamesPlayed > 0
                ? statsState.wins / statsState.gamesPlayed
                : 0,
        currentStreak: statsState.currentStreak,
        longestStreak: statsState.longestStreak,
    };

    return (
        <StatisticsScreen
            statistics={statsData}
            onReset={() => dispatch(resetStatistics())}
            onBack={goHome}
        />
    );
}

export type { PlayerId };
