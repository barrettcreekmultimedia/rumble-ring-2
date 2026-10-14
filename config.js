export const GAME = Object.freeze({
  WIDTH: 1000,
  HEIGHT: 700,
  DEBUG: false,
  BACKGROUND: 0x07101d,

  PLAYER_RADIUS: 22,
  PLAYER_SPEED: 245,
  PLAYER_ACCELERATION: 940,
  PLAYER_DRAG: 620,
  DASH_FORCE: 390,
  DASH_DURATION: 170,
  DASH_COOLDOWN: 950,
  NORMAL_KNOCKBACK: 115,
  DASH_KNOCKBACK: 315,
  COLLISION_COOLDOWN: 110,

  ARENA_RADIUS_X: 355,
  ARENA_RADIUS_Y: 230,
  ARENA_MIN_SCALE: 0.70,

  EVENT_MIN_DELAY: 3600,
  EVENT_MAX_DELAY: 6200,
  EVENT_INTENSITY: 1,
  EVENT_TELEGRAPH_MS: 950,

  AI_REACTION_TIME: 240,
  AI_EDGE_DANGER: 0.73,

  ROUND_CHAOS_TIME: 45,
  FINAL_TWO_ZOOM: 1.045,
});

export const PLAYER_DEFS = Object.freeze([
  { id: 0, name: 'PLAYER 1', color: 0x54d7ff, dark: 0x126a87, human: true },
  { id: 1, name: 'BRUISER', color: 0xff5e78, dark: 0x8f2033, personality: 'aggressive' },
  { id: 2, name: 'ANCHOR', color: 0xffd34e, dark: 0x8c6810, personality: 'defensive' },
  { id: 3, name: 'WILDCARD', color: 0x9cff6a, dark: 0x3b7f24, personality: 'chaotic' },
]);
