import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { MainMenuScene } from './scenes/MainMenuScene'
import { ProfileSelectScene } from './scenes/ProfileSelectScene'
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
import { DungeonEscapeLevel } from './scenes/level-types/DungeonEscapeLevel'
import { PotionBrewingLabLevel } from './scenes/level-types/PotionBrewingLabLevel'
import { MagicRuneTypingLevel } from './scenes/level-types/MagicRuneTypingLevel'
import { MonsterManualLevel } from './scenes/level-types/MonsterManualLevel'
import { CharacterCreatorLevel } from './scenes/level-types/CharacterCreatorLevel'
import { WoodlandFestivalLevel } from './scenes/level-types/WoodlandFestivalLevel'
import { SillyChallengeLevel } from './scenes/level-types/SillyChallengeLevel'
import { GuildRecruitmentLevel } from './scenes/level-types/GuildRecruitmentLevel'
import { BossBattleScene } from './scenes/BossBattleScene'
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

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  scene: [
    BootScene, PreloadScene, MainMenuScene, ProfileSelectScene, OverlandMapScene, LevelIntroScene, LevelResultScene, LevelScene, 
    GoblinWhackerLevel, SkeletonSwarmLevel, MonsterArenaLevel, UndeadSiegeLevel, SlimeSplittingLevel,
    DungeonTrapDisarmLevel, DungeonEscapeLevel, PotionBrewingLabLevel, MagicRuneTypingLevel,
    MonsterManualLevel, CharacterCreatorLevel, WoodlandFestivalLevel, SillyChallengeLevel, GuildRecruitmentLevel,
    BossBattleScene, MiniBossTypical, GrizzlefangBoss, HydraBoss, SlimeKingBoss, ClockworkDragonBoss, BaronTypoBoss, SpiderBoss, FlashWordBoss, BoneKnightBoss, DiceLichBoss, AncientDragonBoss
  ],
})
