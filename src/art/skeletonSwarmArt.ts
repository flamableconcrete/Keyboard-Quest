import Phaser from 'phaser'

export function generateSkeletonSwarmTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('ss_skeleton')) return
  generateSkeletonTexture(scene)
  generateRisingSkeletonTexture(scene)
  generateSkeletonIdleFrames(scene)
  generateSkeletonBackground(scene)
  generateBoneFragmentTexture(scene)
  generateAshParticleTexture(scene)
  generateHeartTexture(scene)
  generateFireFrames(scene)
}

function generateSkeletonBackground(scene: Phaser.Scene) {
  const { width, height } = scene.scale

  // Sky layer — deep blood-red fading to near-black
  const sky = scene.add.graphics()
  for (let y = 0; y < height * 0.6; y++) {
    const t = y / (height * 0.6)
    const r = Math.floor(0x3d * (1 - t))
    const color = (r << 16)
    sky.fillStyle(color)
    sky.fillRect(0, y, width, 1)
  }
  sky.generateTexture('ss_sky', width, Math.floor(height * 0.6))
  sky.destroy()

  // Ruins layer — broken stone walls silhouetted against sky
  const ruins = scene.add.graphics()
  ruins.fillStyle(0x0a0000)
  ruins.fillRect(0, 0, width, 120)

  // Left ruined wall section
  ruins.fillStyle(0x1a1010)
  ruins.fillRect(50, 20, 60, 100)
  ruins.fillRect(110, 40, 20, 80)
  ruins.fillRect(60, 10, 30, 30)
  // Arch remnant
  ruins.fillRect(130, 30, 80, 90)
  ruins.fillRect(210, 50, 15, 70)
  ruins.fillStyle(0x0a0000)
  ruins.fillRect(145, 55, 50, 65) // arch opening
  // Right ruined wall
  ruins.fillStyle(0x1a1010)
  ruins.fillRect(900, 15, 80, 105)
  ruins.fillRect(980, 35, 25, 85)
  ruins.fillRect(850, 30, 55, 90)
  ruins.fillStyle(0x2a1818) // mortar highlights
  ruins.fillRect(52, 22, 56, 2)
  ruins.fillRect(52, 40, 56, 2)
  ruins.fillRect(52, 60, 56, 2)
  ruins.fillRect(132, 32, 76, 2)
  ruins.fillRect(132, 52, 76, 2)

  ruins.generateTexture('ss_ruins', width, 120)
  ruins.destroy()

  // Battlefield layer — cracked earth, skulls, broken weapons
  const field = scene.add.graphics()
  field.fillStyle(0x3a2e1e)
  field.fillRect(0, 0, width, 200)

  // Crack lines
  field.lineStyle(1, 0x2a1e0e)
  field.beginPath()
  field.moveTo(100, 10); field.lineTo(130, 60); field.lineTo(150, 40)
  field.moveTo(300, 5); field.lineTo(320, 80); field.lineTo(360, 50)
  field.moveTo(600, 20); field.lineTo(650, 90)
  field.moveTo(800, 15); field.lineTo(840, 70); field.lineTo(870, 40)
  field.strokePath()

  // Skulls (simplified pixel shapes)
  const drawSkull = (g: Phaser.GameObjects.Graphics, x: number, y: number) => {
    g.fillStyle(0xccbbaa)
    g.fillRect(x, y, 8, 6)
    g.fillRect(x + 1, y + 6, 6, 2)
    g.fillStyle(0x1a1008)
    g.fillRect(x + 1, y + 1, 2, 2) // left eye socket
    g.fillRect(x + 5, y + 1, 2, 2) // right eye socket
  }
  drawSkull(field, 200, 140)
  drawSkull(field, 450, 160)
  drawSkull(field, 700, 130)
  drawSkull(field, 950, 155)

  // Broken weapons sticking from dirt
  field.fillStyle(0x888877) // blade
  field.fillRect(280, 80, 3, 50)
  field.fillStyle(0x554433) // haft
  field.fillRect(280, 125, 3, 30)
  field.fillStyle(0x888877)
  field.fillRect(720, 70, 3, 60)
  field.fillStyle(0x554433)
  field.fillRect(720, 120, 3, 40)

  field.generateTexture('ss_battlefield', width, 200)
  field.destroy()
}

function generateSkeletonTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 4 // pixel scale

  // Skull (rounded)
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 0 * s, 6 * s, 5 * s)  // head
  g.fillRect(1 * s, 1 * s, 8 * s, 3 * s)  // wider mid-skull
  // Eye sockets (cyan glow)
  g.fillStyle(0x00ccff)
  g.fillRect(2 * s, 1 * s, 2 * s, 2 * s)  // left eye
  g.fillRect(6 * s, 1 * s, 2 * s, 2 * s)  // right eye
  // Jaw
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 4 * s, 6 * s, 2 * s)
  g.fillStyle(0xbbaa88) // shadow
  g.fillRect(3 * s, 5 * s, 4 * s, 1 * s)

  // Neck
  g.fillStyle(0xddccaa)
  g.fillRect(4 * s, 6 * s, 2 * s, 2 * s)

  // Ribcage (torso with bone stripes)
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 8 * s, 6 * s, 6 * s)
  g.fillStyle(0xbbaa88) // rib shadow lines
  g.fillRect(2 * s, 9 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 11 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 13 * s, 6 * s, 1 * s)

  // Broken armor scraps (dark rusted iron)
  g.fillStyle(0x445566)
  g.fillRect(1 * s, 8 * s, 2 * s, 4 * s)  // left pauldron shard
  g.fillRect(7 * s, 8 * s, 2 * s, 3 * s)  // right breastplate piece
  g.fillStyle(0x334455) // shadow edge
  g.fillRect(1 * s, 11 * s, 2 * s, 1 * s)

  // Arms (bone)
  g.fillStyle(0xddccaa)
  g.fillRect(0 * s, 8 * s, 2 * s, 6 * s)  // left arm
  g.fillRect(8 * s, 8 * s, 2 * s, 6 * s)  // right arm
  g.fillStyle(0xbbaa88)
  g.fillRect(0 * s, 12 * s, 2 * s, 1 * s) // arm shadow

  // Pelvis / lower bones
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 14 * s, 6 * s, 2 * s)

  // Legs
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 16 * s, 2 * s, 4 * s) // left leg
  g.fillRect(6 * s, 16 * s, 2 * s, 4 * s) // right leg
  g.fillStyle(0xbbaa88)
  g.fillRect(2 * s, 19 * s, 2 * s, 1 * s) // foot shadow
  g.fillRect(6 * s, 19 * s, 2 * s, 1 * s)

  // Weapon: spear in right hand (blade + haft)
  g.fillStyle(0xaaaaaa) // blade
  g.fillRect(9 * s, 4 * s, 2 * s, 4 * s)
  g.fillRect(10 * s, 3 * s, 1 * s, 2 * s) // spearhead tip
  g.fillStyle(0x885533) // wooden haft
  g.fillRect(9 * s, 8 * s, 2 * s, 12 * s)

  g.generateTexture('ss_skeleton', 12 * s, 20 * s)
  g.destroy()
}

function generateRisingSkeletonTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 4

  // Same upper body as marching skeleton (skull + torso + arms)
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 0 * s, 6 * s, 5 * s)
  g.fillRect(1 * s, 1 * s, 8 * s, 3 * s)
  g.fillStyle(0x00ccff)
  g.fillRect(2 * s, 1 * s, 2 * s, 2 * s)
  g.fillRect(6 * s, 1 * s, 2 * s, 2 * s)
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 4 * s, 6 * s, 2 * s)
  g.fillRect(4 * s, 6 * s, 2 * s, 2 * s)
  g.fillRect(2 * s, 8 * s, 6 * s, 4 * s)
  g.fillStyle(0xbbaa88)
  g.fillRect(2 * s, 9 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 11 * s, 6 * s, 1 * s)
  g.fillStyle(0x445566)
  g.fillRect(1 * s, 8 * s, 2 * s, 3 * s)
  g.fillStyle(0xddccaa)
  g.fillRect(0 * s, 8 * s, 2 * s, 4 * s)
  g.fillRect(8 * s, 8 * s, 2 * s, 4 * s)
  // Arms raised upward (reaching out of ground)
  g.fillStyle(0xddccaa)
  g.fillRect(0 * s, 4 * s, 1 * s, 4 * s) // left arm raised
  g.fillRect(9 * s, 3 * s, 1 * s, 5 * s) // right arm raised

  // Lower half: cracked dirt (skeleton submerged)
  g.fillStyle(0x3a2e1e) // dirt base
  g.fillRect(0 * s, 12 * s, 10 * s, 8 * s)
  g.fillStyle(0x2a1e0e) // crack lines in dirt
  g.fillRect(1 * s, 13 * s, 4 * s, 1 * s)
  g.fillRect(5 * s, 15 * s, 4 * s, 1 * s)
  g.fillRect(2 * s, 17 * s, 3 * s, 1 * s)
  g.fillStyle(0x4a3e2e) // lighter dirt highlight
  g.fillRect(0 * s, 12 * s, 10 * s, 1 * s)

  g.generateTexture('ss_skeleton_rising', 12 * s, 20 * s)
  g.destroy()
}

/**
 * Draws the static parts of the skeleton (skull, ribcage, armor, pelvis, left arm, legs)
 * onto the given graphics object at pixel scale `s`.
 * Variable parts (right arm, weapon) are NOT drawn here — callers handle them.
 */
function drawSkeletonBase(g: Phaser.GameObjects.Graphics, s: number) {
  // Skull
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 0 * s, 6 * s, 5 * s)
  g.fillRect(1 * s, 1 * s, 8 * s, 3 * s)
  // Eye sockets
  g.fillStyle(0x00ccff)
  g.fillRect(2 * s, 1 * s, 2 * s, 2 * s)
  g.fillRect(6 * s, 1 * s, 2 * s, 2 * s)
  // Jaw
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 4 * s, 6 * s, 2 * s)
  g.fillStyle(0xbbaa88)
  g.fillRect(3 * s, 5 * s, 4 * s, 1 * s)
  // Neck
  g.fillStyle(0xddccaa)
  g.fillRect(4 * s, 6 * s, 2 * s, 2 * s)
  // Ribcage
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 8 * s, 6 * s, 6 * s)
  g.fillStyle(0xbbaa88)
  g.fillRect(2 * s, 9 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 11 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 13 * s, 6 * s, 1 * s)
  // Armor scraps
  g.fillStyle(0x445566)
  g.fillRect(1 * s, 8 * s, 2 * s, 4 * s)
  g.fillRect(7 * s, 8 * s, 2 * s, 3 * s)
  g.fillStyle(0x334455)
  g.fillRect(1 * s, 11 * s, 2 * s, 1 * s)
  // Left arm (static)
  g.fillStyle(0xddccaa)
  g.fillRect(0 * s, 8 * s, 2 * s, 6 * s)
  g.fillStyle(0xbbaa88)
  g.fillRect(0 * s, 12 * s, 2 * s, 1 * s)
  // Pelvis
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 14 * s, 6 * s, 2 * s)
}

function generateSkeletonIdleFrames(scene: Phaser.Scene) {
  const s = 4
  // Right arm Y offset per frame (in s-units). Range: 0 (base) to -3 (peak up).
  // Cycle: hold → rise → peak → fall → hold
  const yOffs = [0, -1, -2, -3, -3, -2, -1, 0]

  for (let i = 0; i < 8; i++) {
    const off = yOffs[i]
    const g = scene.add.graphics()

    drawSkeletonBase(g, s)

    // Legs (static in idle)
    g.fillStyle(0xddccaa)
    g.fillRect(2 * s, 16 * s, 2 * s, 4 * s)
    g.fillRect(6 * s, 16 * s, 2 * s, 4 * s)
    g.fillStyle(0xbbaa88)
    g.fillRect(2 * s, 19 * s, 2 * s, 1 * s)
    g.fillRect(6 * s, 19 * s, 2 * s, 1 * s)

    // Right arm (animated — shifts up with off)
    g.fillStyle(0xddccaa)
    g.fillRect(8 * s, (8 + off) * s, 2 * s, 6 * s)

    // Weapon: blade + tip
    g.fillStyle(0xaaaaaa)
    g.fillRect(9 * s, (4 + off) * s, 2 * s, 4 * s)
    g.fillRect(10 * s, (3 + off) * s, 1 * s, 2 * s)
    // Weapon: haft (runs from arm top to bottom of canvas)
    g.fillStyle(0x885533)
    g.fillRect(9 * s, (8 + off) * s, 2 * s, (12 - off) * s)

    g.generateTexture(`ss_skeleton_idle_${i}`, 12 * s, 20 * s)
    g.destroy()
  }
}

function generateBoneFragmentTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  g.fillStyle(0xeeddbb)
  g.fillRect(0, 0, 3, 3)
  g.generateTexture('ss_bone_fragment', 3, 3)
  g.destroy()
}

function generateAshParticleTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  g.fillStyle(0x666666, 0.6)
  g.fillRect(0, 0, 2, 2)
  g.generateTexture('ss_ash_particle', 2, 2)
  g.destroy()
}

function generateHeartTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('heart')) return // already generated (e.g. by GoblinWhacker)
  const g = scene.add.graphics()
  const s = 2
  // Matches goblinWhackerArt.ts exactly for visual consistency regardless of visit order
  g.fillStyle(0xff3344)
  g.fillRect(1 * s, 0, 2 * s, 1 * s)
  g.fillRect(5 * s, 0, 2 * s, 1 * s)
  g.fillRect(0, 1 * s, 8 * s, 1 * s)
  g.fillRect(0, 2 * s, 8 * s, 1 * s)
  g.fillRect(1 * s, 3 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 4 * s, 4 * s, 1 * s)
  g.fillRect(3 * s, 5 * s, 2 * s, 1 * s)
  g.fillStyle(0xff7788) // highlight
  g.fillRect(2 * s, 1 * s, 1 * s, 1 * s)
  g.generateTexture('heart', 8 * s, 6 * s)
  g.destroy()
}
function generateFireFrames(scene: Phaser.Scene) {
  // Frame 0: base flame
  const f0 = scene.add.graphics()
  f0.fillStyle(0xff4400) // outer
  f0.fillRect(2, 8, 6, 6)
  f0.fillRect(1, 5, 8, 5)
  f0.fillRect(3, 2, 4, 4)
  f0.fillStyle(0xff8800) // mid
  f0.fillRect(3, 6, 4, 5)
  f0.fillRect(4, 3, 2, 4)
  f0.fillStyle(0xffcc00) // tip
  f0.fillRect(4, 1, 2, 3)
  f0.generateTexture('ss_fire_0', 10, 14)
  f0.destroy()

  // Frame 1: mid flicker
  const f1 = scene.add.graphics()
  f1.fillStyle(0xff6600)
  f1.fillRect(2, 8, 6, 6)
  f1.fillRect(1, 5, 8, 5)
  f1.fillRect(3, 2, 4, 4)
  f1.fillStyle(0xffaa00)
  f1.fillRect(3, 6, 4, 5)
  f1.fillRect(4, 3, 2, 4)
  f1.fillStyle(0xffffff)
  f1.fillRect(4, 0, 2, 4)
  f1.generateTexture('ss_fire_1', 10, 14)
  f1.destroy()

  // Frame 2: bright flicker
  const f2 = scene.add.graphics()
  f2.fillStyle(0xff8800)
  f2.fillRect(2, 8, 6, 6)
  f2.fillRect(1, 5, 8, 5)
  f2.fillRect(3, 2, 4, 4)
  f2.fillStyle(0xffcc00)
  f2.fillRect(3, 6, 4, 5)
  f2.fillRect(4, 3, 2, 4)
  f2.fillStyle(0xffffff)
  f2.fillRect(4, 1, 2, 3)
  f2.fillRect(3, 0, 4, 2)
  f2.generateTexture('ss_fire_2', 10, 14)
  f2.destroy()
}
