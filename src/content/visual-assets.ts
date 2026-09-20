import type { ImageAsset } from "./resource-contract.ts";
/** Single visual registry. Visual integration is separate from release/rights approval. */
export interface ProductionImageAsset extends ImageAsset {
  master: {
    path: string;
    width: number;
    height: number;
    bytes: number;
    sha256: string;
    alpha: boolean;
  } | null;
  displayMax: number;
  motion?: {
    frames: number;
    columns?: number;
    rows?: number;
    cellWidth?: number;
    cellHeight?: number;
    fps?: number;
    groundAnchor: number[];
    headAnchor?: number[];
    mouthAnchor?: number[];
    mirror?: boolean;
  };
}
export const VISUAL_ASSETS: ProductionImageAsset[] = [
  {
    id: "bag",
    path: "assets/game/tabby/bag.webp",
    width: 512,
    height: 512,
    bytes: 44482,
    sha256: "14a286fb27851739a40c72d2650f090b9623130f52ab86cd23c086d88770e886",
    alpha: true,
    type: "image/webp",
    purpose: "bag",
    version: "tabby-papertrail-v2",
    review: "PENDING",
    source:
      "Built-in imagegen; 2026-09-19; approved tabby identity reference from PR #5; model version and seed not exposed",
    master: {
      path: "design/tabby/masters/bag.png",
      width: 1254,
      height: 1254,
      bytes: 1700020,
      sha256:
        "e196c98aa16ecc6aff719cc63d42a776e3256d47921a9892ba1d7c0ede759b6b",
      alpha: true,
    },
    displayMax: 220,
  },
  {
    id: "cap",
    path: "assets/game/tabby/cap.webp",
    width: 512,
    height: 512,
    bytes: 38524,
    sha256: "3dc5927b7cf108a0c85dfb7abb4288e66e01a463736b784e658ba562dd9f171f",
    alpha: true,
    type: "image/webp",
    purpose: "cap",
    version: "tabby-papertrail-v2",
    review: "PENDING",
    source:
      "Built-in imagegen; 2026-09-19; approved tabby identity reference from PR #5; model version and seed not exposed",
    master: {
      path: "design/tabby/masters/cap.png",
      width: 1254,
      height: 1254,
      bytes: 1517337,
      sha256:
        "5f0eaa656b5811425b7749ea7a5f21b2f24225d7d62d003cb899e8b9e279cf62",
      alpha: true,
    },
    displayMax: 220,
  },
  {
    id: "cat-action",
    path: "assets/game/tabby/cat-action.webp",
    width: 768,
    height: 768,
    bytes: 106082,
    sha256: "1f6c2d8c4d82e6ae14e4a11870716d93551eab14dd274ce80a2888d4f096000f",
    alpha: true,
    type: "image/webp",
    purpose: "Crossing / action / success tabby",
    version: "tabby-papertrail-v2",
    review: "PENDING",
    source:
      "Built-in imagegen; 2026-09-19; approved tabby identity reference from PR #5; model version and seed not exposed",
    master: {
      path: "design/tabby/masters/cat-action.png",
      width: 1254,
      height: 1254,
      bytes: 1607259,
      sha256:
        "5ee7d2560d50c799483aee4e496b91142b5ad176a38473237ab72b1cb328b153",
      alpha: true,
    },
    displayMax: 320,
  },
  {
    id: "cat",
    path: "assets/game/tabby/cat-idle.webp",
    width: 768,
    height: 768,
    bytes: 97152,
    sha256: "6d5cfe87a5797591b036c3996075247600bb1a59068f91848ff065df7a2e1ec0",
    alpha: true,
    type: "image/webp",
    purpose: "Default / tutorial tabby",
    version: "tabby-papertrail-v2",
    review: "PENDING",
    source:
      "Built-in imagegen; 2026-09-19; approved tabby identity reference from PR #5; model version and seed not exposed",
    master: {
      path: "design/tabby/masters/cat-idle.png",
      width: 1254,
      height: 1254,
      bytes: 1541983,
      sha256:
        "d023d7b041e16ef6b9942f3202e961b8acdf5311ca2e5390952f9c60b4774081",
      alpha: true,
    },
    displayMax: 320,
  },
  {
    id: "cat-thinking",
    path: "assets/game/tabby/cat-thinking.webp",
    width: 768,
    height: 768,
    bytes: 103436,
    sha256: "bc0b00af8a27860010c6e708c8d23e93f982c77e5959d5e3c47f8a33e32d252f",
    alpha: true,
    type: "image/webp",
    purpose: "Hint / correction tabby",
    version: "tabby-papertrail-v2",
    review: "PENDING",
    source:
      "Built-in imagegen; 2026-09-19; approved tabby identity reference from PR #5; model version and seed not exposed",
    master: {
      path: "design/tabby/masters/cat-thinking.png",
      width: 1254,
      height: 1254,
      bytes: 1523413,
      sha256:
        "a8a072299fec68ed1b5b47ea3de5bcea00c10393ed6098095f10c683d392c5f0",
      alpha: true,
    },
    displayMax: 320,
  },
  {
    id: "hat",
    path: "assets/game/tabby/hat.webp",
    width: 512,
    height: 512,
    bytes: 36888,
    sha256: "121b44cd82bcb50ae27614fb352779c70ade2302e6c5768348af63c78edd3710",
    alpha: true,
    type: "image/webp",
    purpose: "hat",
    version: "tabby-papertrail-v2",
    review: "PENDING",
    source:
      "Built-in imagegen; 2026-09-19; approved tabby identity reference from PR #5; model version and seed not exposed",
    master: {
      path: "design/tabby/masters/hat.png",
      width: 1254,
      height: 1254,
      bytes: 1219004,
      sha256:
        "a45b1f4dae7aa6c75c482908e7ead2df1483c59a6c81a65a037010c7eaea23f9",
      alpha: true,
    },
    displayMax: 220,
  },
  {
    id: "map",
    path: "assets/game/tabby/map.webp",
    width: 512,
    height: 512,
    bytes: 38664,
    sha256: "1e8132495db2f31f6303d1c5c0dad250c3de0d4ec58c6d57985048ddc3445266",
    alpha: true,
    type: "image/webp",
    purpose: "map",
    version: "tabby-papertrail-v2",
    review: "PENDING",
    source:
      "Built-in imagegen; 2026-09-19; approved tabby identity reference from PR #5; model version and seed not exposed",
    master: {
      path: "design/tabby/masters/map.png",
      width: 1477,
      height: 1065,
      bytes: 1597830,
      sha256:
        "e5c8b1c6716aaed15ff7668827c3e096a72f875ce8b82268cffd1c51737a4189",
      alpha: true,
    },
    displayMax: 220,
  },
  {
    id: "mat",
    path: "assets/game/tabby/mat.webp",
    width: 512,
    height: 512,
    bytes: 52068,
    sha256: "5c6b32a1bee42cc0dc6e58cf8609bb325cd4f2f5774b6137800fd3101dfb2e34",
    alpha: true,
    type: "image/webp",
    purpose: "mat",
    version: "tabby-papertrail-v2",
    review: "PENDING",
    source:
      "Built-in imagegen; 2026-09-19; approved tabby identity reference from PR #5; model version and seed not exposed",
    master: {
      path: "design/tabby/masters/mat.png",
      width: 1254,
      height: 1254,
      bytes: 1686513,
      sha256:
        "4a8a128618c4b6b32def6e8e693dbb01d4f1f468d9280ac2d7505d6bf9fdb6c3",
      alpha: true,
    },
    displayMax: 220,
  },
  {
    id: "scene-act-1",
    path: "assets/game/tabby/scene-act-1.webp",
    width: 1440,
    height: 960,
    bytes: 384820,
    sha256: "e1f338ee8ccb2821b2d5b0aa92df0705b4d09fd339a524c575edde3e942f4aec",
    alpha: false,
    type: "image/webp",
    purpose: "scene-act-1",
    version: "tabby-papertrail-v2",
    review: "PENDING",
    source:
      "Built-in imagegen; 2026-09-19; approved tabby identity reference from PR #5; model version and seed not exposed",
    master: {
      path: "design/tabby/masters/scene-act-1.png",
      width: 1536,
      height: 1024,
      bytes: 3192367,
      sha256:
        "6b9cda6487c01cabf57e3f9ad6e87fdc0c03a9ca2d5f82e228ed06f77d9581fb",
      alpha: false,
    },
    displayMax: 720,
  },
  {
    id: "scene-act-2",
    path: "assets/game/tabby/scene-act-2.webp",
    width: 1440,
    height: 960,
    bytes: 390406,
    sha256: "e3f1b91ff72b1859afe7580e091cd8c0809d035338abcf3f69668e342d3a7708",
    alpha: false,
    type: "image/webp",
    purpose: "scene-act-2",
    version: "tabby-papertrail-v2",
    review: "PENDING",
    source:
      "Built-in imagegen; 2026-09-19; approved tabby identity reference from PR #5; model version and seed not exposed",
    master: {
      path: "design/tabby/masters/scene-act-2.png",
      width: 1536,
      height: 1024,
      bytes: 3202318,
      sha256:
        "3f8a2971814092ba203c337ed172654b67612a3548f358fa0198071cd64bfc95",
      alpha: false,
    },
    displayMax: 720,
  },
  {
    id: "scene-act-3",
    path: "assets/game/tabby/scene-act-3.webp",
    width: 1440,
    height: 960,
    bytes: 388296,
    sha256: "66c2afa95e7bc30a0b3b7823a95767db724c29c9b272e615046c3c6ceb8fe01e",
    alpha: false,
    type: "image/webp",
    purpose: "scene-act-3",
    version: "tabby-papertrail-v2",
    review: "PENDING",
    source:
      "Built-in imagegen; 2026-09-19; approved tabby identity reference from PR #5; model version and seed not exposed",
    master: {
      path: "design/tabby/masters/scene-act-3.png",
      width: 1536,
      height: 1024,
      bytes: 3181744,
      sha256:
        "bf0e8b3cd526c3a37d1f50c1e39d9f6e2693bccd329b33d8122fe3ca9f706389",
      alpha: false,
    },
    displayMax: 720,
  },
  {
    id: "cat-happy",
    path: "assets/game/tabby/companion.webp",
    width: 512,
    height: 512,
    bytes: 8602,
    sha256: "1910a9fc05f2ebb01c2d92813a029ed4dc458f2aac541bd2617b19a6a3adc027",
    alpha: true,
    type: "image/webp",
    purpose: "User-confirmed celebration / ending",
    version: "tabby-ui-v1",
    review: "PENDING",
    source:
      "Byte-identical PR #5 b1d64da approved identity runtime; original 1254 PNG is unavailable locally; NOT an HD master",
    master: null,
    displayMax: 220,
  },
  {
    id: "cat-walk",
    path: "assets/game/tabby/cat-walk.webp",
    width: 1254,
    height: 1254,
    bytes: 399584,
    sha256: "dda4eb7772367125987784e22c3117f674481ca3fc22c0ba4b0f61d2ce130250",
    alpha: true,
    type: "image/webp",
    purpose:
      "Four-frame tabby walk; 2x2 native cells; identity and locator not mirrored",
    version: "tabby-motion-v1",
    review: "PENDING",
    source:
      "Built-in imagegen 2026-09-20; approved tabby/prop reference; model and seed not exposed; native-size Canvas WebP conversion at quality 0.9",
    master: {
      path: "design/tabby/motion/cat-walk-master.png",
      width: 1254,
      height: 1254,
      bytes: 1809528,
      sha256:
        "e8c526cb97ced0093b0a43d1df6afa16f8a8a2f1ef0c4274addea2f58498c781",
      alpha: true,
    },
    displayMax: 220,
    motion: {
      columns: 2,
      rows: 2,
      cellWidth: 627,
      cellHeight: 627,
      frames: 4,
      fps: 8,
      groundAnchor: [0.6, 0.93],
      headAnchor: [0.69, 0.27],
      mirror: false,
    },
  },
  {
    id: "bag-open",
    path: "assets/game/tabby/bag-open.webp",
    width: 1254,
    height: 1254,
    bytes: 184900,
    sha256: "3ade9c90d0a15b4db0d171881ecc18d5ce3ef27950547e78bd13ca5b93d4937a",
    alpha: true,
    type: "image/webp",
    purpose: "Opened backpack counterpart",
    version: "tabby-motion-v1",
    review: "PENDING",
    source:
      "Built-in imagegen 2026-09-20; approved tabby/prop reference; model and seed not exposed; native-size Canvas WebP conversion at quality 0.9",
    master: {
      path: "design/tabby/motion/bag-open-master.png",
      width: 1254,
      height: 1254,
      bytes: 1312548,
      sha256:
        "266b8816c99635ba4a230228ddce3625b81d01c9a5ce884b97ac43cf7e302c3c",
      alpha: true,
    },
    displayMax: 150,
    motion: {
      frames: 1,
      groundAnchor: [0.5, 0.84],
      mouthAnchor: [0.5, 0.36],
    },
  },
];
