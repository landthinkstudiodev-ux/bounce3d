import * as THREE from 'three';
import {
  BallType,
  BlockDef,
  GameState,
  GraphicsMode,
  HudSnapshot,
  JackDef,
  LevelBlueprint,
  PumpType,
  SlopeDef,
  SnowballDef,
  PolarBearDef,
  SpikeDef,
  StageIntro,
} from './types';
import { BOUNCE_LEVELS } from './levels';
import { soundFX } from './audio';
import {
  detectNationalLanguage,
  GameLang,
  TRANSLATIONS,
} from './i18n';
import {
  BALL_SKIN_META,
  BallSkinId,
  getEquippedSkin,
  getEquippedTrail,
  TRAIL_EFFECT_META,
  TrailEffectId,
} from '../services/shopService';

// Reusable vectors for zero-GC 6-substep physics loop
const _closestPoint = new THREE.Vector3();
const _diff = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _closest2D = new THREE.Vector2();

function closestPointOnSegment2D(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  out: THREE.Vector2
) {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) {
    out.set(ax, ay);
    return;
  }
  const t = THREE.MathUtils.clamp(
    ((px - ax) * abx + (py - ay) * aby) / lenSq,
    0,
    1
  );
  out.set(ax + t * abx, ay + t * aby);
}

function pointInRightTriangle2D(
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number,
  dir: 'up-right' | 'up-left'
): boolean {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const relX = (px - x) / w;
  const relY = (py - y) / h;
  if (dir === 'up-right') {
    return relY <= relX;
  } else {
    return relY <= 1 - relX;
  }
}

interface RuntimeBlock {
  def: BlockDef;
  mesh: THREE.Mesh;
  box: THREE.Box3;
  baseX: number;
  baseY: number;
  prevX: number;
  prevY: number;
  biome?: 'CLASSIC' | 'JUNGLE' | 'INDUSTRIAL' | string;
  crackTimer?: number;
  isShattered?: boolean;
}

interface RuntimeSlope {
  def: SlopeDef;
  mesh: THREE.Mesh;
}

interface RuntimeJack {
  def: JackDef;
  group: THREE.Group;
  baseX: number;
  baseY: number;
  pos: THREE.Vector3;
}

interface RuntimeSnowball {
  def: SnowballDef;
  group: THREE.Group;
  ballMesh: THREE.Mesh;
  snowMat: THREE.MeshPhysicalMaterial;
  summitPos: THREE.Vector3;
  startPos: THREE.Vector3;
  pos: THREE.Vector3;
  velocity: THREE.Vector2;
  radius: number;
  isShattered: boolean;
  shatterTimer: number;
  currentOpacity: number;
  currentScale: number;
}

interface RuntimeLifeOrb {
  group: THREE.Group;
  halo: THREE.Mesh;
  pos: THREE.Vector3;
  collected: boolean;
}

interface RuntimeRing {
  group: THREE.Group;
  hoopMesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  pos: THREE.Vector3;
  collected: boolean;
}

interface RuntimeSpike {
  def: SpikeDef;
  group: THREE.Group;
  baseX: number;
  baseY: number;
  pos: THREE.Vector3;
}

interface RuntimePump {
  mesh: THREE.Mesh;
  labelRing: THREE.Mesh;
  type: PumpType;
  pos: THREE.Vector3;
}

interface RuntimeWater {
  mesh: THREE.Mesh;
  surfaceMesh: THREE.Mesh;
  box: THREE.Box3;
  surfaceY: number;
}

interface RuntimeCheckpoint {
  group: THREE.Group;
  crystalMesh: THREE.Mesh;
  crystalMat: THREE.MeshStandardMaterial;
  haloMesh: THREE.Mesh;
  pos: THREE.Vector3;
  activated: boolean;
}

interface RuntimeCrate {
  group: THREE.Group;
  pos: THREE.Vector3;
  collected: boolean;
}

interface RuntimePolarBear {
  def: PolarBearDef;
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  rightArmGroup: THREE.Group;
  rightArmMesh: THREE.Mesh;
  furMat: THREE.MeshStandardMaterial;
  pos: THREE.Vector3;
  baseY: number;
  isStunned: boolean;
  stunTimer: number;
  swipeTimer: number;
}

interface DebrisParticle {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  baseScale: number;
}

interface TrailGhost {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  life: number;
  maxLife: number;
  baseRadius: number;
}

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onStateChange: (
    state: GameState,
    finalScore: number,
    levelNumber: number
  ) => void;
}

