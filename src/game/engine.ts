import type { UpgradeKey } from "../storage/profile";

export const SCENE_WIDTH = 360;
export const SCENE_HEIGHT = 270;
export const GROUND_Y = 211;
export const PLAYER_WIDTH = 24;
export const PLAYER_HEIGHT = 32;

export type ObstacleKind = "spikes" | "pit" | "axe" | "crate" | "platform";
export type PickupKind = "gold" | "gem" | "heart";

export type Obstacle = {
  id: string;
  kind: ObstacleKind;
  x: number;
  width: number;
  y?: number;
  broken?: boolean;
  breakingFor?: number;
};

export type Pickup = {
  id: string;
  kind: PickupKind;
  x: number;
  y: number;
  collected: boolean;
};

export type GameState = {
  level: number;
  length: number;
  elapsed: number;
  player: {
    x: number;
    y: number;
    vy: number;
    hp: number;
    maxHp: number;
    grounded: boolean;
    doubleJumpUsed: boolean;
    direction: -1 | 1;
  };
  obstacles: Obstacle[];
  pickups: Pickup[];
  gold: number;
  gems: number;
  hitCooldown: number;
  dashTime: number;
  dashCooldown: number;
  invulnerable: number;
  ended: boolean;
};

export type GameInput = {
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
};

export type GameEvent =
  | { type: "gold"; amount: number }
  | { type: "gem"; amount: number }
  | { type: "heart" }
  | { type: "hit"; hp: number }
  | { type: "gameOver" }
  | { type: "complete" };

export type EngineUpgrades = Record<UpgradeKey, number>;

