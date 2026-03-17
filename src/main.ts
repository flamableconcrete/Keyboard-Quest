import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { MainMenuScene } from './scenes/MainMenuScene'
import { ProfileSelectScene } from './scenes/ProfileSelectScene'
import { AvatarCustomizerScene } from './scenes/AvatarCustomizerScene'
import { OverlandMapScene } from './scenes/OverlandMapScene'
import { LevelIntroScene } from './scenes/LevelIntroScene'
import { LevelResultScene } from './scenes/LevelResultScene'
import { LevelScene } from './scenes/LevelScene'
import { GoblinWhackerLevel } from './scenes/level-types/GoblinWhackerLevel'
import { SkeletonSwarmLevel } from './scenes/level-types/SkeletonSwarmLevel'
import { MonsterArenaLevel } from './scenes/level-types/MonsterArenaLevel'
import { UndeadSiegeLevel } from './scenes/level-types/UndeadSiegeLevel'
import { SlimeSplittingLevel } from './scenes/level-types/SlimeSplittingLevel'
import { DungeonTrapDisarmLevel } from './scenes/level-types/DungeonTrapDisarmLevel'
import { DungeonPlatformerLevel } from './scenes/level-types/DungeonPlatformerLevel'
import { DungeonEscapeLevel } from './scenes/level-types/DungeonEscapeLevel'
import { PotionBrewingLabLevel } from './scenes/level-types/PotionBrewingLabLevel'
import { MagicRuneTypingLevel } from './scenes/level-types/MagicRuneTypingLevel'
import { MonsterManualLevel } from './scenes/level-types/MonsterManualLevel'
import { WoodlandFestivalLevel } from './scenes/level-types/WoodlandFestivalLevel'
import { SillyChallengeLevel } from './scenes/level-types/SillyChallengeLevel'
import { CrazedCookLevel } from './scenes/level-types/CrazedCookLevel'
import { GuildRecruitmentLevel } from './scenes/level-types/GuildRecruitmentLevel'
import { BossBattleScene } from './scenes/BossBattleScene'
import { CharacterScene } from './scenes/CharacterScene'
import { TavernScene } from './scenes/TavernScene'
import { StableScene } from './scenes/StableScene'
import { CutsceneScene } from './scenes/CutsceneScene'
import { VictoryScene } from './scenes/VictoryScene'
import { SettingsScene } from './scenes/SettingsScene'
import { ShopScene } from './scenes/ShopScene'
import { TrophyRoomScene } from './scenes/TrophyRoomScene'
import { MobileLevelIntroScene } from './scenes/MobileLevelIntroScene'
import { MobileOverlandMapScene } from './scenes/MobileOverlandMapScene'
import { PauseScene } from './scenes/PauseScene'
import { MiniBossTypical } from './scenes/boss-types/MiniBossTypical'
import { GrizzlefangBoss } from './scenes/boss-types/GrizzlefangBoss'
import { HydraBoss } from './scenes/boss-types/HydraBoss'
import { SlimeKingBoss } from './scenes/boss-types/SlimeKingBoss'
import { ClockworkDragonBoss } from './scenes/boss-types/ClockworkDragonBoss'
import { BaronTypoBoss } from './scenes/boss-types/BaronTypoBoss'
import { SpiderBoss } from './scenes/boss-types/SpiderBoss'
import { FlashWordBoss } from './scenes/boss-types/FlashWordBoss'
import { BoneKnightBoss } from './scenes/boss-types/BoneKnightBoss'
import { DiceLichBoss } from './scenes/boss-types/DiceLichBoss'
import { AncientDragonBoss } from './scenes/boss-types/AncientDragonBoss'
import { TypemancerBoss } from './scenes/boss-types/TypemancerBoss'

const mobile = window.innerWidth < 768;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: mobile ? window.innerWidth : 1280,
  height: mobile ? window.innerHeight : 720,
  backgroundColor: '#1a1a2e',
  parent: 'app',
  scale: {
    mode: mobile ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene, PreloadScene, MainMenuScene, ProfileSelectScene, AvatarCustomizerScene, OverlandMapScene, LevelIntroScene, LevelResultScene, LevelScene,
    GoblinWhackerLevel, SkeletonSwarmLevel, MonsterArenaLevel, UndeadSiegeLevel, SlimeSplittingLevel,
    DungeonTrapDisarmLevel, DungeonPlatformerLevel, DungeonEscapeLevel, PotionBrewingLabLevel, MagicRuneTypingLevel,
    MonsterManualLevel, WoodlandFestivalLevel, SillyChallengeLevel, CrazedCookLevel, GuildRecruitmentLevel,
    BossBattleScene, CharacterScene, TavernScene, StableScene, CutsceneScene, VictoryScene, SettingsScene, ShopScene, TrophyRoomScene, MobileLevelIntroScene, MobileOverlandMapScene, MiniBossTypical, GrizzlefangBoss, HydraBoss, SlimeKingBoss, ClockworkDragonBoss, BaronTypoBoss, SpiderBoss, FlashWordBoss, BoneKnightBoss, DiceLichBoss, AncientDragonBoss, TypemancerBoss, PauseScene
  ],
});

(window as any).__PHASER_GAME__ = game;