export class BounceGameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private isSoftwareGl: boolean;
  private graphicsMode: GraphicsMode = 'HIGH';
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private dirLight: THREE.DirectionalLight;
  private ballKeyLight: THREE.PointLight;
  private dappledLight: THREE.SpotLight;

  // Game & Level State
  private gameState: GameState = 'START';
  private currentLevelIdx = 0;
  private currentBlueprint: LevelBlueprint = BOUNCE_LEVELS[0];
  private lives = 3;
  private canRevive = true;
  private score = 0;
  private highScore = 0;
  private collectedRings = 0;
  private totalRings = 0;
  private toastMessage: string | null = null;
  private toastTimer = 0;
  private stageIntroTimer = 0;
  private hintEnabled = false;
  private lang: GameLang = detectNationalLanguage();
  private hudSyncTimer = 0;
  private bestTimes: Record<number, number> = {};
  private isNewRecord = false;

  // Plain Glossy 3D Ball & Shared Textures
  private ball!: THREE.Mesh;
  private ballMaterial!: THREE.MeshPhysicalMaterial;
  private baseBrickTex: THREE.CanvasTexture;
  private bouncyBrickTex: THREE.CanvasTexture;
  private baseGrassTex: THREE.CanvasTexture;
  private baseIceTex: THREE.CanvasTexture;
  private baseSnowTex: THREE.CanvasTexture;
  private goldEnvTex: THREE.CanvasTexture;

  // 3D Gameplay Enhancements: Drop Shadow, 3D Trail, Water Ripple, 3D Hint Compass, Dynamic Camera
  private dropShadowGroup!: THREE.Group;
  private dropShadowDiscMat!: THREE.MeshBasicMaterial;
  private dropShadowRingMat!: THREE.MeshBasicMaterial;
  private waterRippleMesh!: THREE.Mesh;
  private waterRippleMat!: THREE.MeshBasicMaterial;
  private hintCompassGroup!: THREE.Group;
  private hintCompassMat!: THREE.MeshStandardMaterial;
  private trailPool: TrailGhost[] = [];
  private trailSpawnTimer = 0;
  private trailRainbowHue = 0;
  private equippedSkinId: BallSkinId = getEquippedSkin();
  private equippedTrailId: TrailEffectId = getEquippedTrail();
  private camLookAheadX = 1.8;
  private screenShakeTimer = 0;
  private screenShakeIntensity = 0;
  private starInvincibleTimer = 0;
  private starChimeAudioTimer = 0;
  private crates: RuntimeCrate[] = [];
  private polarBears: RuntimePolarBear[] = [];

  public triggerScreenShake(duration = 0.35, intensity = 0.35) {
    this.screenShakeTimer = duration;
    this.screenShakeIntensity = intensity;
  }

  // Pure 2-Size Arcade Bounce Classic Ball State ('NORMAL' small/default vs 'BIG' inflated)
  private readonly CLASSIC_PHYSICS = {
    // Horizontal Roll Acceleration, Friction & Speed Caps (1:1 Retro Arcade 30ms tick scaling)
    MOVE_ACCEL_GROUND: 42.0,
    MOVE_ACCEL_AIR: 28.5,
    GROUND_FRICTION_DECEL: 34.0,
    AIR_DRAG_DECEL: 7.5,
    REVERSE_BRAKE_MULT: 1.65,
    MAX_ROLL_SPEED_NORMAL: 10.4,
    MAX_ROLL_SPEED_BIG: 11.0,
    SLOPE_SLIDE_ACCEL: 14.5,
    MAX_SLOPE_SPEED: 13.4,

    // Vertical Gravity & Terminal Fall Velocity Caps
    GRAVITY_NORMAL: -28.0,
    GRAVITY_BIG: -23.5,
    MAX_FALL_SPEED_NORMAL: -22.5,
    MAX_FALL_SPEED_BIG: -18.5,

    // Jump Impulse & Elastic Bounce Restitution Constants
    JUMP_VELOCITY_NORMAL: 16.2,
    JUMP_VELOCITY_BIG: 19.6,
    RESTITUTION_BRICK_NORMAL: 0.52,
    RESTITUTION_BRICK_BIG: 0.65,
    RESTITUTION_WALL: 0.34,
    RESTITUTION_CEILING: 0.24,
    MIN_REBOUND_VELOCITY: 2.3,
    HOLD_JUMP_REBOUND_BONUS: 0.14,
    BOUNCY_FLOOR_RESTITUTION: 0.92,
    BOUNCY_FLOOR_MIN_LAUNCH_NORMAL: 20.8,
    BOUNCY_FLOOR_MIN_LAUNCH_BIG: 23.6,

    // Water Buoyancy, Sinking & Hydrodynamic Drag
    WATER_BUOYANCY_ACCEL_BIG: 46.0,
    WATER_SINK_ACCEL_NORMAL: -10.5,
    WATER_MAX_SINK_SPEED: -5.4,
    WATER_HORIZONTAL_DRAG: 18.0,
    WATER_SURFACE_JUMP_BIG: 17.5,
  } as const;

  private ballType: BallType = 'NORMAL';
  private ballRadius = 0.42;
  private ballRestitution = 0.52;
  private ballVelocity = new THREE.Vector3(0, 0, 0);
  private ballPosition = new THREE.Vector3(0, 3, 0);
  private checkpointPosition = new THREE.Vector3(0, 3, 0);
  private checkpointBallType: BallType = 'NORMAL';

  private isGrounded = false;
  private isOnIce = false;
  private activeSlopeDir: -1 | 0 | 1 = 0;
  private lastImpactSpeedY = 0;
  private isInWater = false;
  private canWaterJump = false;
  private wasInWater = false;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private pumpCooldown = 0;

  // Pop Death Animation State
  private isPopping = false;
  private popTimer = 0;

  private squashX = 1;
  private squashY = 1;

  private readonly GRAVITY = -28.0;
  private currentGravity = -28.0;
  private currentMaxFallSpeed = -22.5;
  private currentSpeed = 10.4;
  private currentJumpImpulse = 16.2;

  // Input State
  private keys = { left: false, right: false, jump: false };

  // Level Objects
  private levelGroup = new THREE.Group();
  private cloudGroups: THREE.Group[] = [];
  private blocks: RuntimeBlock[] = [];
  private slopes: RuntimeSlope[] = [];
  private jacks: RuntimeJack[] = [];
  private snowballs: RuntimeSnowball[] = [];
  private iceBossGroup: THREE.Group | null = null;
  private lifeOrbs: RuntimeLifeOrb[] = [];
  private rings: RuntimeRing[] = [];
  private spikes: RuntimeSpike[] = [];
  private pumps: RuntimePump[] = [];
  private waterZones: RuntimeWater[] = [];
  private checkpoints: RuntimeCheckpoint[] = [];
  private exitRing: THREE.Mesh | null = null;
  private exitDoor: { mesh: THREE.Mesh; box: THREE.Box3 } | null = null;
  private exitUnlocked = false;
  private debrisPool: DebrisParticle[] = [];

  // Loop & Events
  private frameId = 0;
  private lastTimeMs = 0;
  private elapsedLevelTime = 0;
  private disposed = false;

  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;
  private onBlurBound: () => void;
  private onResizeBound: () => void;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    try {
      this.highScore =
        parseInt(localStorage.getItem('bounce_high_score') || '0', 10) || 0;
      const rawTimes = localStorage.getItem('bounce_best_times');
      if (rawTimes) {
        const parsed = JSON.parse(rawTimes);
        if (parsed && typeof parsed === 'object') {
          this.bestTimes = parsed;
        }
      }
    } catch {
      this.highScore = 0;
    }

    // Software WebGL guard
    this.isSoftwareGl = (() => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.011);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(2.8, 4.5, 10.5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Rich 3D Lighting Rig (Ambient + Hemisphere + Directional Sun + Ball Specular PointLight)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.55);
    hemiLight.position.set(0, 30, 0);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.15);
    this.dirLight.position.set(20, 40, 30);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.set(1024, 1024);
    const d = 32;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 110;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // Specular key light that follows the ball to give the plain sphere vivid 3D shine
    this.ballKeyLight = new THREE.PointLight(0xffffff, 1.4, 9, 1.5);
    this.scene.add(this.ballKeyLight);

    this.dappledLight = new THREE.SpotLight(0xfef08a, 1.1, 55, Math.PI / 3, 0.6, 1.5);
    this.dappledLight.position.set(0, 22, 12);
    this.dappledLight.visible = false;
    this.scene.add(this.dappledLight);
    this.scene.add(this.dappledLight.target);

    // Pre-generate Shared Procedural Textures (Classic Red Brick, Blue Rubber Bouncy Floor, Jungle Grass, and 24K Gold Studio Reflection Map)
    this.baseBrickTex = this.createBrickTexture();
    this.bouncyBrickTex = this.createBouncyTexture();
    this.baseGrassTex = this.createGrassTexture();
    this.baseIceTex = this.createIceTexture();
    this.baseSnowTex = this.createSnowTexture();
    this.goldEnvTex = this.createGoldEnvTexture();

    this.scene.add(this.levelGroup);
    this.createClouds();
    this.initDebrisPool();
    this.initTrailPool();
    this.createDropShadowAndRipple();
    this.createBallMesh();
    this.loadLevel(0);

    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onKeyUpBound = this.handleKeyUp.bind(this);
    this.onBlurBound = this.handleBlur.bind(this);
    this.onResizeBound = this.handleResize.bind(this);

    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    window.addEventListener('blur', this.onBlurBound);
    window.addEventListener('resize', this.onResizeBound);

    this.lastTimeMs = performance.now();
    this.startLoop();
  }

  public setLanguage(lang: GameLang) {
    this.lang = lang;
    this.broadcastHud();
  }

  public toggleGraphicsMode() {
    const nextMode: GraphicsMode =
      this.graphicsMode === 'HIGH' ? 'PERFORMANCE' : 'HIGH';
    this.setGraphicsMode(nextMode);
  }

  public setGraphicsMode(mode: GraphicsMode) {
    const t = TRANSLATIONS[this.lang];
    this.graphicsMode = mode;
    if (mode === 'PERFORMANCE' || this.isSoftwareGl) {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      this.dirLight.castShadow = false;
      this.showToast(t.toastGraphicsEco);
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.dirLight.castShadow = true;
      this.showToast(t.toastGraphicsHd);
    }
    this.renderer.shadowMap.needsUpdate = true;
    this.broadcastHud();
  }

  private createBrickTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 4;

    const rows = 4;
    const rowHeight = 128 / rows;
    for (let i = 0; i <= rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * rowHeight);
      ctx.lineTo(128, i * rowHeight);
      ctx.stroke();
    }

    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : 32;
      for (let c = -1; c < 4; c++) {
        ctx.beginPath();
        ctx.moveTo(c * 64 + offset, r * rowHeight);
        ctx.lineTo(c * 64 + offset, (r + 1) * rowHeight);
        ctx.stroke();
      }
    }

    for (let i = 0; i < 160; i++) {
      ctx.fillStyle =
        i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)';
      ctx.fillRect((i * 53) % 128, (i * 97) % 128, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createBouncyTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, 128, 28);

    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 6;
    for (let x = 32; x <= 96; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x - 16, 86);
      ctx.lineTo(x, 64);
      ctx.lineTo(x + 16, 86);
      ctx.stroke();
    }

    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 124, 124);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createGrassTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Rich textured antique soil base
    const dirtGrad = ctx.createLinearGradient(0, 32, 0, 128);
    dirtGrad.addColorStop(0, '#7c4d22');
    dirtGrad.addColorStop(0.4, '#5c3614');
    dirtGrad.addColorStop(1, '#3b220b');
    ctx.fillStyle = dirtGrad;
    ctx.fillRect(0, 0, 128, 128);

    // Deep soil strata & tactile earth lines
    ctx.fillStyle = '#261405';
    for (let y = 40; y < 128; y += 18) {
      ctx.fillRect(0, y, 128, 3);
    }

    // Detailed soil pebbles, roots and earth granules
    for (let i = 0; i < 140; i++) {
      const px = (i * 31) % 124;
      const py = 34 + ((i * 61) % 92);
      ctx.fillStyle = i % 3 === 0 ? '#9c6b3b' : i % 2 === 0 ? '#4a280b' : '#2b1504';
      ctx.fillRect(px, py, 3, 3);
    }

    // Organic root lines
    ctx.strokeStyle = '#261405';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const startX = i * 22;
      ctx.moveTo(startX, 40);
      ctx.quadraticCurveTo(startX + 10, 80, startX + 5, 128);
      ctx.stroke();
    }

    // Soft deep shadow under grass fringe
    ctx.fillStyle = 'rgba(10, 30, 10, 0.55)';
    ctx.fillRect(0, 26, 128, 8);

    // Lush textured grass top layer with multi-tone gradient
    const grassGrad = ctx.createLinearGradient(0, 0, 0, 30);
    grassGrad.addColorStop(0, '#86efac');
    grassGrad.addColorStop(0.25, '#4ade80');
    grassGrad.addColorStop(0.65, '#22c55e');
    grassGrad.addColorStop(1, '#15803d');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 0, 128, 26);

    // Intricate textured grass blades and highlights
    ctx.fillStyle = '#14532d';
    for (let x = 0; x < 128; x += 4) {
      const h = 10 + Math.sin(x * 0.9) * 6;
      ctx.fillRect(x, 22, 2.5, h + 2);
    }

    ctx.fillStyle = '#4ade80';
    for (let x = 2; x < 128; x += 6) {
      const h = 8 + Math.cos(x * 0.7) * 5;
      ctx.fillRect(x, 20, 2, h + 4);
    }

    // Bright sunlit grass rim highlight at very top
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(0, 0, 128, 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  private createIceTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Deep realistic glacier ice gradient (translucent cyan-blue to deep arctic sapphire)
    const iceGrad = ctx.createLinearGradient(0, 0, 0, 256);
    iceGrad.addColorStop(0.0, '#f0f9ff');
    iceGrad.addColorStop(0.14, '#bae6fd');
    iceGrad.addColorStop(0.42, '#7dd3fc');
    iceGrad.addColorStop(0.75, '#38bdf8');
    iceGrad.addColorStop(1.0, '#0284c7');
    ctx.fillStyle = iceGrad;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle horizontal glacial compression strata
    for (let y = 28; y < 256; y += 36) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(0, y, 256, 4);
      ctx.fillStyle = 'rgba(3, 105, 161, 0.18)';
      ctx.fillRect(0, y + 4, 256, 3);
    }

    // Diagonal internal crystalline ice refraction facets
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.48)';
    ctx.lineWidth = 2.2;
    for (let i = -2; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 56, 0);
      ctx.lineTo(i * 56 + 44, 110);
      ctx.lineTo(i * 56 + 18, 256);
      ctx.stroke();
    }

    // Secondary fine frost fracture veins
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const sx = (i * 37) % 256;
      const sy = (i * 53) % 200;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 28, sy + 22);
      ctx.lineTo(sx + 14, sy + 48);
      ctx.stroke();
    }

    // Specular ice crystal glints & frozen air bubbles
    for (let i = 0; i < 90; i++) {
      const px = (i * 73) % 250;
      const py = (i * 41) % 250;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 255, 255, 0.75)' : 'rgba(186, 230, 253, 0.45)';
      ctx.beginPath();
      ctx.arc(px, py, i % 4 === 0 ? 2.5 : 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top packed snow & frost crust border
    const frostGrad = ctx.createLinearGradient(0, 0, 0, 28);
    frostGrad.addColorStop(0, '#ffffff');
    frostGrad.addColorStop(0.65, '#f0f9ff');
    frostGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');
    ctx.fillStyle = frostGrad;
    ctx.fillRect(0, 0, 256, 28);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createSnowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(52, 48, 8, 64, 64, 72);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.6, '#f8fafc');
    grad.addColorStop(1, '#dbeafe');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    // Tactile packed-snow dimples and sparkle flecks
    for (let i = 0; i < 80; i++) {
      const x = (i * 47) % 124;
      const y = (i * 83) % 124;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(186, 230, 253, 0.42)' : 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createGoldEnvTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Rich 24K Metallic Gold studio reflection gradient (warm amber, bright specular gold, deep bronze)
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0.0, '#fffbeb');
    grad.addColorStop(0.18, '#fde047');
    grad.addColorStop(0.35, '#f59e0b');
    grad.addColorStop(0.5, '#92400e');
    grad.addColorStop(0.65, '#fbbf24');
    grad.addColorStop(0.82, '#fffbeb');
    grad.addColorStop(1.0, '#b45309');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);

    // Specular studio light streaks for gleaming metallic gold highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(0, 18, 256, 8);
    ctx.fillRect(0, 92, 256, 6);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
  }

  private createClouds() {
    const cloudGeo = new THREE.DodecahedronGeometry(2.5, 1);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.82,
    });

    for (let i = 0; i < 42; i++) {
      const cloudGroup = new THREE.Group();
      const count = 3 + (i % 3);
      for (let j = 0; j < count; j++) {
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set(
          j * 1.8,
          Math.sin(i + j) * 0.7,
          Math.cos(i + j) * 0.7
        );
        cloud.scale.setScalar(0.8 + ((i + j) % 3) * 0.22);
        cloudGroup.add(cloud);
      }
      cloudGroup.position.set(
        -20 + i * 7.5,
        10 + (i % 5) * 3.2,
        -12 - (i % 4) * 4.5
      );
      this.scene.add(cloudGroup);
      this.cloudGroups.push(cloudGroup);
    }
  }

  private initDebrisPool() {
    const geo = new THREE.DodecahedronGeometry(0.28, 1);
    for (let i = 0; i < 48; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.85,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.debrisPool.push({
        mesh,
        mat,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.45,
        baseScale: 1,
      });
    }
  }

  private initTrailPool() {
    const geo = new THREE.SphereGeometry(1, 16, 16);
    for (let i = 0; i < 10; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.trailPool.push({
        mesh,
        mat,
        life: 0,
        maxLife: 0.22,
        baseRadius: 0.42,
      });
    }
  }

  private createDropShadowAndRipple() {
    this.dropShadowGroup = new THREE.Group();

    const discGeo = new THREE.CircleGeometry(0.55, 24);
    discGeo.rotateX(-Math.PI / 2);
    this.dropShadowDiscMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const discMesh = new THREE.Mesh(discGeo, this.dropShadowDiscMat);

    const ringGeo = new THREE.RingGeometry(0.48, 0.62, 24);
    ringGeo.rotateX(-Math.PI / 2);
    this.dropShadowRingMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeo, this.dropShadowRingMat);
    ringMesh.position.y = 0.01;

    this.dropShadowGroup.add(discMesh, ringMesh);
    this.scene.add(this.dropShadowGroup);

    // 3D Water Surface Ripple Ring around floating ball
    const rippleGeo = new THREE.RingGeometry(0.65, 0.85, 28);
    rippleGeo.rotateX(-Math.PI / 2);
    this.waterRippleMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.waterRippleMesh = new THREE.Mesh(rippleGeo, this.waterRippleMat);
    this.waterRippleMesh.visible = false;
    this.scene.add(this.waterRippleMesh);

    // 3D Floating Hint Compass Arrow above the ball pointing toward the next target
    this.hintCompassGroup = new THREE.Group();
    this.hintCompassMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.65,
    });

    const shaftGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.34, 12);
    shaftGeo.rotateZ(-Math.PI / 2);
    shaftGeo.translate(-0.08, 0, 0);
    const shaftMesh = new THREE.Mesh(shaftGeo, this.hintCompassMat);

    const headGeo = new THREE.ConeGeometry(0.17, 0.32, 14);
    headGeo.rotateZ(-Math.PI / 2);
    headGeo.translate(0.18, 0, 0);
    const headMesh = new THREE.Mesh(headGeo, this.hintCompassMat);

    this.hintCompassGroup.add(shaftMesh, headMesh);
    this.hintCompassGroup.visible = false;
    this.scene.add(this.hintCompassGroup);
  }

  private spawnTrailSphere() {
    for (const t of this.trailPool) {
      if (t.life <= 0) {
        t.maxLife = this.equippedTrailId === 'default_red' ? 0.22 : 0.3;
        t.life = t.maxLife;
        t.baseRadius = this.ballRadius * 0.92;
        if (this.equippedTrailId === 'trail_rainbow') {
          this.trailRainbowHue = (this.trailRainbowHue + 0.14) % 1.0;
          t.mat.color.setHSL(this.trailRainbowHue, 0.95, 0.58);
          t.mat.opacity = 0.48;
        } else if (this.equippedTrailId === 'trail_gold') {
          t.mat.color.setHex(
            Math.random() > 0.4
              ? TRAIL_EFFECT_META.trail_gold.primaryHex
              : TRAIL_EFFECT_META.trail_gold.secondaryHex
          );
          t.mat.opacity = 0.45;
        } else if (this.equippedTrailId === 'trail_emerald') {
          t.mat.color.setHex(
            Math.random() > 0.4
              ? TRAIL_EFFECT_META.trail_emerald.primaryHex
              : TRAIL_EFFECT_META.trail_emerald.secondaryHex
          );
          t.mat.opacity = 0.45;
        } else {
          const skinMeta =
            BALL_SKIN_META[this.equippedSkinId] || BALL_SKIN_META.default_red;
          t.mat.color.setHex(skinMeta.colorHex);
          t.mat.opacity = 0.34;
        }
        t.mesh.position.copy(this.ballPosition);
        t.mesh.scale.setScalar(t.baseRadius);
        t.mesh.visible = true;
        break;
      }
    }
  }

  private spawnLandingDust(pos: THREE.Vector3, countMax = 8) {
    let count = 0;
    for (const d of this.debrisPool) {
      if (d.life <= 0) {
        d.maxLife = 0.42 + Math.random() * 0.12;
        d.life = d.maxLife;
        d.baseScale = 0.5 + Math.random() * 0.4;
        d.mat.color.setHex(count % 2 === 0 ? 0xf8fafc : 0xe2e8f0);
        d.mat.opacity = 0.8;
        const angle = (count / countMax) * Math.PI * 2;
        d.mesh.position.set(
          pos.x + Math.cos(angle) * 0.25,
          pos.y - this.ballRadius + 0.08,
          pos.z + Math.sin(angle) * 0.25
        );
        d.vel.set(
          Math.cos(angle) * (2.4 + Math.random() * 2.0),
          1.2 + Math.random() * 1.8,
          Math.sin(angle) * (2.0 + Math.random() * 1.5)
        );
        d.mesh.scale.setScalar(d.baseScale);
        d.mesh.visible = true;
        count++;
        if (count >= countMax) break;
      }
    }
  }

  private spawnBurstParticles(
    pos: THREE.Vector3,
    primaryColor: number,
    secondaryColor: number,
    maxCount = 12,
    spreadY = 1.6
  ) {
    let count = 0;
    for (const d of this.debrisPool) {
      if (d.life <= 0) {
        d.life = 0.68;
        d.mat.color.setHex(count % 2 === 0 ? primaryColor : secondaryColor);
        d.mesh.position.set(
          pos.x + (Math.random() - 0.5) * 1.2,
          pos.y + (Math.random() - 0.5) * spreadY,
          pos.z + (Math.random() - 0.5) * 1.0
        );
        d.vel.set(
          (Math.random() - 0.5) * 11,
          3.5 + Math.random() * 8.5,
          (Math.random() - 0.5) * 7
        );
        d.mesh.visible = true;
        count++;
        if (count >= maxCount) break;
      }
    }
  }

  /**
   * Pure Glossy 3D Sphere with Dynamic Skin Material & Physical Clearcoat Specular Highlight
   */
  private createBallMesh() {
    const geo = new THREE.SphereGeometry(1, 40, 40);
    const skinMeta =
      BALL_SKIN_META[this.equippedSkinId] || BALL_SKIN_META.default_red;
    this.ballMaterial = new THREE.MeshPhysicalMaterial({
      color: skinMeta.colorHex,
      emissive: skinMeta.emissiveHex,
      emissiveIntensity: skinMeta.emissiveIntensity,
      roughness: skinMeta.roughness,
      metalness: skinMeta.metalness,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
    });
    this.ball = new THREE.Mesh(geo, this.ballMaterial);
    this.ball.castShadow = true;
    this.ball.receiveShadow = true;
    this.scene.add(this.ball);
  }

  private applyBallSkinAppearance() {
    if (!this.ballMaterial) return;
    const skinMeta =
      BALL_SKIN_META[this.equippedSkinId] || BALL_SKIN_META.default_red;
    this.ballMaterial.color.setHex(skinMeta.colorHex);
    this.ballMaterial.emissive.setHex(skinMeta.emissiveHex);
    this.ballMaterial.emissiveIntensity = skinMeta.emissiveIntensity;
    this.ballMaterial.metalness = skinMeta.metalness;
    this.ballMaterial.roughness = skinMeta.roughness;
    this.ballMaterial.needsUpdate = true;
  }

  public setBallSkin(skinId: BallSkinId) {
    this.equippedSkinId = skinId;
    this.applyBallSkinAppearance();
  }

  public getBallSkin(): BallSkinId {
    return this.equippedSkinId;
  }

  public setTrailEffect(trailId: TrailEffectId) {
    this.equippedTrailId = trailId;
  }

  public getTrailEffect(): TrailEffectId {
    return this.equippedTrailId;
  }

  private disposeLevelResources() {
    const disposedGeos = new Set<THREE.BufferGeometry>();
    const disposedMats = new Set<THREE.Material>();

    this.levelGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry && !disposedGeos.has(mesh.geometry)) {
          disposedGeos.add(mesh.geometry);
          mesh.geometry.dispose();
        }
        const mat = mesh.material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            if (!disposedMats.has(m)) {
              disposedMats.add(m);
              this.disposeMaterialTextures(m);
              m.dispose();
            }
          });
        } else if (mat && !disposedMats.has(mat)) {
          disposedMats.add(mat);
          this.disposeMaterialTextures(mat);
          mat.dispose();
        }
      }
    });

    this.levelGroup.clear();
  }

  private disposeMaterialTextures(mat: THREE.Material) {
    const stdMat = mat as THREE.MeshStandardMaterial;
    if (
      stdMat.map &&
      stdMat.map !== this.baseBrickTex &&
      stdMat.map !== this.bouncyBrickTex &&
      stdMat.map !== this.baseGrassTex &&
      stdMat.map !== this.baseIceTex &&
      stdMat.map !== this.baseSnowTex
    ) {
      stdMat.map.dispose();
    }
  }

  public loadLevel(levelIdx: number) {
    this.currentLevelIdx = THREE.MathUtils.clamp(
      levelIdx,
      0,
      BOUNCE_LEVELS.length - 1
    );
    const bp = BOUNCE_LEVELS[this.currentLevelIdx];
    this.currentBlueprint = bp;

    this.disposeLevelResources();

    this.setupAtmosphere(bp);
    this.initLevelState();
    this.buildLevelObjects(bp);
    this.resetLevelState(bp);
  }

  /**
   * Authentic 2-Size Nokia Bounce Classic Ball State (1:1 Physics Constants):
   * - 'BIG' (via INFLATE): radius 0.76, floats on water, high jump, floatier gravity
   * - 'NORMAL' (via DEFLATE or default): radius 0.42, fits in narrow tunnels, sinks in water, crisp gravity
   */
  private setBallState(type: PumpType | BallType, showNotification = true) {
    const oldRadius = this.ballRadius;
    const P = this.CLASSIC_PHYSICS;

    if (type === 'INFLATE' || type === 'BIG') {
      this.ballType = 'BIG';
      this.ballRadius = 0.76;
      this.ballRestitution = P.RESTITUTION_BRICK_BIG;
      this.currentGravity = P.GRAVITY_BIG;
      this.currentMaxFallSpeed = P.MAX_FALL_SPEED_BIG;
      this.currentJumpImpulse = P.JUMP_VELOCITY_BIG;
      this.currentSpeed = P.MAX_ROLL_SPEED_BIG;
      this.applyBallSkinAppearance();
      if (showNotification)
        this.showToast(TRANSLATIONS[this.lang].toastInflateBig);
    } else {
      this.ballType = 'NORMAL';
      this.ballRadius = 0.42;
      this.ballRestitution = P.RESTITUTION_BRICK_NORMAL;
      this.currentGravity = P.GRAVITY_NORMAL;
      this.currentMaxFallSpeed = P.MAX_FALL_SPEED_NORMAL;
      this.currentJumpImpulse = P.JUMP_VELOCITY_NORMAL;
      this.currentSpeed = P.MAX_ROLL_SPEED_NORMAL;
      this.applyBallSkinAppearance();
      if (showNotification)
        this.showToast(TRANSLATIONS[this.lang].toastDeflateSmall);
    }

    const deltaRadius = this.ballRadius - oldRadius;
    if (deltaRadius > 0) {
      this.ballPosition.y += deltaRadius + 0.15;
    }
    this.ballVelocity.y = Math.max(0.5, this.ballVelocity.y);

    this.ballMaterial.needsUpdate = true;
    this.ball.scale.setScalar(this.ballRadius);
    this.broadcastHud();
  }

  private restoreFragileIceBridges() {
    for (const b of this.blocks) {
      if (b.def.isFragileIce && b.isShattered) {
        b.isShattered = false;
        b.crackTimer = 0;
        b.mesh.visible = true;
        if (b.mesh.material) {
          const mat = b.mesh.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0xffffff);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
          mat.needsUpdate = true;
        }
        const halfW = b.def.w / 2;
        const halfH = b.def.h / 2;
        const halfD = (b.def.d ?? 3.4) / 2;
        const bz = b.def.z ?? 0;
        b.box.min.set(
          b.mesh.position.x - halfW,
          b.mesh.position.y - halfH,
          bz - halfD
        );
        b.box.max.set(
          b.mesh.position.x + halfW,
          b.mesh.position.y + halfH,
          bz + halfD
        );
      }
    }

    for (const crate of this.crates) {
      if (crate.collected) {
        crate.collected = false;
        this.levelGroup.add(crate.group);
      }
    }

    for (const bear of this.polarBears) {
      bear.isStunned = false;
      bear.stunTimer = 0;
      bear.group.rotation.z = 0;
      bear.rightArmGroup.rotation.z = 0;
      bear.furMat.emissive.setHex(0x000000);
      bear.furMat.emissiveIntensity = 0;
    }
  }

  private resetBallToPosition(pos: THREE.Vector3) {
    this.restoreFragileIceBridges();
    this.ballPosition.copy(pos);
    this.ballVelocity.set(0, 0, 0);
    this.activeSlopeDir = 0;
    this.lastImpactSpeedY = 0;
    this.squashX = 1;
    this.squashY = 1;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isPopping = false;
    this.popTimer = 0;
    if (this.ball) {
      this.ball.visible = true;
      this.ball.position.copy(this.ballPosition);
    }
  }

  public showToast(text: string) {
    this.toastMessage = text;
    this.toastTimer = 2.2;
    this.broadcastHud();
  }

  public startGame(levelIdx: number = this.currentLevelIdx) {
    soundFX.init();
    this.lives = 3;
    this.score = 0;
    this.loadLevel(levelIdx);
    this.gameState = 'PLAYING';
    this.stageIntroTimer = 2.0;
    this.lastTimeMs = performance.now();
    this.callbacks.onStateChange(
      this.gameState,
      this.score,
      this.currentBlueprint.levelNumber
    );
    this.broadcastHud();
  }

  public restartCurrentLevel() {
    soundFX.init();
    this.lives = 3;
    this.loadLevel(this.currentLevelIdx);
    this.gameState = 'PLAYING';
    this.stageIntroTimer = 2.0;
    this.lastTimeMs = performance.now();
    this.callbacks.onStateChange(
      this.gameState,
      this.score,
      this.currentBlueprint.levelNumber
    );
    this.broadcastHud();
  }

  public returnToMainMenu() {
    this.keys.left = false;
    this.keys.right = false;
    this.keys.jump = false;
    this.gameState = 'START';
    this.stageIntroTimer = 0;
    this.callbacks.onStateChange(
      this.gameState,
      this.score,
      this.currentBlueprint.levelNumber
    );
    this.broadcastHud();
  }

  public startNextLevel() {
    const nextIdx = (this.currentLevelIdx + 1) % BOUNCE_LEVELS.length;
    soundFX.init();
    // Preserve accumulated score and remaining lives (minimum 3) across stages
    this.lives = Math.max(this.lives, 3);
    this.loadLevel(nextIdx);
    this.gameState = 'PLAYING';
    this.stageIntroTimer = 2.0;
    this.lastTimeMs = performance.now();
    this.callbacks.onStateChange(
      this.gameState,
      this.score,
      this.currentBlueprint.levelNumber
    );
    this.broadcastHud();
  }

  public reviveAtCheckpoint() {
    if (this.gameState !== 'GAMEOVER' || !this.canRevive) return;
    soundFX.init();
    soundFX.playWinTune();
    this.canRevive = false;
    this.lives = 1;
    this.setBallState(this.checkpointBallType, false);
    this.resetBallToPosition(this.checkpointPosition);
    this.gameState = 'PLAYING';
    this.lastTimeMs = performance.now();
    this.showToast(TRANSLATIONS[this.lang].toastRevived);
    this.callbacks.onStateChange(
      this.gameState,
      this.score,
      this.currentBlueprint.levelNumber
    );
    this.broadcastHud();
  }

  public reviveWithExtraLife() {
    soundFX.init();
    soundFX.playExtraLife();
    this.lives = Math.max(1, this.lives + 1);
    this.setBallState(this.checkpointBallType, false);
    this.resetBallToPosition(this.checkpointPosition);
    this.gameState = 'PLAYING';
    this.lastTimeMs = performance.now();
    this.showToast(TRANSLATIONS[this.lang].adRewardClaimed);
    this.callbacks.onStateChange(
      this.gameState,
      this.score,
      this.currentBlueprint.levelNumber
    );
    this.broadcastHud();
  }

  public togglePause() {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
    } else if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      this.lastTimeMs = performance.now();
    }
    this.callbacks.onStateChange(
      this.gameState,
      this.score,
      this.currentBlueprint.levelNumber
    );
    this.broadcastHud();
  }

  public toggleHint() {
    const t = TRANSLATIONS[this.lang];
    this.hintEnabled = !this.hintEnabled;
    this.showToast(this.hintEnabled ? t.toastHintOn : t.toastHintOff);
    this.broadcastHud();
  }

  public setTouchInput(dir: 'left' | 'right' | 'jump', active: boolean) {
    soundFX.init();
    if (dir === 'jump' && active && this.gameState === 'PLAYING') {
      this.jumpBufferTimer = 0.13;
      this.tryExecuteJump();
    }
    this.keys[dir] = active;
  }

  private tryExecuteJump() {
    if (this.isPopping) return false;
    const P = this.CLASSIC_PHYSICS;
    if (this.isGrounded || this.coyoteTimer > 0 || this.canWaterJump) {
      if (this.canWaterJump && !this.isGrounded) {
        this.ballVelocity.y = P.WATER_SURFACE_JUMP_BIG;
      } else {
        // Classic Arcade Bounce Hold-Jump Rebound Boost:
        // Holding jump right as the ball rebounds off the floor adds a small fraction of fall momentum
        const reboundBoost = Math.min(
          this.lastImpactSpeedY * P.HOLD_JUMP_REBOUND_BONUS,
          1.8
        );
        this.ballVelocity.y = Math.max(
          this.ballVelocity.y,
          this.currentJumpImpulse + reboundBoost
        );
      }
      this.lastImpactSpeedY = 0;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.squashY = 1.35;
      this.squashX = 0.75;
      this.spawnLandingDust(this.ballPosition, 5);
      soundFX.playBounce(this.ballType === 'BIG' ? 0.7 : 1);
      return true;
    }
    return false;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.gameState === 'PLAYING') {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (
        e.code === 'Space' ||
        e.code === 'ArrowUp' ||
        e.code === 'KeyW'
      ) {
        e.preventDefault();
        if (!this.keys.jump) {
          this.jumpBufferTimer = 0.13;
          this.tryExecuteJump();
        }
        this.keys.jump = true;
      }
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (this.gameState === 'PLAYING' || this.gameState === 'PAUSED') {
        this.togglePause();
      }
    }
    if (e.code === 'KeyH') {
      this.toggleHint();
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.keys.jump = false;
    }
  }

  private handleBlur() {
    this.keys.left = false;
    this.keys.right = false;
    this.keys.jump = false;
  }

  private handleResize() {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop() {
    const tick = () => {
      if (this.disposed) return;
      const nowMs = performance.now();
      const rawDt = (nowMs - this.lastTimeMs) / 1000;
      this.lastTimeMs = nowMs;
      const delta = Math.min(Math.max(rawDt, 0.001), 0.05);

      if (this.gameState === 'PLAYING') {
        this.updatePhysics(delta);
      }

      this.updateDebrisAndTrails(delta);
      this.updateFoliageSway(delta);
      this.updateDappledLight(delta);
      this.updateDropShadow();
      this.updateHintCompass();
      this.updateCamera(delta);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };
    this.frameId = requestAnimationFrame(tick);
  }

  private updateDebrisAndTrails(delta: number) {
    // Leaf particles for Jungle biome
    if (this.currentBlueprint.biome === 'JUNGLE' && Math.random() < 0.05) {
      this.spawnBurstParticles(
        new THREE.Vector3(
          this.ballPosition.x + (Math.random() - 0.5) * 10,
          this.ballPosition.y + 5 + Math.random() * 5,
          0
        ),
        0x22c55e,
        0x15803d,
        2,
        0
      );
    } else if (this.currentBlueprint.biome === 'ICE' && Math.random() < 0.14) {
      // Blizzard snowflake flurry particles in Zone 3 Ice biome
      this.spawnBurstParticles(
        new THREE.Vector3(
          this.ballPosition.x + (Math.random() - 0.5) * 18,
          this.ballPosition.y + 6 + Math.random() * 6,
          (Math.random() - 0.5) * 4
        ),
        0xffffff,
        0xbae6fd,
        2,
        0.5
      );
    }

    for (const d of this.debrisPool) {
      if (d.life > 0) {
        d.life -= delta;
        if (d.life <= 0) {
          d.mesh.visible = false;
        } else {
          const lifeRatio = d.life / (d.maxLife || 0.45);
          d.mat.opacity = Math.min(0.85, lifeRatio * 0.85);
          const expandScale = (d.baseScale || 1) * (1.8 - lifeRatio * 0.8);
          d.mesh.scale.setScalar(expandScale);
          d.vel.y += this.GRAVITY * 0.25 * delta;
          d.mesh.position.addScaledVector(d.vel, delta);
          d.mesh.rotation.x += delta * 4;
          d.mesh.rotation.z += delta * 4;
        }
      }
    }

    for (const t of this.trailPool) {
      if (t.life > 0) {
        t.life -= delta;
        if (t.life <= 0) {
          t.mesh.visible = false;
        } else {
          const ratio = t.life / t.maxLife;
          t.mat.opacity = ratio * 0.28;
          t.mesh.scale.setScalar(t.baseRadius * (0.4 + 0.6 * ratio));
        }
      }
    }
  }

  /**
   * Projects a 3D Drop-Shadow & Target Landing Ring onto the highest surface below the ball
   */
  private updateDropShadow() {
    if (!this.ball || this.isPopping) {
      this.dropShadowGroup.visible = false;
      return;
    }

    const px = this.ballPosition.x;
    const py = this.ballPosition.y;
    let bestGroundY = -Infinity;

    for (const b of this.blocks) {
      if (px >= b.box.min.x - 0.2 && px <= b.box.max.x + 0.2) {
        if (b.box.max.y <= py + 0.1 && b.box.max.y > bestGroundY) {
          bestGroundY = b.box.max.y;
        }
      }
    }

    for (const s of this.slopes) {
      const sd = s.def;
      if (px >= sd.x && px <= sd.x + sd.w) {
        const relX = (px - sd.x) / sd.w;
        const slopeTopY =
          sd.dir === 'up-right'
            ? sd.y + relX * sd.h
            : sd.y + (1 - relX) * sd.h;
        if (slopeTopY <= py + 0.2 && slopeTopY > bestGroundY) {
          bestGroundY = slopeTopY;
        }
      }
    }

    if (bestGroundY === -Infinity) {
      this.dropShadowGroup.visible = false;
      return;
    }

    const heightAboveGround = Math.max(0, py - this.ballRadius - bestGroundY);
    if (heightAboveGround > 14) {
      this.dropShadowGroup.visible = false;
      return;
    }

    this.dropShadowGroup.visible = true;
    this.dropShadowGroup.position.set(px, bestGroundY + 0.02, 0);

    const heightFactor = THREE.MathUtils.clamp(
      1 - heightAboveGround / 12,
      0.25,
      1
    );
    const scale = this.ballRadius * (1.55 - 0.45 * heightFactor);
    this.dropShadowGroup.scale.setScalar(scale);
    this.dropShadowDiscMat.opacity = 0.44 * heightFactor;
    this.dropShadowRingMat.opacity =
      heightAboveGround > 0.2 ? 0.65 * heightFactor : 0.18;
  }

  /**
   * Updates the 3D Floating Compass Arrow above the ball to point toward the active hint target
   */
  private updateFoliageSway(_delta: number) {
    if (this.currentBlueprint.biome !== 'JUNGLE') return;

    const time = this.elapsedLevelTime * 2.6;
    for (const b of this.blocks) {
      if (b.biome === 'JUNGLE' && !b.def.isBouncy) {
        // Gently sway only the decorative 3D grass blades on top of the block, keeping the dirt block itself level
        for (const child of b.mesh.children) {
          if (child.userData.isGrassTuft) {
            child.rotation.z =
              Math.sin(time + (child.userData.phase ?? 0)) * 0.12;
          }
        }
      }
    }
  }

  private updateDappledLight(delta: number) {
    if (this.currentBlueprint.biome !== 'JUNGLE') return;
    this.dappledLight.position.set(
      this.ballPosition.x + Math.sin(this.elapsedLevelTime) * 2,
      20,
      10
    );
    this.dappledLight.target.position.set(this.ballPosition.x, this.ballPosition.y, 0);
    this.dappledLight.target.updateMatrixWorld();
  }

  private updateHintCompass() {
    if (
      !this.hintCompassGroup ||
      !this.hintEnabled ||
      this.gameState !== 'PLAYING' ||
      this.isPopping
    ) {
      if (this.hintCompassGroup) this.hintCompassGroup.visible = false;
      return;
    }

    const px = this.ballPosition.x;
    const py = this.ballPosition.y;
    let targetX = this.currentBlueprint.exitRingX;
    let targetY = this.currentBlueprint.exitRingY;
    let compassColor = 0x22c55e;
    let compassEmissive = 0x16a34a;

    if (!this.exitUnlocked) {
      // Check if player is BIG and approaching a narrow tunnel ceiling (y=3.1) -> point to nearest DEFLATE pump
      let needsDeflatePump = false;
      if (this.ballType === 'BIG') {
        for (const b of this.blocks) {
          if (
            b.def.y >= 2.9 &&
            b.def.y <= 3.3 &&
            px >= b.def.x - 10 &&
            px <= b.def.x + 2
          ) {
            needsDeflatePump = true;
            break;
          }
        }
      }

      if (needsDeflatePump) {
        let bestPumpDist = Infinity;
        for (const p of this.pumps) {
          if (p.type === 'DEFLATE') {
            const d = Math.hypot(p.pos.x - px, p.pos.y - py);
            if (d < bestPumpDist) {
              bestPumpDist = d;
              targetX = p.pos.x;
              targetY = p.pos.y;
              compassColor = 0x38bdf8;
              compassEmissive = 0x0284c7;
            }
          }
        }
      } else {
        // Prioritize any missed Gold Hoop behind the player, otherwise nearest uncollected Gold Hoop
        let missedRing: RuntimeRing | null = null;
        let nearestRing: RuntimeRing | null = null;
        let bestDist = Infinity;

        for (const r of this.rings) {
          if (!r.collected) {
            if (r.pos.x < px - 4.0 && !missedRing) {
              missedRing = r;
            }
            const d = Math.hypot(r.pos.x - px, r.pos.y - py);
            if (d < bestDist) {
              bestDist = d;
              nearestRing = r;
            }
          }
        }

        const chosenRing = missedRing ?? nearestRing;
        if (chosenRing) {
          targetX = chosenRing.pos.x;
          targetY = chosenRing.pos.y;
          compassColor = missedRing ? 0xf97316 : 0xfacc15;
          compassEmissive = missedRing ? 0xea580c : 0xca8a04;
        }
      }
    }

    this.hintCompassGroup.visible = true;
    const bobOffset = Math.sin(this.elapsedLevelTime * 5.0) * 0.1;
    this.hintCompassGroup.position.set(
      px,
      py + this.ballRadius + 0.92 + bobOffset,
      0
    );

    const angle = Math.atan2(targetY - py, targetX - px);
    this.hintCompassGroup.rotation.z = angle;
    this.hintCompassGroup.rotation.x = this.elapsedLevelTime * 2.5;
    this.hintCompassMat.color.setHex(compassColor);
    this.hintCompassMat.emissive.setHex(compassEmissive);
  }

  private updatePhysics(delta: number) {
    this.elapsedLevelTime += delta;
    this.hudSyncTimer += delta;
    if (this.hudSyncTimer >= 0.25) {
      this.hudSyncTimer = 0;
      this.broadcastHud();
    }

    if (this.toastTimer > 0) {
      this.toastTimer -= delta;
      if (this.toastTimer <= 0) {
        this.toastMessage = null;
        this.broadcastHud();
      }
    }

    if (this.stageIntroTimer > 0) {
      this.stageIntroTimer -= delta;
      if (this.stageIntroTimer <= 0) {
        this.stageIntroTimer = 0;
        this.broadcastHud();
      }
    }

    if (this.starInvincibleTimer > 0) {
      this.starInvincibleTimer -= delta;
      this.trailRainbowHue = (this.trailRainbowHue + delta * 3.5) % 1.0;
      this.ballMaterial.color.setHSL(this.trailRainbowHue, 0.95, 0.65);
      this.ballMaterial.emissive.setHSL(this.trailRainbowHue, 1.0, 0.5);
      this.ballMaterial.emissiveIntensity = 0.85;
      this.ballMaterial.needsUpdate = true;

      this.starChimeAudioTimer += delta;
      if (this.starChimeAudioTimer >= 0.42) {
        this.starChimeAudioTimer = 0;
        soundFX.playStarChimeLoop();
      }
    } else {
      this.starChimeAudioTimer = 0;
      this.applyBallSkinAppearance();
    }

    if (this.isPopping) {
      this.popTimer -= delta;
      if (this.popTimer <= 0) {
        this.isPopping = false;
        this.finishPlayerHitRespawn();
      }
      return;
    }

    if (this.coyoteTimer > 0) this.coyoteTimer -= delta;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= delta;

    // 1. Update Moving Brick Bridges, Spikes, Moving Jacks, and 3D Water Waves
    for (const b of this.blocks) {
      b.prevX = b.mesh.position.x;
      b.prevY = b.mesh.position.y;
      if (b.def.moveAxis && b.def.moveRange && b.def.moveSpeed) {
        const offset =
          Math.sin(
            this.elapsedLevelTime * b.def.moveSpeed + (b.def.movePhase ?? 0)
          ) * b.def.moveRange;
        if (b.def.moveAxis === 'x') {
          b.mesh.position.x = b.baseX + offset;
        } else {
          b.mesh.position.y = b.baseY + offset;
        }
        const halfW = b.def.w / 2;
        const halfH = b.def.h / 2;
        const halfD = (b.def.d ?? 3.4) / 2;
        const bz = b.def.z ?? 0;
        b.box.min.set(
          b.mesh.position.x - halfW,
          b.mesh.position.y - halfH,
          bz - halfD
        );
        b.box.max.set(
          b.mesh.position.x + halfW,
          b.mesh.position.y + halfH,
          bz + halfD
        );
      }

      if (b.def.isFragileIce && !b.isShattered) {
        const isStandingOn =
          this.isGrounded &&
          Math.abs(this.ballPosition.x - b.mesh.position.x) <= b.def.w / 2 + this.ballRadius &&
          Math.abs(this.ballPosition.y - this.ballRadius - b.box.max.y) < 0.28;

        if (isStandingOn) {
          b.crackTimer = (b.crackTimer || 0) + delta;
          if (b.crackTimer >= 0.8 && b.mesh.material) {
            const mat = b.mesh.material as THREE.MeshStandardMaterial;
            mat.color.setHex(0xe0f2fe);
            mat.emissive.setHex(0x38bdf8);
            mat.emissiveIntensity = 0.35 + Math.sin(this.elapsedLevelTime * 25) * 0.25;
            mat.needsUpdate = true;
          }
          if (b.crackTimer >= 2.0) {
            b.isShattered = true;
            b.mesh.visible = false;
            b.box.min.set(-999, -999, -999);
            b.box.max.set(-999, -999, -999);
            this.spawnBurstParticles(b.mesh.position, 0xbae6fd, 0xffffff, 20, 1.4);
            soundFX.playPop();
            this.triggerScreenShake(0.3, 0.35);
            this.showToast('❄️ Es Pecah & Runtuh!');
          }
        } else {
          if (b.crackTimer && b.crackTimer > 0) {
            b.crackTimer = Math.max(0, b.crackTimer - delta * 1.5);
          }
        }
      }
    }

    for (const s of this.spikes) {
      if (s.def.moveAxis && s.def.moveRange && s.def.moveSpeed) {
        const offset =
          Math.sin(
            this.elapsedLevelTime * s.def.moveSpeed + (s.def.movePhase ?? 0)
          ) * s.def.moveRange;
        if (s.def.moveAxis === 'x') {
          s.pos.x = s.baseX + offset;
        } else {
          s.pos.y = s.baseY + offset;
        }
        s.group.position.copy(s.pos);
      }
    }

    for (const jack of this.jacks) {
      const offset =
        Math.sin(
          this.elapsedLevelTime * jack.def.moveSpeed +
            (jack.def.movePhase ?? 0)
        ) * jack.def.moveRange;
      if (jack.def.moveAxis === 'x') {
        jack.pos.x = jack.baseX + offset;
      } else {
        jack.pos.y = jack.baseY + offset;
      }
      jack.group.position.copy(jack.pos);
      jack.group.rotation.z -= delta * 3.2;
      jack.group.rotation.y += delta * 1.8;
    }

    // Update Polar Bears (Swipe Attack vs Hit-Stun Recoil Animation)
    for (const bear of this.polarBears) {
      if (bear.isStunned) {
        bear.stunTimer -= delta;
        // Hit-Stun recoil animation: bear tilts backward 22 degrees, arm lowers, flashes yellow-white
        bear.group.rotation.z = THREE.MathUtils.lerp(bear.group.rotation.z, 0.38, delta * 12);
        bear.rightArmGroup.rotation.z = THREE.MathUtils.lerp(bear.rightArmGroup.rotation.z, -0.85, delta * 12);
        bear.furMat.emissive.setHex(0xfef08a);
        bear.furMat.emissiveIntensity = 0.65 * (0.5 + 0.5 * Math.sin(bear.stunTimer * 25));
        bear.furMat.needsUpdate = true;

        if (bear.stunTimer <= 0) {
          bear.isStunned = false;
          bear.group.rotation.z = 0;
          bear.furMat.emissive.setHex(0x000000);
          bear.furMat.emissiveIntensity = 0;
          bear.furMat.needsUpdate = true;
        }
      } else {
        bear.group.rotation.z = THREE.MathUtils.lerp(bear.group.rotation.z, 0, delta * 8);
        const distToPlayer = Math.abs(this.ballPosition.x - bear.pos.x);
        if (distToPlayer < 6.5) {
          // Player in swipe range: animate periodic swipe motion
          bear.swipeTimer += delta * 7.0;
          bear.rightArmGroup.rotation.z = Math.sin(bear.swipeTimer) * 0.9;
        } else {
          // Idle breathing
          bear.rightArmGroup.rotation.z = THREE.MathUtils.lerp(bear.rightArmGroup.rotation.z, 0, delta * 4);
          bear.group.position.y = bear.baseY + Math.sin(this.elapsedLevelTime * 2.5) * 0.06;
        }
      }
    }

    // Update 3D Rolling Snowballs (Realistic Physics: Spawning at mountain summit, gravity drop, rolling across arena, shattering into debris on impact)
    for (const sb of this.snowballs) {
      if (sb.isShattered) {
        sb.shatterTimer -= delta;
        if (sb.shatterTimer <= 0) {
          sb.pos.copy(sb.startPos);
          sb.velocity.set(0, 0);
          sb.isShattered = false;
          sb.currentOpacity = 0.0;
          sb.currentScale = 0.6;
          sb.snowMat.opacity = 0.0;
          sb.ballMesh.scale.setScalar(0.6);
          sb.group.visible = true;
          this.triggerScreenShake(0.3, 0.35);
        }
        continue;
      }

      // Smoothly fade in and scale up as it rolls from behind summit peak (off-screen)
      if (sb.currentOpacity < 1.0) {
        sb.currentOpacity = Math.min(1.0, sb.currentOpacity + delta * 2.2);
        sb.currentScale = Math.min(1.0, sb.currentScale + delta * 1.5);
        sb.snowMat.opacity = sb.currentOpacity;
        sb.ballMesh.scale.setScalar(sb.currentScale);
      }

      // Apply Gravity and Rolling Velocity
      sb.velocity.y += this.GRAVITY * 0.85 * delta;
      const dirMult = sb.def.direction === 'right' ? 1 : -1;
      const targetRollSpeed = sb.def.moveSpeed * 1.5;
      sb.velocity.x = THREE.MathUtils.lerp(sb.velocity.x, dirMult * targetRollSpeed, delta * 3.0);

      sb.pos.x += sb.velocity.x * delta;
      sb.pos.y += sb.velocity.y * delta;

      // Ground / Slope collision detection
      let groundY = -10;
      for (const s of this.slopes) {
        const sd = s.def;
        if (sb.pos.x >= sd.x - 0.3 && sb.pos.x <= sd.x + sd.w + 0.3) {
          const relX = THREE.MathUtils.clamp((sb.pos.x - sd.x) / sd.w, 0, 1);
          const slopeY = sd.dir === 'up-right' ? sd.y + relX * sd.h : sd.y + (1 - relX) * sd.h;
          if (slopeY <= sb.pos.y + sb.radius + 1.2 && slopeY > groundY) {
            groundY = slopeY;
          }
        }
      }
      for (const b of this.blocks) {
        const bd = b.def;
        if (sb.pos.x >= bd.x && sb.pos.x <= bd.x + bd.w) {
          const blockTop = bd.y + bd.h;
          if (blockTop <= sb.pos.y + sb.radius + 1.2 && blockTop > groundY) {
            groundY = blockTop;
          }
        }
      }

      if (groundY > -10 && sb.pos.y <= groundY + sb.radius) {
        sb.pos.y = groundY + sb.radius;
        sb.velocity.y = 0;
        if (Math.random() < 0.2) {
          this.spawnLandingDust(new THREE.Vector3(sb.pos.x, groundY + 0.05, sb.pos.z), 1);
        }
      }

      // Check if snowball hit a wall, edge, or fell into abyss
      const hitWall = Math.abs(sb.pos.x - sb.summitPos.x) > (sb.def.moveRange || 25);
      const fellInAbyss = sb.pos.y < -4;

      if (hitWall || fellInAbyss) {
        // Shatter into snow/ice debris particles
        this.spawnBurstParticles(sb.pos, 0xffffff, 0xbae6fd, 18, 1.6);
        sb.isShattered = true;
        sb.shatterTimer = 1.0; // Respawn at summit after 1 second
        sb.group.visible = false;
        continue;
      }

      sb.group.position.copy(sb.pos);

      // Rolling rotation around Z and X
      const moveStep = sb.velocity.x * delta;
      sb.ballMesh.rotation.z -= moveStep / sb.radius;
      sb.ballMesh.rotation.x += Math.abs(moveStep) * 0.32;
    }

    // Animate Stage 33 Raja Gletser (Eternal Ice King Boss) if present
    if (this.iceBossGroup) {
      this.iceBossGroup.position.y =
        this.iceBossGroup.userData.baseY +
        Math.sin(this.elapsedLevelTime * 2.2) * 0.35;
      this.iceBossGroup.rotation.y =
        Math.sin(this.elapsedLevelTime * 1.5) * 0.22;
    }

    // Animate 3D water surface waves
    for (let i = 0; i < this.waterZones.length; i++) {
      const wz = this.waterZones[i];
      wz.surfaceMesh.position.y =
        wz.surfaceY + Math.sin(this.elapsedLevelTime * 3.2 + i) * 0.06;
      wz.surfaceMesh.rotation.z =
        Math.sin(this.elapsedLevelTime * 2.2 + i) * 0.012;
    }

    // 2. Strict 1:1 Arcade Bounce Horizontal Acceleration, Friction & Slope Slide
    const P = this.CLASSIC_PHYSICS;
    const inputDir = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);

    if (inputDir !== 0) {
      const baseAccel = this.isGrounded
        ? (this.isOnIce ? P.MOVE_ACCEL_GROUND * 0.18 : P.MOVE_ACCEL_GROUND)
        : P.MOVE_ACCEL_AIR;
      const isReversing =
        this.ballVelocity.x !== 0 &&
        Math.sign(this.ballVelocity.x) !== inputDir;
      const effectiveAccel =
        (isReversing
          ? baseAccel * (this.isOnIce ? 1.15 : P.REVERSE_BRAKE_MULT)
          : baseAccel) * this.controlSensitivity;

      this.ballVelocity.x += inputDir * effectiveAccel * delta;

      // Spawn frost spray when counter-steering/skidding on slippery ice
      if (
        this.isGrounded &&
        this.isOnIce &&
        isReversing &&
        Math.abs(this.ballVelocity.x) > 4.0 &&
        Math.random() < 0.35
      ) {
        this.spawnBurstParticles(
          new THREE.Vector3(
            this.ballPosition.x,
            this.ballPosition.y - this.ballRadius + 0.05,
            0
          ),
          0xe0f2fe,
          0x7dd3fc,
          2,
          0.3
        );
      }

      // Slope downhill boost vs standard roll speed cap
      const isRollingDownSlope =
        this.isGrounded &&
        this.activeSlopeDir !== 0 &&
        this.activeSlopeDir === inputDir;
      const maxSpeedCap = isRollingDownSlope
        ? P.MAX_SLOPE_SPEED * (this.isOnIce ? 1.42 : 1)
        : this.currentSpeed * (this.isOnIce ? 1.3 : 1);

      this.ballVelocity.x = THREE.MathUtils.clamp(
        this.ballVelocity.x,
        -maxSpeedCap,
        maxSpeedCap
      );
    } else {
      // Natural Arcade Bounce linear friction coast-to-stop (plus gravity slide on 45° slopes)
      if (this.isGrounded && this.activeSlopeDir !== 0) {
        this.ballVelocity.x +=
          this.activeSlopeDir *
          P.SLOPE_SLIDE_ACCEL *
          (this.isOnIce ? 1.55 : 1) *
          delta;
        this.ballVelocity.x = THREE.MathUtils.clamp(
          this.ballVelocity.x,
          -P.MAX_SLOPE_SPEED * 1.4,
          P.MAX_SLOPE_SPEED * 1.4
        );
      } else {
        const frictionDecel = this.isGrounded
          ? this.isOnIce
            ? P.GROUND_FRICTION_DECEL * 0.015
            : P.GROUND_FRICTION_DECEL
          : P.AIR_DRAG_DECEL;
        const stepDecel = frictionDecel * delta;
        if (Math.abs(this.ballVelocity.x) <= stepDecel) {
          this.ballVelocity.x = 0;
        } else {
          this.ballVelocity.x -= Math.sign(this.ballVelocity.x) * stepDecel;
        }
      }
    }

    // 3. Proportional Submerged Water Buoyancy & Surface Ripple (BIG floats, NORMAL sinks)
    this.isInWater = false;
    this.canWaterJump = false;
    let submergedRatio = 0;
    let activeWaterSurfaceY = 0;

    for (const water of this.waterZones) {
      const withinX =
        this.ballPosition.x + this.ballRadius * 0.5 >= water.box.min.x &&
        this.ballPosition.x - this.ballRadius * 0.5 <= water.box.max.x;
      if (!withinX) continue;

      const ballBottom = this.ballPosition.y - this.ballRadius;
      const ballTop = this.ballPosition.y + this.ballRadius;

      if (ballBottom < water.surfaceY && ballTop > water.box.min.y) {
        this.isInWater = true;
        activeWaterSurfaceY = water.surfaceY;
        const submergedDepth = THREE.MathUtils.clamp(
          water.surfaceY - ballBottom,
          0,
          this.ballRadius * 2
        );
        submergedRatio = Math.max(
          submergedRatio,
          submergedDepth / (this.ballRadius * 2)
        );
      }

      if (
        this.ballType === 'BIG' &&
        ballBottom <= water.surfaceY + 0.35 &&
        ballTop >= water.box.min.y
      ) {
        this.canWaterJump = true;
      }
    }

      if (this.isInWater && !this.wasInWater && this.ballVelocity.y < -5.0) {
      this.spawnBurstParticles(this.ballPosition, 0x38bdf8, 0xe0f2fe, 8, 0.8);
      soundFX.playWaterSplash();
    }
    this.wasInWater = this.isInWater;

    if (this.isInWater) {
      this.waterRippleMesh.visible = true;
      this.waterRippleMesh.position.set(
        this.ballPosition.x,
        activeWaterSurfaceY + 0.09,
        0
      );
      const pulse = 1 + Math.sin(this.elapsedLevelTime * 6) * 0.18;
      this.waterRippleMesh.scale.setScalar(this.ballRadius * 1.45 * pulse);
      this.waterRippleMat.opacity = 0.55;

      if (this.ballType === 'BIG') {
        const upwardAccel =
          P.WATER_BUOYANCY_ACCEL_BIG * (1.85 * submergedRatio - 0.52);
        this.ballVelocity.y += upwardAccel * delta;
        this.ballVelocity.y *= Math.pow(0.16, delta);
      } else {
        // NORMAL small ball sinks steadily to the pool bottom with capped terminal sink speed
        this.ballVelocity.y += P.WATER_SINK_ACCEL_NORMAL * delta;
        if (this.ballVelocity.y < P.WATER_MAX_SINK_SPEED) {
          this.ballVelocity.y = P.WATER_MAX_SINK_SPEED;
        }
      }

      // Hydrodynamic horizontal drag in water
      const waterDrag = P.WATER_HORIZONTAL_DRAG * delta;
      if (!this.keys.left && !this.keys.right) {
        if (Math.abs(this.ballVelocity.x) <= waterDrag) {
          this.ballVelocity.x = 0;
        } else {
          this.ballVelocity.x -= Math.sign(this.ballVelocity.x) * waterDrag;
        }
      } else {
        this.ballVelocity.x = THREE.MathUtils.clamp(
          this.ballVelocity.x,
          -this.currentSpeed * 0.78,
          this.currentSpeed * 0.78
        );
      }
    } else {
      this.waterRippleMesh.visible = false;
      this.ballVelocity.y += this.currentGravity * delta;
      if (this.ballVelocity.y < this.currentMaxFallSpeed) {
        this.ballVelocity.y = this.currentMaxFallSpeed;
      }
    }

    // 4. 6-Substep Collision Resolution (1:1 Nokia Bounce Multi-Hop Rebound & Slope Normals)
    const subSteps = 6;
    const subDelta = delta / subSteps;

    for (let step = 0; step < subSteps; step++) {
      this.ballPosition.addScaledVector(this.ballVelocity, subDelta);
      this.isGrounded = false;
      this.isOnIce = false;
      this.activeSlopeDir = 0;

      // 4A. Solid Brick Blocks, Blue Rubber Bouncy Blocks, and Locked Exit Door
      const totalBlocks =
        this.blocks.length + (!this.exitUnlocked && this.exitDoor ? 1 : 0);
      for (let idx = 0; idx < totalBlocks; idx++) {
        const isDoor = idx === this.blocks.length;
        const box = isDoor ? this.exitDoor!.box : this.blocks[idx].box;
        const rBlock = isDoor ? null : this.blocks[idx];

        box.clampPoint(this.ballPosition, _closestPoint);
        _closestPoint.z = this.ballPosition.z;

        _diff.subVectors(this.ballPosition, _closestPoint);
        const distance = _diff.length();

        if (distance <= this.ballRadius + 0.05) {
          if (distance === 0) {
            _normal.set(0, 1, 0);
          } else {
            _normal.copy(_diff).normalize();
          }

          if (distance < this.ballRadius) {
            const penetrationDepth = this.ballRadius - distance;
            this.ballPosition.addScaledVector(_normal, penetrationDepth);

            const dot = this.ballVelocity.dot(_normal);
            if (dot < 0) {
              const impactSpeed = -dot;
              const isBouncyTop =
                Boolean(rBlock?.def.isBouncy) && _normal.y > 0.5;

              if (isBouncyTop) {
                const minLaunch =
                  this.ballType === 'BIG'
                    ? P.BOUNCY_FLOOR_MIN_LAUNCH_BIG
                    : P.BOUNCY_FLOOR_MIN_LAUNCH_NORMAL;
                const trampolineSpeed = Math.max(
                  impactSpeed * P.BOUNCY_FLOOR_RESTITUTION,
                  minLaunch
                );
                this.ballVelocity.addScaledVector(_normal, -dot);
                this.ballVelocity.y = trampolineSpeed;
                this.squashY = 1.45;
                this.squashX = 0.68;
                this.spawnLandingDust(this.ballPosition, 7);
                soundFX.playBounce(1.3, trampolineSpeed);
              } else if (_normal.y > 0.35) {
                // Top brick floor collision: authentic multi-hop rebound
                this.lastImpactSpeedY = impactSpeed;
                const reboundVel = impactSpeed * this.ballRestitution;
                const rest =
                  reboundVel >= P.MIN_REBOUND_VELOCITY
                    ? this.ballRestitution
                    : 0;
                this.ballVelocity.addScaledVector(_normal, -(1 + rest) * dot);

                if (impactSpeed > 2.8) {
                  this.spawnLandingDust(this.ballPosition, 5);
                  soundFX.playBounce(
                    this.ballType === 'BIG' ? 0.7 : 1,
                    impactSpeed
                  );
                  const squashIntensity = THREE.MathUtils.clamp(
                    impactSpeed / 18,
                    0.12,
                    0.36
                  );
                  this.squashY = 1 - squashIntensity;
                  this.squashX = 1 + squashIntensity;
                }
              } else if (_normal.y < -0.35) {
                // Ceiling brick collision: crisp downward rebound
                this.ballVelocity.addScaledVector(
                  _normal,
                  -(1 + P.RESTITUTION_CEILING) * dot
                );
                if (impactSpeed > 3.8) {
                  soundFX.playSurfaceBump(impactSpeed);
                }
              } else {
                // Vertical brick wall collision: subtle horizontal rebound
                const wallRest =
                  impactSpeed > 3.0 ? P.RESTITUTION_WALL : 0;
                this.ballVelocity.addScaledVector(
                  _normal,
                  -(1 + wallRest) * dot
                );
                if (impactSpeed > 3.8) {
                  soundFX.playSurfaceBump(impactSpeed);
                }
              }
            }
          }

          if (_normal.y > 0.3) {
            this.isGrounded = true;
            this.coyoteTimer = 0.11;
            if (
              rBlock &&
              (rBlock.def.isIce || this.currentBlueprint.biome === 'ICE') &&
              !rBlock.def.isBouncy
            ) {
              this.isOnIce = true;
            }
            if (step === 0 && rBlock && rBlock.def.moveAxis) {
              this.ballPosition.x += rBlock.mesh.position.x - rBlock.prevX;
              this.ballPosition.y += rBlock.mesh.position.y - rBlock.prevY;
            }
          }
        }
      }

      // 4B. 45-Degree Slopes / Ramps (with Downhill Gravity Slide Direction)
      for (const s of this.slopes) {
        const sd = s.def;
        const px = this.ballPosition.x;
        const py = this.ballPosition.y;

        if (
          px + this.ballRadius < sd.x ||
          px - this.ballRadius > sd.x + sd.w ||
          py + this.ballRadius < sd.y ||
          py - this.ballRadius > sd.y + sd.h
        ) {
          continue;
        }

        const v0x = sd.x;
        const v0y = sd.y;
        const v1x = sd.x + sd.w;
        const v1y = sd.y;
        const v2x = sd.dir === 'up-right' ? sd.x + sd.w : sd.x;
        const v2y = sd.y + sd.h;

        let minDistSq = Infinity;
        let bestX = px;
        let bestY = py;

        const edges = [
          [v0x, v0y, v1x, v1y],
          [v1x, v1y, v2x, v2y],
          [v2x, v2y, v0x, v0y],
        ];
        for (const [ax, ay, bx, by] of edges) {
          closestPointOnSegment2D(px, py, ax, ay, bx, by, _closest2D);
          const dx = px - _closest2D.x;
          const dy = py - _closest2D.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < minDistSq) {
            minDistSq = dSq;
            bestX = _closest2D.x;
            bestY = _closest2D.y;
          }
        }

        const inside = pointInRightTriangle2D(
          px,
          py,
          sd.x,
          sd.y,
          sd.w,
          sd.h,
          sd.dir
        );
        const dist = Math.sqrt(minDistSq);

        if (inside || dist <= this.ballRadius + 0.04) {
          let nx = px - bestX;
          let ny = py - bestY;
          const len = Math.hypot(nx, ny);
          if (len > 0.0001) {
            nx /= len;
            ny /= len;
            if (inside) {
              nx = -nx;
              ny = -ny;
            }
          } else {
            nx = sd.dir === 'up-right' ? -0.7071 : 0.7071;
            ny = 0.7071;
          }

          const pen = inside ? this.ballRadius + dist : this.ballRadius - dist;
          if (pen > 0) {
            this.ballPosition.x += nx * pen;
            this.ballPosition.y += ny * pen;

            const dot = this.ballVelocity.x * nx + this.ballVelocity.y * ny;
            if (dot < 0) {
              const impactSpeed = -dot;
              this.lastImpactSpeedY = Math.max(
                this.lastImpactSpeedY,
                impactSpeed * ny
              );
              const rest =
                impactSpeed * this.ballRestitution * 0.65 >=
                P.MIN_REBOUND_VELOCITY
                  ? this.ballRestitution * 0.65
                  : 0;
              this.ballVelocity.x -= (1 + rest) * dot * nx;
              this.ballVelocity.y -= (1 + rest) * dot * ny;
              if (impactSpeed > 4.2) {
                soundFX.playSurfaceBump(impactSpeed);
              }
            }
          }

          if (ny > 0.25) {
            this.isGrounded = true;
            this.coyoteTimer = 0.11;
            if (this.currentBlueprint.biome === 'ICE') {
              this.isOnIce = true;
            }
            // 'up-right' slopes down to the left (-1); 'up-left' slopes down to the right (+1)
            this.activeSlopeDir = sd.dir === 'up-right' ? -1 : 1;
          }
        }
      }
    }

    if (this.jumpBufferTimer > 0 || this.keys.jump) {
      this.tryExecuteJump();
    }

    // 5. Check Fall Into Abyss
    if (this.ballPosition.y < -10) {
      this.triggerPlayerHit();
      return;
    }

    this.ball.position.copy(this.ballPosition);

    // Spawn 3D Motion Trail Spheres when moving fast
    const totalSpeed = this.ballVelocity.length();
    if (totalSpeed > 7.5) {
      this.trailSpawnTimer -= delta;
      if (this.trailSpawnTimer <= 0) {
        this.trailSpawnTimer = 0.032;
        this.spawnTrailSphere();
      }
    }

    // 6. Elastic Squash & Stretch Recovery
    this.squashX = THREE.MathUtils.lerp(this.squashX, 1.0, delta * 12);
    this.squashY = THREE.MathUtils.lerp(this.squashY, 1.0, delta * 12);
    this.ball.scale.set(
      this.ballRadius * this.squashX,
      this.ballRadius * this.squashY,
      this.ballRadius * this.squashX
    );

    const rotationAngle = (this.ballVelocity.x * delta) / this.ballRadius;
    this.ball.rotation.z -= rotationAngle;

    // 7. Pass Through Static Gold Ring Hoops (Vertical & Horizontal)
    for (const ring of this.rings) {
      if (!ring.collected) {
        if (this.ballPosition.distanceTo(ring.pos) < this.ballRadius + 0.85) {
          ring.collected = true;
          ring.mat.color.setHex(0xfde047);
          ring.mat.emissive.setHex(0xf59e0b);
          ring.mat.emissiveIntensity = 0.25;
          ring.mat.transparent = true;
          ring.mat.opacity = 0.32;
          ring.mat.needsUpdate = true;

          this.spawnBurstParticles(
            ring.pos,
            0xfacc15,
            0xfef08a,
            8,
            1.4
          );
          this.collectedRings++;
          this.score += 500;
          const isFinalRing = this.collectedRings >= this.totalRings;
          soundFX.playRingCollect(isFinalRing);
          this.broadcastHud();

          if (isFinalRing) {
            this.unlockExitGate();
            this.spawnBurstParticles(ring.pos, 0xfde047, 0xffffff, 32, 2.2);
            soundFX.playFinalRingFanfare();
          }
        }
      }
    }

    // 7B. Collect Extra Life Orbs
    for (const orb of this.lifeOrbs) {
      if (!orb.collected) {
        orb.halo.rotation.x += delta * 2.5;
        orb.halo.rotation.y += delta * 3.2;
        orb.group.position.y =
          orb.pos.y + Math.sin(this.elapsedLevelTime * 3.5) * 0.22;

        if (
          this.ballPosition.distanceTo(orb.group.position) <
          this.ballRadius + 0.75
        ) {
          orb.collected = true;
          this.levelGroup.remove(orb.group);
          this.lives = Math.min(this.lives + 1, 5);
          this.score += 1000;
          soundFX.playWinTune();
          this.spawnBurstParticles(
            orb.group.position,
            0xef4444,
            0xfde047,
            12,
            1.4
          );
          this.showToast(TRANSLATIONS[this.lang].toastExtraLife);
        }
      }
    }

    // 7C. Collect Wooden Crates (Star Invincibility - 30 Seconds!)
    for (const crate of this.crates) {
      if (!crate.collected) {
        crate.group.rotation.y += delta * 1.5;
        if (
          this.ballPosition.distanceTo(crate.pos) <
          this.ballRadius + 0.85
        ) {
          crate.collected = true;
          this.levelGroup.remove(crate.group);
          this.starInvincibleTimer = 30.0;
          this.spawnBurstParticles(crate.pos, 0x92400e, 0xfacc15, 22, 1.6);
          soundFX.playWinTune();
          this.triggerScreenShake(0.35, 0.35);
          this.showToast('⭐ Bintang Kebal Aktif (30 Detik)!');
        }
      }
    }

    // 8. Classic Inflator & Deflator Pump Stations
    if (this.pumpCooldown > 0) this.pumpCooldown -= delta;

    for (const pump of this.pumps) {
      if (
        this.pumpCooldown <= 0 &&
        this.ballPosition.distanceTo(pump.pos) < this.ballRadius + 0.82
      ) {
        const targetType: BallType =
          pump.type === 'INFLATE' ? 'BIG' : 'NORMAL';
        if (targetType !== this.ballType) {
          this.pumpCooldown = 0.75;
          this.setBallState(pump.type, true);
          soundFX.playPump(pump.type === 'INFLATE');
        }
      }
    }

    // 9. Checkpoints
    for (const cp of this.checkpoints) {
      cp.crystalMesh.rotation.y += delta * 2.2;
      cp.haloMesh.rotation.x += delta * 1.8;
      cp.haloMesh.rotation.y += delta * 2.4;

      if (
        !cp.activated &&
        this.ballPosition.distanceTo(cp.pos) < 1.75
      ) {
        cp.activated = true;
        this.checkpointPosition.copy(this.ballPosition);
        this.checkpointBallType = this.ballType;
        cp.crystalMat.color.setHex(0x22c55e);
        cp.crystalMat.emissive.setHex(0x16a34a);
        this.spawnBurstParticles(cp.pos, 0x22c55e, 0xfde047, 10, 1.4);
        this.score += 300;
        soundFX.playCheckpoint();
        this.showToast(TRANSLATIONS[this.lang].toastCheckpoint);
      }
    }

    // 10. Authentic Moving Jacks & 3D Rolling Snowballs Collision (Pops Ball on Contact unless Star Invincible)
    // 10. Authentic Moving Jacks, 3D Rolling Snowballs, & Polar Bear Collision
    for (const jack of this.jacks) {
      if (
        this.ballPosition.distanceTo(jack.pos) <
        0.68 + this.ballRadius * 0.8
      ) {
        if (this.starInvincibleTimer > 0) {
          this.spawnBurstParticles(jack.pos, 0xfacc15, 0xffffff, 16, 1.5);
          jack.pos.y = -100;
          jack.group.visible = false;
          soundFX.playWinTune();
          this.showToast('⭐ Bintang Kebal Menghancurkan Bintang Duri!');
          this.triggerScreenShake(0.3, 0.3);
          continue;
        }
        this.triggerPlayerHit();
        return;
      }
    }

    for (const sb of this.snowballs) {
      if (sb.currentOpacity < 0.35 || sb.isShattered) continue;
      if (
        this.ballPosition.distanceTo(sb.pos) <
        sb.radius * sb.currentScale + this.ballRadius * 0.82
      ) {
        if (this.starInvincibleTimer > 0) {
          this.spawnBurstParticles(sb.pos, 0xfacc15, 0xffffff, 18, 1.6);
          sb.isShattered = true;
          sb.shatterTimer = 1.0;
          sb.group.visible = false;
          soundFX.playWinTune();
          this.showToast('⭐ Bintang Kebal Menghancurkan Bola Salju!');
          this.triggerScreenShake(0.35, 0.35);
          continue;
        }
        this.spawnBurstParticles(sb.pos, 0xffffff, 0xbae6fd, 14, 1.4);
        this.triggerPlayerHit();
        return;
      }
    }

    // 10B. Polar Bear Enemies Collision & Hit-Stun Recoil
    for (const bear of this.polarBears) {
      const dist = this.ballPosition.distanceTo(bear.pos);
      if (dist < 1.4 + this.ballRadius * 0.85) {
        if (this.starInvincibleTimer > 0) {
          bear.isStunned = true;
          bear.stunTimer = 2.0;
          this.spawnBurstParticles(bear.pos, 0xfacc15, 0xffffff, 22, 1.8);
          soundFX.playBearHitStun();
          this.triggerScreenShake(0.35, 0.35);
          this.showToast('⭐ Beruang Kutub Terkena Hit-Stun!');
          this.ballVelocity.x = Math.sign(this.ballVelocity.x || 1) * 8.5;
          this.ballVelocity.y = 6.5;
        } else if (!bear.isStunned) {
          this.triggerPlayerHit();
          return;
        }
      }
    }

    // 11. Floor & Inverted Ceiling Spikes (Needles) Collision
    for (const spike of this.spikes) {
      const halfSpan = ((spike.def.count ?? 3) - 1) * 0.34 + 0.32;
      const dx = Math.abs(this.ballPosition.x - spike.pos.x);
      const dy = this.ballPosition.y - spike.pos.y;
      if (dx < halfSpan + this.ballRadius * 0.75) {
        let hitSpike = false;
        if (spike.def.inverted) {
          if (dy <= 0.2 && dy > -(0.85 + this.ballRadius * 0.75)) hitSpike = true;
        } else {
          if (dy >= -0.2 && dy < 0.85 + this.ballRadius * 0.75) hitSpike = true;
        }
        if (hitSpike) {
          if (this.starInvincibleTimer > 0) {
            this.spawnBurstParticles(spike.pos, 0xfacc15, 0xffffff, 14, 1.4);
            spike.pos.y = -100;
            spike.group.visible = false;
            soundFX.playWinTune();
            this.showToast('⭐ Bintang Kebal Melalui Duri!');
            this.triggerScreenShake(0.25, 0.25);
            continue;
          }
          this.triggerPlayerHit();
          return;
        }
      }
    }

    // 12. Exit Portal Ring
    if (this.exitUnlocked && this.exitRing) {
      const isLevel33 = this.currentBlueprint.levelNumber === 33;
      this.exitRing.rotation.z += delta * (isLevel33 ? 8.5 : 3.5);

      if (isLevel33 && Math.random() < 0.38) {
        this.spawnBurstParticles(this.exitRing.position, 0x38bdf8, 0xfde047, 4, 1.4);
      }

      if (this.ballPosition.distanceTo(this.exitRing.position) < (isLevel33 ? 1.75 : 1.5)) {
        if (isLevel33) {
          this.spawnBurstParticles(this.ballPosition, 0xfde047, 0xffffff, 50, 3.0);
          this.triggerScreenShake(0.7, 0.6);
        }
        this.winLevel();
      }
    }
  }

  private unlockExitGate() {
    this.exitUnlocked = true;
    if (this.exitDoor) {
      this.levelGroup.remove(this.exitDoor.mesh);
    }
    if (this.exitRing) {
      const mat = this.exitRing.material as THREE.MeshStandardMaterial;
      const isLevel33 = this.currentBlueprint.levelNumber === 33;
      mat.color.setHex(isLevel33 ? 0x38bdf8 : 0xffd700);
      mat.emissive.setHex(isLevel33 ? 0x0284c7 : 0xf59e0b);
      mat.emissiveIntensity = isLevel33 ? 1.2 : 0.75;
    }

    if (this.currentBlueprint.levelNumber === 33) {
      this.triggerScreenShake(0.65, 0.55);
      if (this.exitRing) {
        this.spawnBurstParticles(this.exitRing.position, 0xfde047, 0x38bdf8, 60, 3.2);
      }
      this.showToast('✨ Portal Kemenangan Abadi Terbuka! Masuki Portal!');
    } else {
      this.showToast(TRANSLATIONS[this.lang].toastExitOpened);
    }
  }

  private triggerPlayerHit() {
    if (this.isPopping) return;
    soundFX.playPop();
    this.isPopping = true;
    this.popTimer = 0.75;
    this.ball.visible = false;
    this.ballVelocity.set(0, 0, 0);
    this.spawnBurstParticles(this.ballPosition, 0xef4444, 0xfde047, 16, 1.5);
    this.showToast(TRANSLATIONS[this.lang].toastBallPopped);
  }

  private finishPlayerHitRespawn() {
    this.lives--;
    this.broadcastHud();

    if (this.lives <= 0) {
      this.gameState = 'GAMEOVER';
      this.callbacks.onStateChange(
        this.gameState,
        this.score,
        this.currentBlueprint.levelNumber
      );
    } else {
      this.setBallState(this.checkpointBallType, false);
      this.resetBallToPosition(this.checkpointPosition);
      this.showToast(TRANSLATIONS[this.lang].toastRespawned);
    }
  }

  private winLevel() {
    soundFX.playWinTune();
    this.score += 2500;

    // Record stage completion time (rounded to 0.1s)
    const stageNum = this.currentBlueprint.levelNumber;
    const clearTime = Math.max(0.1, Math.round(this.elapsedLevelTime * 10) / 10);
    const prevBest = this.bestTimes[stageNum];
    if (prevBest === undefined || clearTime < prevBest) {
      this.bestTimes[stageNum] = clearTime;
      this.isNewRecord = true;
      try {
        localStorage.setItem(
          'bounce_best_times',
          JSON.stringify(this.bestTimes)
        );
      } catch {
        // ignore storage errors
      }
    } else {
      this.isNewRecord = false;
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('bounce_high_score', String(this.highScore));
      } catch {
        // ignore storage errors
      }
    }

    const isFinalLevel = this.currentLevelIdx >= BOUNCE_LEVELS.length - 1;
    this.gameState = isFinalLevel ? 'ZONE_COMPLETE' : 'WIN';
    this.broadcastHud();
    this.callbacks.onStateChange(
      this.gameState,
      this.score,
      this.currentBlueprint.levelNumber
    );
  }

  /**
   * Dynamic 3D Camera with Velocity Look-Ahead, Speed/Height Z Zoom, and Subtle Roll Banking
   */
  private updateCamera(delta: number) {
    if (!this.ball) return;

    const desiredLookAhead = THREE.MathUtils.clamp(
      1.8 + this.ballVelocity.x * 0.16,
      -1.2,
      3.8
    );
    this.camLookAheadX = THREE.MathUtils.lerp(
      this.camLookAheadX,
      desiredLookAhead,
      delta * 4.5
    );

    const speedRatio = THREE.MathUtils.clamp(
      this.ballVelocity.length() / 22,
      0,
      1
    );
    const heightBoost = Math.max(0, this.ballPosition.y - 3.5) * 0.22;

    const targetCamX = this.ballPosition.x + this.camLookAheadX + 1.0;
    const targetCamY = Math.max(this.ballPosition.y + 2.3, 3.6);
    const targetCamZ = 10.5 + speedRatio * 1.4 + heightBoost;

    this.camera.position.x = THREE.MathUtils.lerp(
      this.camera.position.x,
      targetCamX,
      0.085
    );
    this.camera.position.y = THREE.MathUtils.lerp(
      this.camera.position.y,
      targetCamY,
      0.085
    );
    this.camera.position.z = THREE.MathUtils.lerp(
      this.camera.position.z,
      targetCamZ,
      0.075
    );

    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer -= delta;
      const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
    }

    this.camera.lookAt(
      this.ballPosition.x + this.camLookAheadX * 0.65,
      this.ballPosition.y + 0.5,
      0
    );

    // Subtle 3D banking tilt on horizontal velocity
    const targetRoll = THREE.MathUtils.clamp(
      -this.ballVelocity.x * 0.0022,
      -0.03,
      0.03
    );
    this.camera.rotation.z = THREE.MathUtils.lerp(
      this.camera.rotation.z,
      targetRoll,
      0.1
    );

    // Keep specular key light & directional shadow frustum tracking the ball
    this.ballKeyLight.position.set(
      this.ballPosition.x - 1.2,
      this.ballPosition.y + 2.4,
      3.2
    );

    this.dirLight.position.set(
      this.ballPosition.x + 20,
      this.ballPosition.y + 40,
      30
    );
    this.dirLight.target.position.set(
      this.ballPosition.x,
      this.ballPosition.y,
      0
    );
  }

  private computeContextualHint(): string {
    const t = TRANSLATIONS[this.lang];
    const bp = this.currentBlueprint;
    const px = this.ballPosition.x;
    const py = this.ballPosition.y;

    // 1. All Gold Hoops collected -> direct to Exit Portal
    if (this.exitUnlocked) {
      const distExit = Math.max(0, Math.round(bp.exitRingX - px));
      return t.hintFinishRight(distExit);
    }

    // 2. Check if an uncollected Gold Hoop was left behind to the left
    for (const r of this.rings) {
      if (!r.collected && r.pos.x < px - 5.0) {
        const distBack = Math.round(px - r.pos.x);
        return t.hintMissedRingLeft(distBack);
      }
    }

    // 3. Check if approaching a narrow 1-block brick corridor while BIG
    for (const b of this.blocks) {
      if (
        b.def.y >= 2.9 &&
        b.def.y <= 3.3 &&
        px >= b.def.x - 11 &&
        px <= b.def.x + b.def.w
      ) {
        if (this.ballType === 'BIG') {
          return t.hintDeflateAtPump;
        }
        return t.hintEnterNarrowGap;
      }
    }

    // 4. Check if near or inside a Water Pool
    for (const pool of bp.waterPools) {
      if (px >= pool.x - 8 && px <= pool.x + pool.width + 3) {
        const hasUnderwaterRings = this.rings.some(
          (r) =>
            !r.collected &&
            r.pos.x >= pool.x &&
            r.pos.x <= pool.x + pool.width &&
            r.pos.y < 0
        );
        if (hasUnderwaterRings) {
          return this.ballType === 'BIG'
            ? t.hintDeflateAndDive
            : t.hintDiveForRing;
        }
        return this.ballType === 'BIG'
          ? t.hintJumpOnWater
          : t.hintInflateAtPump;
      }
    }

    // 5. Check if near a Blue Rubber Bouncy Floor
    for (const b of this.blocks) {
      if (b.def.isBouncy && px >= b.def.x - 8 && px <= b.def.x + b.def.w + 4) {
        return t.hintBounceBlueRubber;
      }
    }

    // 6. Check if near a Moving Jack or Rolling Snowball
    for (const j of this.jacks) {
      if (px >= j.baseX - 9 && px <= j.baseX + 5) {
        return t.hintAvoidMovingJack;
      }
    }
    for (const sb of this.snowballs) {
      if (
        sb.currentOpacity >= 0.4 &&
        Math.abs(px - sb.pos.x) < 5.8 &&
        Math.abs(py - sb.pos.y) < 4.0
      ) {
        return this.lang === 'id'
          ? '❄️ Awas Bola Salju Menggelinding Menuruni Lereng!'
          : '❄️ Watch Out For Snowball Rolling Downhill!';
      }
    }

    // 7. Nearest uncollected Gold Hoop radar
    let nearestRing: RuntimeRing | null = null;
    let bestDist = Infinity;
    for (const r of this.rings) {
      if (!r.collected) {
        const d = Math.hypot(r.pos.x - px, r.pos.y - py);
        if (d < bestDist) {
          bestDist = d;
          nearestRing = r;
        }
      }
    }

    if (nearestRing) {
      const dx = Math.round(nearestRing.pos.x - px);
      const dy = nearestRing.pos.y - py;
      const dirKey =
        dy > 2.2 ? 'up' : dy < -2.0 ? 'down' : dx >= 0 ? 'right' : 'left';
      return t.hintNearestRing(Math.abs(dx), dirKey);
    }

    return t.hintCollectAllRings(this.totalRings);
  }

  public getIsNewRecord(): boolean {
    return this.isNewRecord;
  }

  public getBestTime(stageNum: number): number | null {
    return this.bestTimes[stageNum] ?? null;
  }

  private broadcastHud() {
    const bp = this.currentBlueprint;
    const stageLocale = TRANSLATIONS[this.lang].stages[bp.levelNumber];
    const progressPercent = THREE.MathUtils.clamp(
      Math.round((this.ballPosition.x / bp.exitRingX) * 100),
      0,
      100
    );

    const stageIntro: StageIntro | null =
      this.stageIntroTimer > 0
        ? {
            levelNumber: bp.levelNumber,
            title: stageLocale ? stageLocale.title : bp.title,
            subtitle: stageLocale ? stageLocale.subtitle : bp.subtitle,
            objective: TRANSLATIONS[this.lang].stageObjective(
              this.totalRings || bp.rings.length
            ),
            visible: true,
          }
        : null;

    const isZone11 = bp.levelNumber >= 11;
    this.callbacks.onHudUpdate({
      levelNumber: bp.levelNumber,
      biome: bp.biome,
      levelTitle: stageLocale ? stageLocale.title : bp.title,
      difficultyTag: bp.difficultyTag,
      lives: this.lives,
      score: this.score,
      highScore: this.highScore,
      collectedRings: this.collectedRings,
      totalRings: this.totalRings,
      ballType: this.ballType,
      exitUnlocked: this.exitUnlocked,
      progressPercent,
      toastMessage: this.toastMessage,
      canRevive: this.canRevive,
      graphicsMode: this.graphicsMode,
      hintEnabled: this.hintEnabled,
      activeHint: this.computeContextualHint(),
      stageIntro,
      elapsedTimeSec: Math.round(this.elapsedLevelTime * 10) / 10,
      bestTimeSec: this.bestTimes[bp.levelNumber] ?? null,
      isNewRecord: this.isNewRecord,
      hasShield: isZone11,
      hasSpeedBoost: isZone11,
      hasMagnet: isZone11,
      starInvincibleTimeLeftSec: Math.max(0, Math.ceil(this.starInvincibleTimer)),
    });
  }

  private controlSensitivity: number = (() => {
    try {
      const saved = parseFloat(localStorage.getItem('bounce_control_sensitivity') || '1');
      if (Number.isFinite(saved)) return Math.max(0.6, Math.min(1.5, saved));
    } catch {}
    return 1.0;
  })();

  public setControlSensitivity(mult: number) {
    this.controlSensitivity = Math.max(0.6, Math.min(1.5, mult));
    try {
      localStorage.setItem('bounce_control_sensitivity', String(this.controlSensitivity));
    } catch {}
  }

  public getControlSensitivity(): number {
    return this.controlSensitivity;
  }

  public getLives(): number {
    return this.lives;
  }

  public getElapsedLevelTime(): number {
    return Math.round(this.elapsedLevelTime * 10) / 10;
  }

  public getCollectedRings(): number {
    return this.collectedRings;
  }

  private setupAtmosphere(bp: LevelBlueprint) {
    // Crisp, vivid atmosphere for Classic, Jungle/Forest, and Realistic Glacial Ice Zone 3
    const skyColor =
      bp.biome === 'ICE'
        ? new THREE.Color(0x38bdf8)
        : new THREE.Color(0x38bdf8);
    if (bp.biome === 'ICE') {
      // Deep glacial arctic sky with crisp visibility
      skyColor.setHex(bp.levelNumber === 33 ? 0x0c4a6e : 0x0284c7);
    }
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(
      skyColor,
      bp.biome === 'JUNGLE' ? 0.009 : bp.biome === 'ICE' ? 0.0065 : 0.011
    );
    this.dappledLight.visible = bp.biome === 'JUNGLE';
    this.cloudGroups.forEach((c) => (c.visible = true));
  }

  private initLevelState() {
    this.blocks = [];
    this.slopes = [];
    this.jacks = [];
    this.snowballs = [];
    this.polarBears = [];
    this.iceBossGroup = null;
    this.lifeOrbs = [];
    this.crates = [];
    this.rings = [];
    this.spikes = [];
    this.pumps = [];
    this.waterZones = [];
    this.checkpoints = [];
    this.exitRing = null;
    this.exitDoor = null;
    this.exitUnlocked = false;
    this.collectedRings = 0;
    this.elapsedLevelTime = 0;
    this.isNewRecord = false;
    this.isPopping = false;
    this.popTimer = 0;
    this.canRevive = true;
  }

  private buildLevelObjects(bp: LevelBlueprint) {
    const isIceBiome = bp.biome === 'ICE';

    // 1. Build Brick / Bouncy / Jungle Grass / Realistic Crystalline Glacier Ice Blocks
    for (const bDef of bp.blocks) {
      const z = bDef.z ?? 0;
      const d = bDef.d ?? 3.4;
      const geo = new THREE.BoxGeometry(bDef.w, bDef.h, d);
      const isIceBlock = !bDef.isBouncy && (isIceBiome || Boolean(bDef.isIce));

      const tex = bDef.isBouncy
        ? this.bouncyBrickTex.clone()
        : bp.biome === 'JUNGLE'
        ? this.baseGrassTex.clone()
        : isIceBlock
        ? this.baseIceTex.clone()
        : this.baseBrickTex.clone();

      tex.colorSpace = THREE.SRGBColorSpace;
      if (!bDef.isBouncy && bp.biome === 'JUNGLE') {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(Math.max(1, bDef.w / 2), 1);
      } else if (isIceBlock) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(Math.max(1, bDef.w / 3.5), Math.max(0.5, bDef.h / 2.5));
      } else {
        tex.repeat.set(bDef.w / 2, bDef.h / 2);
      }
      tex.needsUpdate = true;

      const mat = isIceBlock
        ? new THREE.MeshPhysicalMaterial({
            map: tex,
            color: 0xe0f2fe,
            emissive: 0x0369a1,
            emissiveIntensity: 0.14,
            roughness: 0.06,
            metalness: 0.22,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            reflectivity: 0.95,
          })
        : new THREE.MeshStandardMaterial({
            map: tex,
            color: 0xffffff,
            roughness: bDef.isBouncy ? 0.25 : bp.biome === 'JUNGLE' ? 0.65 : 0.48,
            metalness: bDef.isBouncy ? 0.22 : bp.biome === 'JUNGLE' ? 0.02 : 0.06,
          });

      const mesh = new THREE.Mesh(geo, mat);
      const centerX = bDef.x + bDef.w / 2;
      const centerY = bDef.y + bDef.h / 2;
      mesh.position.set(centerX, centerY, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this.levelGroup.add(mesh);

      // Compute physics bounding box strictly from the core block before adding decorative caps/fences
      const box = new THREE.Box3().setFromObject(mesh);

      // Add smooth, non-spiky 3D bright green grass turf cushion on top of brown soil blocks in JUNGLE biome
      if (!bDef.isBouncy && bp.biome === 'JUNGLE') {
        const capHeight = Math.min(0.24, Math.max(0.14, bDef.h * 0.15));
        const capGeo = new THREE.BoxGeometry(bDef.w + 0.08, capHeight, d + 0.08);
        const capMat = new THREE.MeshStandardMaterial({
          color: 0x4ade80,
          roughness: 0.45,
          metalness: 0.02,
        });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.set(0, bDef.h / 2 - capHeight / 2 + 0.02, 0);
        capMesh.receiveShadow = true;
        mesh.add(capMesh);

        const topLawnGeo = new THREE.BoxGeometry(bDef.w - 0.06, 0.04, d - 0.06);
        const topLawnMat = new THREE.MeshStandardMaterial({
          color: 0x86efac,
          roughness: 0.4,
          metalness: 0.01,
        });
        const topLawnMesh = new THREE.Mesh(topLawnGeo, topLawnMat);
        topLawnMesh.position.set(0, bDef.h / 2 + 0.02, 0);
        topLawnMesh.receiveShadow = true;
        mesh.add(topLawnMesh);
      } else if (isIceBlock) {
        // Plush 3D Snow-Cap Ledge & Glossy Ice Rim on top of ICE blocks (inspired by 3D winter platformers)
        const capHeight = Math.min(0.26, Math.max(0.14, bDef.h * 0.15));
        const capGeo = new THREE.BoxGeometry(bDef.w + 0.1, capHeight, d + 0.1);
        const capMat = new THREE.MeshPhysicalMaterial({
          map: this.baseSnowTex,
          color: 0xffffff,
          emissive: 0xe0f2fe,
          emissiveIntensity: 0.12,
          roughness: 0.18,
          metalness: 0.08,
          clearcoat: 0.85,
        });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.set(0, bDef.h / 2 - capHeight / 2 + 0.03, 0);
        capMesh.receiveShadow = true;
        mesh.add(capMesh);

        // Specular icy mirror glaze strip on the top walking surface
        const glazeGeo = new THREE.BoxGeometry(bDef.w - 0.04, 0.04, d - 0.04);
        const glazeMat = new THREE.MeshPhysicalMaterial({
          color: 0xbae6fd,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.18,
          roughness: 0.02,
          metalness: 0.35,
          clearcoat: 1.0,
        });
        const glazeMesh = new THREE.Mesh(glazeGeo, glazeMat);
        glazeMesh.position.set(0, bDef.h / 2 + 0.035, 0);
        mesh.add(glazeMesh);

        // Snow-topped wooden perimeter fence along the back edge of main ground walkways
        if (bDef.w >= 14 && bDef.h <= 3.5 && bDef.y <= 4.5 && !bDef.moveAxis) {
          const fenceSpan = Math.min(bDef.w - 4, 48);
          const postCount = Math.max(2, Math.floor(fenceSpan / 4.5));
          const postGeo = new THREE.BoxGeometry(0.32, 1.05, 0.24);
          const railGeo = new THREE.BoxGeometry(fenceSpan, 0.24, 0.18);
          const snowRailGeo = new THREE.BoxGeometry(fenceSpan + 0.16, 0.18, 0.28);
          const woodMat = new THREE.MeshStandardMaterial({
            color: 0x78350f,
            roughness: 0.75,
          });
          const snowTopMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3,
          });

          const fenceGroup = new THREE.Group();
          for (let p = 0; p <= postCount; p++) {
            const px = -fenceSpan / 2 + (p / postCount) * fenceSpan;
            const post = new THREE.Mesh(postGeo, woodMat);
            post.position.set(px, 0.52, 0);
            fenceGroup.add(post);
          }
          const rail = new THREE.Mesh(railGeo, woodMat);
          rail.position.set(0, 0.78, 0);
          const snowRail = new THREE.Mesh(snowRailGeo, snowTopMat);
          snowRail.position.set(0, 0.96, 0);
          fenceGroup.add(rail, snowRail);
          fenceGroup.position.set(0, bDef.h / 2, -d / 2 + 0.22);
          mesh.add(fenceGroup);
        }
      }

      this.blocks.push({
        def: bDef,
        mesh,
        box,
        baseX: centerX,
        baseY: centerY,
        prevX: centerX,
        prevY: centerY,
        biome: bp.biome,
      });
    }

    // 1B. Build Glacial Ice Cliff Walls & Snow-Pine Trees in the Background for Zone 3 (ICE Biome)
    if (isIceBiome) {
      const cliffWallMat = new THREE.MeshPhysicalMaterial({
        map: this.baseIceTex,
        color: 0x7dd3fc,
        emissive: 0x075985,
        emissiveIntensity: 0.15,
        roughness: 0.14,
        metalness: 0.22,
        clearcoat: 0.8,
      });
      const cliffSnowMat = new THREE.MeshStandardMaterial({
        map: this.baseSnowTex,
        color: 0xffffff,
        roughness: 0.28,
      });
      const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x5c3614,
        roughness: 0.8,
      });
      const pineNeedleMat = new THREE.MeshStandardMaterial({
        color: 0x0f766e,
        roughness: 0.55,
      });

      for (let cx = -10; cx < bp.lengthUnits + 20; cx += 26) {
        const cliffW = 18 + ((cx * 7) % 8);
        const cliffH = 14 + (Math.abs(cx * 3) % 10);
        const cliffZ = -5.8 - (Math.abs(cx) % 3) * 1.4;

        const cliffGroup = new THREE.Group();
        const cliffGeo = new THREE.BoxGeometry(cliffW, cliffH, 3.2);
        const cliffMesh = new THREE.Mesh(cliffGeo, cliffWallMat);
        cliffMesh.position.set(0, cliffH / 2 - 4, 0);
        cliffGroup.add(cliffMesh);

        const snowCapGeo = new THREE.BoxGeometry(cliffW + 0.4, 1.1, 3.5);
        const snowCap = new THREE.Mesh(snowCapGeo, cliffSnowMat);
        snowCap.position.set(0, cliffH - 4 + 0.4, 0);
        cliffGroup.add(snowCap);

        // Add a snow-draped pine tree on top of the glacial cliff
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.42, 2.2, 8),
          trunkMat
        );
        trunk.position.y = 1.1;
        const cone1 = new THREE.Mesh(
          new THREE.ConeGeometry(1.8, 2.8, 8),
          pineNeedleMat
        );
        cone1.position.y = 2.8;
        const snowCone1 = new THREE.Mesh(
          new THREE.ConeGeometry(1.5, 1.6, 8),
          cliffSnowMat
        );
        snowCone1.position.y = 3.5;
        const cone2 = new THREE.Mesh(
          new THREE.ConeGeometry(1.3, 2.4, 8),
          pineNeedleMat
        );
        cone2.position.y = 4.4;
        const snowCone2 = new THREE.Mesh(
          new THREE.ConeGeometry(1.05, 1.4, 8),
          cliffSnowMat
        );
        snowCone2.position.y = 5.0;
        treeGroup.add(trunk, cone1, snowCone1, cone2, snowCone2);
        treeGroup.position.set((cx % 2 === 0 ? -1 : 1) * 3.2, cliffH - 4 + 0.8, 0.2);
        cliffGroup.add(treeGroup);

        cliffGroup.position.set(cx + cliffW / 2, 0, cliffZ);
        this.levelGroup.add(cliffGroup);
      }
    }

    // 2. Build 45-Degree Red Brick / Jungle Grass / Undulating Glacier Ice Slopes & Mountain Ramps
    if (bp.slopes) {
      for (const sDef of bp.slopes) {
        const d = sDef.d ?? 3.4;
        const shape = new THREE.Shape();
        if (sDef.dir === 'up-right') {
          shape.moveTo(0, 0);
          shape.lineTo(sDef.w, 0);
          shape.lineTo(sDef.w, sDef.h);
          shape.closePath();
        } else {
          shape.moveTo(0, 0);
          shape.lineTo(sDef.w, 0);
          shape.lineTo(0, sDef.h);
          shape.closePath();
        }

        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: d,
          bevelEnabled: false,
        });
        geo.translate(0, 0, -d / 2);

        const tex =
          bp.biome === 'JUNGLE'
            ? this.baseGrassTex.clone()
            : isIceBiome
            ? this.baseIceTex.clone()
            : this.baseBrickTex.clone();
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.repeat.set(isIceBiome ? 0.25 : 0.45, isIceBiome ? 0.25 : 0.45);
        tex.needsUpdate = true;

        const mat = isIceBiome
          ? new THREE.MeshPhysicalMaterial({
              map: tex,
              color: 0xe0f2fe,
              emissive: 0x0284c7,
              emissiveIntensity: 0.16,
              roughness: 0.05,
              metalness: 0.28,
              clearcoat: 1.0,
              clearcoatRoughness: 0.04,
            })
          : new THREE.MeshStandardMaterial({
              map: tex,
              color: 0xffffff,
              roughness: bp.biome === 'JUNGLE' ? 0.6 : 0.5,
              metalness: 0.05,
            });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(sDef.x, sDef.y, sDef.z ?? 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Add glossy snow-ice surface crust along the slope hypotenuse in ICE biome
        if (isIceBiome) {
          const hypLen = Math.hypot(sDef.w, sDef.h);
          const angle = Math.atan2(sDef.h, sDef.w);
          const crustGeo = new THREE.BoxGeometry(hypLen + 0.08, 0.16, d + 0.08);
          const crustMat = new THREE.MeshPhysicalMaterial({
            map: this.baseSnowTex,
            color: 0xffffff,
            emissive: 0xbae6fd,
            emissiveIntensity: 0.18,
            roughness: 0.06,
            metalness: 0.2,
            clearcoat: 1.0,
          });
          const crustMesh = new THREE.Mesh(crustGeo, crustMat);
          crustMesh.position.set(sDef.w / 2, sDef.h / 2, 0);
          crustMesh.rotation.z = sDef.dir === 'up-right' ? angle : -angle;
          mesh.add(crustMesh);
        }

        this.levelGroup.add(mesh);
        this.slopes.push({ def: sDef, mesh });
      }
    }

    // 3. Build Authentic 3D Moving Jacks (6-Pointed Star Spikes — Frost Crystal Stars in ICE biome)
    if (bp.jacks) {
      const coreGeo = new THREE.SphereGeometry(0.42, 20, 20);
      const coreMat = new THREE.MeshStandardMaterial({
        color: isIceBiome ? 0x0369a1 : 0x1e3a8a,
        emissive: isIceBiome ? 0x0284c7 : 0x000000,
        emissiveIntensity: isIceBiome ? 0.35 : 0,
        metalness: 0.78,
        roughness: isIceBiome ? 0.12 : 0.22,
      });
      const pointGeo = new THREE.ConeGeometry(0.22, 0.75, 10);
      const pointMat = new THREE.MeshStandardMaterial({
        color: isIceBiome ? 0xe0f2fe : 0xf59e0b,
        emissive: isIceBiome ? 0x38bdf8 : 0x78350f,
        emissiveIntensity: isIceBiome ? 0.45 : 0.25,
        metalness: 0.88,
        roughness: isIceBiome ? 0.1 : 0.2,
      });

      const dirs: Array<[number, number, number, number, number, number]> = [
        [0, 0.58, 0, 0, 0, 0],
        [0, -0.58, 0, Math.PI, 0, 0],
        [0.58, 0, 0, 0, 0, -Math.PI / 2],
        [-0.58, 0, 0, 0, 0, Math.PI / 2],
        [0, 0, 0.58, Math.PI / 2, 0, 0],
        [0, 0, -0.58, -Math.PI / 2, 0, 0],
      ];

      for (const jDef of bp.jacks) {
        const group = new THREE.Group();
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.castShadow = true;
        group.add(core);

        for (const [px, py, pz, rx, ry, rz] of dirs) {
          const spike = new THREE.Mesh(pointGeo, pointMat);
          spike.position.set(px, py, pz);
          spike.rotation.set(rx, ry, rz);
          spike.castShadow = true;
          group.add(spike);
        }

        group.position.set(jDef.x, jDef.y, jDef.z ?? 0);
        this.levelGroup.add(group);
        this.jacks.push({
          def: jDef,
          group,
          baseX: jDef.x,
          baseY: jDef.y,
          pos: new THREE.Vector3(jDef.x, jDef.y, jDef.z ?? 0),
        });
      }
    }

    // 3B. Build Realistic 3D Rolling Snowballs (Zone 3 Hazard — as shown in reference image)
    if (bp.snowballs) {
      const lumpOffsets: Array<[number, number, number]> = [
        [0.55, 0.35, 0.25],
        [-0.52, 0.4, -0.2],
        [0.2, -0.58, 0.35],
        [-0.35, -0.48, -0.35],
        [0.15, 0.25, -0.62],
        [-0.25, 0.15, 0.62],
      ];

      for (const sbDef of bp.snowballs) {
        const radius = sbDef.radius ?? 0.72;
        const group = new THREE.Group();

        const snowMat = new THREE.MeshPhysicalMaterial({
          map: this.baseSnowTex,
          color: 0xffffff,
          emissive: 0xe0f2fe,
          emissiveIntensity: 0.18,
          roughness: 0.32,
          metalness: 0.05,
          clearcoat: 0.45,
          clearcoatRoughness: 0.25,
          transparent: true,
          opacity: 1.0,
        });

        const ballGeo = new THREE.SphereGeometry(radius, 28, 28);
        const ballMesh = new THREE.Mesh(ballGeo, snowMat);
        ballMesh.castShadow = true;
        ballMesh.receiveShadow = true;

        // Add 3D packed-snow surface lumps so rotation is unmistakably visible
        const lumpGeo = new THREE.SphereGeometry(radius * 0.34, 14, 14);
        for (const [lx, ly, lz] of lumpOffsets) {
          const lump = new THREE.Mesh(lumpGeo, snowMat);
          lump.position.set(lx * radius, ly * radius, lz * radius);
          ballMesh.add(lump);
        }

        const summitX = sbDef.spawnX ?? sbDef.x;
        const summitY = sbDef.spawnY ?? sbDef.y + 3.2;
        const summitZ = sbDef.z ?? 0;
        const summitPos = new THREE.Vector3(summitX, summitY, summitZ);

        const dirMult = sbDef.direction === 'right' ? 1 : -1;
        const startX = summitX - dirMult * 5.0;
        const startY = summitY + 0.8;
        const startPos = new THREE.Vector3(startX, startY, summitZ);
        const pos = startPos.clone();

        group.add(ballMesh);
        group.position.copy(pos);
        ballMesh.scale.setScalar(0.6);
        snowMat.opacity = 0.0;
        this.levelGroup.add(group);

        this.snowballs.push({
          def: sbDef,
          group,
          ballMesh,
          snowMat,
          summitPos,
          startPos,
          pos,
          velocity: new THREE.Vector2(0, 0),
          radius,
          isShattered: false,
          shatterTimer: 0,
          currentOpacity: 0.0,
          currentScale: 0.6,
        });
      }
    }

    // 3B2. Build 3D Polar Bear Enemies (Zone 3 Hazard with Swipe & Hit-Stun Recoil)
    const bearDefs: PolarBearDef[] = [];
    if (bp.polarBears && bp.polarBears.length > 0) {
      bearDefs.push(...bp.polarBears);
    } else if (bp.biome === 'ICE' && bp.levelNumber >= 24) {
      bearDefs.push({ x: Math.round(bp.lengthUnits * 0.35), y: 2.0 });
      if (bp.lengthUnits > 220) {
        bearDefs.push({ x: Math.round(bp.lengthUnits * 0.72), y: 2.0 });
      }
    }

    if (bearDefs.length > 0) {
      const furMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.82,
        metalness: 0.05,
      });
      const snoutMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
      });
      const clawMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.7,
        roughness: 0.3,
      });

      for (const bDef of bearDefs) {
        const group = new THREE.Group();

        const bodyGeo = new THREE.DodecahedronGeometry(1.0, 1);
        const bodyMesh = new THREE.Mesh(bodyGeo, furMat);
        bodyMesh.scale.set(1.1, 1.4, 0.95);
        bodyMesh.position.y = 1.2;
        bodyMesh.castShadow = true;

        const headGeo = new THREE.SphereGeometry(0.62, 16, 16);
        const headMesh = new THREE.Mesh(headGeo, furMat);
        headMesh.position.set(0, 2.4, 0.2);

        const snoutGeo = new THREE.BoxGeometry(0.38, 0.32, 0.42);
        const snoutMesh = new THREE.Mesh(snoutGeo, snoutMat);
        snoutMesh.position.set(0, 2.3, 0.72);

        const rightArmGroup = new THREE.Group();
        rightArmGroup.position.set(-0.85, 1.6, 0.2);

        const armGeo = new THREE.CylinderGeometry(0.24, 0.32, 1.1, 10);
        const rightArmMesh = new THREE.Mesh(armGeo, furMat);
        rightArmMesh.position.set(0, -0.45, 0);

        for (let c = -1; c <= 1; c++) {
          const clawGeo = new THREE.ConeGeometry(0.08, 0.35, 8);
          const claw = new THREE.Mesh(clawGeo, clawMat);
          claw.position.set(c * 0.12, -0.98, 0.15);
          claw.rotation.x = Math.PI / 3;
          rightArmGroup.add(claw);
        }

        rightArmGroup.add(rightArmMesh);
        group.add(bodyMesh, headMesh, snoutMesh, rightArmGroup);

        const pos = new THREE.Vector3(bDef.x, bDef.y, bDef.z ?? 0);
        group.position.copy(pos);
        this.levelGroup.add(group);

        this.polarBears.push({
          def: bDef,
          group,
          bodyMesh,
          rightArmGroup,
          rightArmMesh,
          furMat,
          pos,
          baseY: bDef.y,
          isStunned: false,
          stunTimer: 0,
          swipeTimer: 0,
        });
      }
    }

    // 3C. Build Stage 33 Final Boss Guardian: "RAJA GLETSER ABADI" (Eternal Glacier Ice King)
    if (bp.levelNumber === 33) {
      const bossGroup = new THREE.Group();
      const bossIceMat = new THREE.MeshPhysicalMaterial({
        map: this.baseIceTex,
        color: 0x7dd3fc,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
        roughness: 0.08,
        metalness: 0.35,
        clearcoat: 1.0,
      });
      const bossCrownMat = new THREE.MeshPhysicalMaterial({
        color: 0xfacc15,
        emissive: 0xd97706,
        emissiveIntensity: 0.55,
        metalness: 0.92,
        roughness: 0.15,
        clearcoat: 1.0,
      });
      const bossEyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

      // Colossal Ice Golem Torso & Head
      const torso = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2.1, 1),
        bossIceMat
      );
      torso.position.y = 2.4;
      torso.scale.set(1.15, 1.35, 0.95);

      const head = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.25, 1),
        bossIceMat
      );
      head.position.y = 5.1;

      // Glowing Red Boss Eyes
      const eyeGeo = new THREE.SphereGeometry(0.22, 12, 12);
      const leftEye = new THREE.Mesh(eyeGeo, bossEyeMat);
      leftEye.position.set(-0.45, 5.2, 1.02);
      const rightEye = new THREE.Mesh(eyeGeo, bossEyeMat);
      rightEye.position.set(0.45, 5.2, 1.02);

      // Golden Ice King Crown with 5 Spires
      const crownBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 0.85, 0.55, 12),
        bossCrownMat
      );
      crownBase.position.y = 6.25;
      for (let c = 0; c < 5; c++) {
        const angle = (c / 5) * Math.PI * 2;
        const spire = new THREE.Mesh(
          new THREE.ConeGeometry(0.22, 0.85, 8),
          bossCrownMat
        );
        spire.position.set(
          Math.cos(angle) * 0.78,
          6.85,
          Math.sin(angle) * 0.78
        );
        bossGroup.add(spire);
      }

      // Massive Ice Crystal Shoulder Pauldrons
      const shoulderGeo = new THREE.ConeGeometry(0.95, 2.2, 7);
      const leftShoulder = new THREE.Mesh(shoulderGeo, bossIceMat);
      leftShoulder.position.set(-2.3, 3.8, 0);
      leftShoulder.rotation.z = 0.55;
      const rightShoulder = new THREE.Mesh(shoulderGeo, bossIceMat);
      rightShoulder.position.set(2.3, 3.8, 0);
      rightShoulder.rotation.z = -0.55;

      bossGroup.add(
        torso,
        head,
        leftEye,
        rightEye,
        crownBase,
        leftShoulder,
        rightShoulder
      );
      bossGroup.position.set(bp.exitDoorX - 5.5, 2.0, -2.6);
      bossGroup.userData.baseY = 2.0;
      this.levelGroup.add(bossGroup);
      this.iceBossGroup = bossGroup;
    }

    // 4. Build Extra Life Orbs (Plain Glossy Red Sphere + Gold Halo)
    if (bp.lifeOrbs) {
      const orbGeo = new THREE.SphereGeometry(0.46, 28, 28);
      const haloGeo = new THREE.TorusGeometry(0.68, 0.08, 12, 24);
      for (const lDef of bp.lifeOrbs) {
        const group = new THREE.Group();
        const orbMat = new THREE.MeshPhysicalMaterial({
          color: 0xef4444,
          emissive: 0xdc2626,
          emissiveIntensity: 0.4,
          roughness: 0.15,
          clearcoat: 1.0,
        });
        const orbMesh = new THREE.Mesh(orbGeo, orbMat);
        const haloMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        group.add(orbMesh, haloMesh);
        group.position.set(lDef.x, lDef.y, lDef.z ?? 0);
        this.levelGroup.add(group);
        this.lifeOrbs.push({
          group,
          halo: haloMesh,
          pos: new THREE.Vector3(lDef.x, lDef.y, lDef.z ?? 0),
          collected: false,
        });
      }
    }

    // 4B. Build Wooden Crates containing Invincibility Star (Kotak Kayu Bintang Kebal)
    const cratePositions: THREE.Vector3[] = [];
    if (bp.crates && bp.crates.length > 0) {
      for (const cDef of bp.crates) {
        cratePositions.push(new THREE.Vector3(cDef.x, cDef.y, cDef.z ?? 0));
      }
    } else if (bp.biome === 'ICE' || bp.levelNumber >= 23) {
      cratePositions.push(
        new THREE.Vector3(Math.round(bp.lengthUnits * 0.5), 2.2, 0)
      );
    }

    if (cratePositions.length > 0) {
      const boxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const woodMat = new THREE.MeshStandardMaterial({
        color: 0x92400e,
        roughness: 0.65,
        metalness: 0.1,
      });
      const ironMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.4,
        metalness: 0.8,
      });
      const starEmblemGeo = new THREE.OctahedronGeometry(0.38, 0);
      const starEmblemMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xd97706,
        emissiveIntensity: 0.65,
        metalness: 0.8,
        roughness: 0.2,
      });

      for (const cPos of cratePositions) {
        const group = new THREE.Group();
        const crateMesh = new THREE.Mesh(boxGeo, woodMat);
        crateMesh.castShadow = true;
        crateMesh.receiveShadow = true;

        const frameGeo = new THREE.BoxGeometry(1.26, 1.26, 1.26);
        const frameMesh = new THREE.Mesh(frameGeo, ironMat);

        const starMesh = new THREE.Mesh(starEmblemGeo, starEmblemMat);
        starMesh.position.set(0, 0, 0.62);

        group.add(crateMesh, frameMesh, starMesh);
        group.position.copy(cPos);
        this.levelGroup.add(group);

        this.crates.push({
          group,
          pos: cPos.clone(),
          collected: false,
        });
      }
    }

    // 5. Build Authentic Static Oriented 24K Metallic Gold Hoops (Vertical & Horizontal Rings)
    const hoopGeo = new THREE.TorusGeometry(0.86, 0.14, 24, 48);
    const clampGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.28, 16);
    const clampMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      emissive: 0x78350f,
      emissiveIntensity: 0.22,
      metalness: 0.85,
      roughness: 0.2,
      envMap: this.goldEnvTex,
      envMapIntensity: 1.6,
    });

    for (const rDef of bp.rings) {
      const group = new THREE.Group();
      const ringMat = new THREE.MeshPhysicalMaterial({
        color: 0xdaa520,
        emissive: 0x92400e,
        emissiveIntensity: 0.28,
        metalness: 0.94,
        roughness: 0.18,
        envMap: this.goldEnvTex,
        envMapIntensity: 2.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.9,
      });

      const hoopMesh = new THREE.Mesh(hoopGeo, ringMat);
      hoopMesh.castShadow = true;

      const clampMesh = new THREE.Mesh(clampGeo, clampMat);

      if (rDef.orientation === 'horizontal') {
        hoopMesh.rotation.x = Math.PI / 2 - 0.22;
        clampMesh.rotation.z = Math.PI / 2;
        clampMesh.position.set(-0.92, 0, 0);
      } else {
        hoopMesh.rotation.y = Math.PI / 2 - 0.32;
        clampMesh.position.set(0, -0.92, 0);
      }

      group.add(hoopMesh, clampMesh);
      group.position.set(rDef.x, rDef.y, rDef.z ?? 0);
      this.levelGroup.add(group);

      this.rings.push({
        group,
        hoopMesh,
        mat: ringMat,
        pos: new THREE.Vector3(rDef.x, rDef.y, rDef.z ?? 0),
        collected: false,
      });
    }
    this.totalRings = this.rings.length;

    // 6. Build Floor & Inverted Ceiling Spikes (Needles / Translucent Crystalline Icicles in ICE Biome)
    const spikeConeGeo = new THREE.ConeGeometry(0.32, 0.88, 10);
    const spikeMat = isIceBiome
      ? new THREE.MeshPhysicalMaterial({
          color: 0xe0f2fe,
          emissive: 0x0284c7,
          emissiveIntensity: 0.35,
          metalness: 0.35,
          roughness: 0.06,
          clearcoat: 1.0,
        })
      : new THREE.MeshStandardMaterial({
          color: 0xd97706,
          metalness: 0.85,
          roughness: 0.25,
        });
    for (const sDef of bp.spikes) {
      const group = new THREE.Group();
      const count = sDef.count ?? 3;
      const isInverted = Boolean(sDef.inverted);
      for (let i = 0; i < count; i++) {
        const spike = new THREE.Mesh(spikeConeGeo, spikeMat);
        spike.position.set(
          (i - (count - 1) / 2) * 0.68,
          isInverted ? -0.44 : 0.44,
          0
        );
        if (isInverted) {
          spike.rotation.z = Math.PI;
        }
        spike.castShadow = true;
        group.add(spike);
      }
      group.position.set(sDef.x, sDef.y, sDef.z ?? 0);
      this.levelGroup.add(group);
      this.spikes.push({
        def: sDef,
        group,
        baseX: sDef.x,
        baseY: sDef.y,
        pos: new THREE.Vector3(sDef.x, sDef.y, sDef.z ?? 0),
      });
    }

    // 7. Build Classic Inflator & Deflator Pump Stations
    const pumpGeo = new THREE.CylinderGeometry(0.55, 0.76, 0.78, 20);
    const collarGeo = new THREE.TorusGeometry(0.58, 0.08, 12, 24);
    collarGeo.rotateX(Math.PI / 2);

    for (const pDef of bp.pumps) {
      const color = pDef.type === 'INFLATE' ? 0xeab308 : 0x0284c7;
      const mat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.65,
        roughness: 0.25,
      });
      const mesh = new THREE.Mesh(pumpGeo, mat);
      mesh.position.set(pDef.x, pDef.y + 0.39, pDef.z ?? 0);
      mesh.castShadow = true;

      const labelRing = new THREE.Mesh(
        collarGeo,
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      labelRing.position.y = 0.4;
      mesh.add(labelRing);

      this.levelGroup.add(mesh);
      this.pumps.push({
        mesh,
        labelRing,
        type: pDef.type,
        pos: new THREE.Vector3(pDef.x, pDef.y + 0.39, pDef.z ?? 0),
      });
    }

    // 8. Build Water Buoyancy Pools + Shimmering 3D Surface Wave Crest
    for (const wDef of bp.waterPools) {
      const d = wDef.depth ?? 3.4;
      const geo = new THREE.BoxGeometry(wDef.width, wDef.height, d);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.62,
        roughness: 0.1,
        metalness: 0.08,
        clearcoat: 1.0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const centerX = wDef.x + wDef.width / 2;
      const surfaceY = wDef.y + wDef.height;
      mesh.position.set(centerX, wDef.y + wDef.height / 2, wDef.z ?? 0);
      this.levelGroup.add(mesh);

      const crestGeo = new THREE.BoxGeometry(wDef.width, 0.16, d + 0.04);
      const crestMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
      });
      const surfaceMesh = new THREE.Mesh(crestGeo, crestMat);
      surfaceMesh.position.set(centerX, surfaceY, wDef.z ?? 0);
      this.levelGroup.add(surfaceMesh);

      const box = new THREE.Box3().setFromObject(mesh);
      this.waterZones.push({
        mesh,
        surfaceMesh,
        box,
        surfaceY,
      });
    }

    // 9. Build Checkpoints
    const baseGeo = new THREE.CylinderGeometry(0.45, 0.6, 0.3, 12);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.5,
      roughness: 0.4,
    });
    const crystalGeo = new THREE.OctahedronGeometry(0.58, 0);
    const haloRingGeo = new THREE.TorusGeometry(0.75, 0.06, 10, 24);

    for (const cpDef of bp.checkpoints) {
      const cpGroup = new THREE.Group();
      const pedestal = new THREE.Mesh(baseGeo, baseMat);
      pedestal.position.y = 0.15;

      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.65,
        roughness: 0.15,
        metalness: 0.2,
      });
      const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
      crystalMesh.position.y = 1.25;
      crystalMesh.scale.set(0.85, 1.35, 0.85);

      const haloMesh = new THREE.Mesh(
        haloRingGeo,
        new THREE.MeshBasicMaterial({ color: 0xfde047 })
      );
      haloMesh.position.y = 1.25;

      cpGroup.add(pedestal, crystalMesh, haloMesh);
      cpGroup.position.set(cpDef.x, cpDef.y, cpDef.z ?? 0);
      this.levelGroup.add(cpGroup);

      this.checkpoints.push({
        group: cpGroup,
        crystalMesh,
        crystalMat,
        haloMesh,
        pos: new THREE.Vector3(cpDef.x, cpDef.y + 1.0, cpDef.z ?? 0),
        activated: false,
      });
    }

    // 10. Build Exit Door & Exit Portal Ring
    const doorGeo = new THREE.BoxGeometry(1, 5, 3.4);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.5,
      roughness: 0.3,
    });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(bp.exitDoorX, bp.exitDoorY, 0);
    doorMesh.castShadow = true;
    this.levelGroup.add(doorMesh);
    this.exitDoor = {
      mesh: doorMesh,
      box: new THREE.Box3().setFromObject(doorMesh),
    };

    const portalGeo = new THREE.TorusGeometry(1.6, 0.22, 18, 36);
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.6,
    });
    this.exitRing = new THREE.Mesh(portalGeo, portalMat);
    this.exitRing.position.set(bp.exitRingX, bp.exitRingY, 0);
    this.levelGroup.add(this.exitRing);
  }

  private resetLevelState(bp: LevelBlueprint) {
    // Reset Ball to Spawn
    this.checkpointPosition.set(
      bp.spawnPos[0],
      bp.spawnPos[1],
      bp.spawnPos[2]
    );
    this.checkpointBallType = 'NORMAL';
    this.setBallState('NORMAL', false);
    this.resetBallToPosition(this.checkpointPosition);
    this.broadcastHud();
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    window.removeEventListener('blur', this.onBlurBound);
    window.removeEventListener('resize', this.onResizeBound);

    this.disposeLevelResources();
    this.baseBrickTex.dispose();
    this.bouncyBrickTex.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