function randomFor(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function createGameState(level: number, upgrades: EngineUpgrades): GameState {
  const random = randomFor(level * 982451653);
  const length = 940 + Math.min(level, 20) * 72;
  const obstacles: Obstacle[] = [];
  const pickups: Pickup[] = [];
  let x = 228;
  let index = 0;

  while (x < length - 105) {
    const roll = random();
    let kind: ObstacleKind;
    if (level >= 4 && roll > 0.84) kind = "axe";
    else if (roll > 0.66) kind = "pit";
    else if (roll > 0.48) kind = "spikes";
    else if (roll > 0.32) kind = "crate";
    else kind = "platform";

    const width = kind === "pit" ? 52 + random() * Math.min(30, level * 1.6) : 34 + random() * 22;
    const obstacle: Obstacle = {
      id: `obstacle-${level}-${index}`,
      kind,
      x,
      width,
      y: kind === "platform" ? 154 + random() * 15 : undefined,
      broken: false,
      breakingFor: 0,
    };
    obstacles.push(obstacle);

    if (index % 3 !== 1) {
      const pickupY = kind === "pit" || kind === "spikes" ? GROUND_Y - 82 : GROUND_Y - 58;
      pickups.push({
        id: `gold-${level}-${index}`,
        kind: "gold",
        x: x - 25,
        y: pickupY,
        collected: false,
      });
      pickups.push({
        id: `gold-${level}-${index}-b`,
        kind: "gold",
        x: x + 3,
        y: pickupY - 15,
        collected: false,
      });
    }
    if (index > 0 && index % 4 === 0) {
      pickups.push({
        id: `gem-${level}-${index}`,
        kind: "gem",
        x: x + 42,
        y: GROUND_Y - 98,
        collected: false,
      });
    }
    if (index > 0 && index % 8 === 0) {
      pickups.push({
        id: `heart-${level}-${index}`,
        kind: "heart",
        x: x + 70,
        y: GROUND_Y - 55,
        collected: false,
      });
    }

    const baseGap = Math.max(112, 194 - Math.min(level, 15) * 4);
    x += baseGap + random() * 65;
    index += 1;
  }

  const maxHp = 3 + upgrades.maxHp;
  return {
    level,
    length,
    elapsed: 0,
    player: {
      x: 34,
      y: GROUND_Y - PLAYER_HEIGHT,
      vy: 0,
      hp: maxHp,
      maxHp,
      grounded: true,
      doubleJumpUsed: false,
      direction: 1,
    },
    obstacles,
    pickups,
    gold: 0,
    gems: 0,
    hitCooldown: 0,
    dashTime: 0,
    dashCooldown: 0,
    invulnerable: 0,
    ended: false,
  };
}

function overlapsX(left: number, width: number, otherLeft: number, otherWidth: number) {
  return left + width > otherLeft && left < otherLeft + otherWidth;
}

function hurt(state: GameState, events: GameEvent[], armor: number) {
  if (state.invulnerable > 0 || state.ended) return;
  state.player.hp = Math.max(0, state.player.hp - (armor > 0 && Math.random() < 0.32 ? 0 : 1));
  state.invulnerable = 1.05;
  state.hitCooldown = 0.55;
  state.player.vy = -165;
  events.push({ type: "hit", hp: state.player.hp });
  if (state.player.hp <= 0) {
    state.ended = true;
    events.push({ type: "gameOver" });
  }
}

export function stepGame(
  state: GameState,
  input: GameInput,
  upgrades: EngineUpgrades,
  deltaSeconds: number,
): GameEvent[] {
  if (state.ended) return [];
  const dt = Math.min(0.05, Math.max(0, deltaSeconds));
  const events: GameEvent[] = [];
  const player = state.player;
  state.elapsed += dt;
  state.hitCooldown = Math.max(0, state.hitCooldown - dt);
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  state.dashCooldown = Math.max(0, state.dashCooldown - dt);

  const direction = input.left === input.right ? 0 : input.left ? -1 : 1;
  if (direction !== 0) player.direction = direction;

  if (input.jump) {
    if (player.grounded) {
      player.vy = -(420 + upgrades.jump * 26);
      player.grounded = false;
      player.doubleJumpUsed = false;
    } else if (upgrades.doubleJump && !player.doubleJumpUsed) {
      player.vy = -(390 + upgrades.jump * 18);
      player.doubleJumpUsed = true;
    }
  }
  if (input.dash && upgrades.dash && state.dashCooldown <= 0) {
    state.dashTime = 0.24;
    state.dashCooldown = 1.1;
  }

  const speed = 164 + upgrades.speed * 17;
  const movingDirection = state.dashTime > 0 ? player.direction : direction;
  const movementSpeed = state.dashTime > 0 ? speed * 2.15 : speed;
  player.x += movingDirection * movementSpeed * dt;
  player.x = Math.max(0, Math.min(state.length - 32, player.x));
  state.dashTime = Math.max(0, state.dashTime - dt);

  const previousBottom = player.y + PLAYER_HEIGHT;
  player.vy += 1120 * dt;
  player.y += player.vy * dt;
  player.grounded = false;

  const standingPlatform = state.obstacles.find((obstacle) => {
    if (obstacle.kind !== "platform" || obstacle.broken || !obstacle.y) return false;
    return (
      overlapsX(player.x + 2, PLAYER_WIDTH - 4, obstacle.x, obstacle.width) &&
      player.vy >= 0 &&
      previousBottom <= obstacle.y + 8 &&
      player.y + PLAYER_HEIGHT >= obstacle.y
    );
  });
  if (standingPlatform?.y) {
    player.y = standingPlatform.y - PLAYER_HEIGHT;
    player.vy = 0;
    player.grounded = true;
    standingPlatform.breakingFor = (standingPlatform.breakingFor ?? 0) + dt;
    if (standingPlatform.breakingFor >= 0.62) standingPlatform.broken = true;
  } else {
    const abovePit = state.obstacles.some(
      (obstacle) =>
        obstacle.kind === "pit" &&
        overlapsX(player.x + 4, PLAYER_WIDTH - 8, obstacle.x, obstacle.width),
    );
    if (!abovePit && player.y + PLAYER_HEIGHT >= GROUND_Y) {
      player.y = GROUND_Y - PLAYER_HEIGHT;
      player.vy = 0;
      player.grounded = true;
      player.doubleJumpUsed = false;
    }
  }

  if (player.y > SCENE_HEIGHT + 24) {
    hurt(state, events, upgrades.armor);
    if (!state.ended) {
      const pit = state.obstacles.find(
        (obstacle) =>
          obstacle.kind === "pit" &&
          overlapsX(player.x + 4, PLAYER_WIDTH - 8, obstacle.x, obstacle.width),
      );
      player.x = pit ? Math.max(16, pit.x - 32) : Math.max(16, player.x - 45);
      player.y = GROUND_Y - PLAYER_HEIGHT;
      player.vy = 0;
      player.grounded = true;
    }
  }

  const hitObstacle = state.obstacles.find((obstacle) => {
    if (obstacle.kind === "pit" || obstacle.kind === "platform" || obstacle.broken) return false;
    if (!overlapsX(player.x + 3, PLAYER_WIDTH - 6, obstacle.x, obstacle.width)) return false;
    if (obstacle.kind === "spikes" || obstacle.kind === "crate") {
      return player.y + PLAYER_HEIGHT > GROUND_Y - (obstacle.kind === "spikes" ? 24 : 31);
    }
    const axeY = GROUND_Y - 85 + Math.sin(state.elapsed * 4 + obstacle.x) * 24;
    return player.y < axeY + 25 && player.y + PLAYER_HEIGHT > axeY - 18;
  });
  if (hitObstacle && state.hitCooldown <= 0) hurt(state, events, upgrades.armor);

  const magnetRange = upgrades.magnet ? 104 : 20;
  for (const pickup of state.pickups) {
    if (pickup.collected) continue;
    const dx = pickup.x - (player.x + PLAYER_WIDTH / 2);
    const dy = pickup.y - (player.y + PLAYER_HEIGHT / 2);
    if (Math.abs(dx) <= magnetRange && Math.abs(dy) <= (upgrades.magnet ? 126 : 30)) {
      pickup.collected = true;
      if (pickup.kind === "gold") {
        state.gold += 1;
        events.push({ type: "gold", amount: 1 });
      } else if (pickup.kind === "gem") {
        state.gems += 1;
        events.push({ type: "gem", amount: 1 });
      } else {
        player.hp = Math.min(player.maxHp, player.hp + 1);
        events.push({ type: "heart" });
      }
    }
  }

  if (player.x >= state.length - 65 && !state.ended) {
    state.ended = true;
    events.push({ type: "complete" });
  }

  return events;
}