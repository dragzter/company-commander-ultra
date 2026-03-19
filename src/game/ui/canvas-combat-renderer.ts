type CanvasCombatRendererOptions = {
  root: HTMLElement;
  battleArea: HTMLElement;
  canvas: HTMLCanvasElement;
};

type CardSnapshot = {
  id: string;
  side: "player" | "enemy";
  x: number;
  y: number;
  w: number;
  h: number;
  hpText: string;
  nameText: string;
  levelText: string;
  isElite: boolean;
  isDown: boolean;
  isLowHealth: boolean;
  avatarSrc: string | null;
};

const MAX_CANVAS_DPR = 2;

export class CanvasCombatRenderer {
  private readonly root: HTMLElement;
  private readonly battleArea: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly imageCache = new Map<string, HTMLImageElement>();
  private enabled = true;
  private readonly resizeObserver: ResizeObserver | null;

  constructor(options: CanvasCombatRendererOptions) {
    this.root = options.root;
    this.battleArea = options.battleArea;
    this.canvas = options.canvas;
    this.resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => this.resizeToViewport())
        : null;
    this.resizeObserver?.observe(this.battleArea);
    this.resizeToViewport();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.root.classList.toggle("combat-canvas-mode", enabled);
    if (!enabled) {
      this.clear();
      return;
    }
    this.renderNow();
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.clear();
  }

  clear(): void {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderNow(): void {
    if (!this.enabled) return;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    this.resizeToViewport();
    const cards = this.collectCardSnapshots();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const card of cards) this.drawCard(ctx, card);
  }

  private resizeToViewport(): void {
    const w = Math.max(1, Math.round(this.battleArea.clientWidth));
    const h = Math.max(1, Math.round(this.battleArea.clientHeight));
    const dpr = Math.max(
      1,
      Math.min(MAX_CANVAS_DPR, window.devicePixelRatio || 1),
    );
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (this.canvas.width !== pw || this.canvas.height !== ph) {
      this.canvas.width = pw;
      this.canvas.height = ph;
    }
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  private collectCardSnapshots(): CardSnapshot[] {
    const areaRect = this.battleArea.getBoundingClientRect();
    const cards = this.battleArea.querySelectorAll(".combat-card");
    const rows: CardSnapshot[] = [];
    for (const node of cards) {
      const card = node as HTMLElement;
      const id = card.dataset.combatantId ?? "";
      if (!id) continue;
      const sideAttr = card.dataset.side;
      const side: "player" | "enemy" = sideAttr === "enemy" ? "enemy" : "player";
      const r = card.getBoundingClientRect();
      const hpText =
        (
          card.querySelector(".combat-card-hp-value") as HTMLElement | null
        )?.textContent?.trim() ?? "";
      const nameText =
        (
          card.querySelector(".combat-card-name") as HTMLElement | null
        )?.textContent?.trim() ?? "";
      const eliteText =
        (
          card.querySelector(
            ".combat-card-level-badge-elite-text",
          ) as HTMLElement | null
        )?.textContent?.trim() ?? "";
      const levelText = eliteText
        ? eliteText
        : (
            card.querySelector(".combat-card-level-badge") as HTMLElement | null
          )?.textContent?.trim() ?? "";
      const avatar =
        card.querySelector(".combat-card-avatar") as HTMLImageElement | null;
      rows.push({
        id,
        side,
        x: r.left - areaRect.left,
        y: r.top - areaRect.top,
        w: r.width,
        h: r.height,
        hpText,
        nameText,
        levelText,
        isElite: card.classList.contains("combat-card-epic-elite"),
        isDown: card.classList.contains("combat-card-down"),
        isLowHealth: card.classList.contains("combat-card-low-health"),
        avatarSrc: avatar?.src ?? null,
      });
    }
    return rows;
  }

  private getImage(src: string | null): HTMLImageElement | null {
    if (!src) return null;
    const cached = this.imageCache.get(src);
    if (cached) return cached;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    this.imageCache.set(src, img);
    return img;
  }

  private withScaledCtx(ctx: CanvasRenderingContext2D, fn: () => void): void {
    const dpr = Math.max(
      1,
      Math.min(MAX_CANVAS_DPR, window.devicePixelRatio || 1),
    );
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fn();
    ctx.restore();
  }

  private roundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  private drawCard(ctx: CanvasRenderingContext2D, c: CardSnapshot): void {
    this.withScaledCtx(ctx, () => {
      const cardRadius = Math.max(5, Math.min(8, c.w * 0.12));
      const fill =
        c.side === "player"
          ? "rgba(12, 19, 12, 0.88)"
          : "rgba(22, 12, 12, 0.88)";
      const border = c.isElite
        ? "rgba(255, 204, 64, 0.95)"
        : c.side === "player"
          ? "rgba(120, 220, 156, 0.6)"
          : "rgba(230, 106, 106, 0.6)";

      this.roundedRectPath(ctx, c.x, c.y, c.w, c.h, cardRadius);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = border;
      ctx.lineWidth = c.isElite ? 1.8 : 1.2;
      ctx.stroke();

      const avatarInset = 4;
      const avatarSize = Math.max(30, Math.floor(c.w - avatarInset * 2));
      const avatarX = c.x + avatarInset;
      const avatarY = c.y + avatarInset;
      const avatar = this.getImage(c.avatarSrc);
      if (avatar && avatar.complete && avatar.naturalWidth > 0) {
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      } else {
        ctx.fillStyle = "rgba(42, 47, 54, 0.94)";
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
      }

      const hpWrapX = c.x + 4;
      const hpWrapY = avatarY + avatarSize + 2;
      const hpWrapW = c.w - 8;
      const hpWrapH = 7;
      ctx.fillStyle = "rgba(18, 18, 18, 0.95)";
      this.roundedRectPath(ctx, hpWrapX, hpWrapY, hpWrapW, hpWrapH, 2);
      ctx.fill();
      const hpRatio = this.parseHpRatio(c.hpText);
      ctx.fillStyle = c.isLowHealth
        ? "rgba(244, 94, 94, 0.96)"
        : "rgba(88, 223, 136, 0.95)";
      this.roundedRectPath(
        ctx,
        hpWrapX,
        hpWrapY,
        Math.max(0, hpWrapW * hpRatio),
        hpWrapH,
        2,
      );
      ctx.fill();

      if (c.levelText) {
        const badgeW = c.isElite ? 25 : 22;
        const badgeH = c.isElite ? 15 : 13;
        const bx = c.x + 2;
        const by = c.y + 2;
        this.roundedRectPath(ctx, bx, by, badgeW, badgeH, 4);
        ctx.fillStyle = c.isElite
          ? "rgba(120, 24, 24, 0.95)"
          : "rgba(22, 84, 141, 0.95)";
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.97)";
        ctx.font = `700 ${c.isElite ? 10 : 9}px ui-monospace, Menlo, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(c.levelText, bx + badgeW / 2, by + badgeH / 2 + 0.2);
      }

      if (c.nameText) {
        ctx.fillStyle = "rgba(233, 239, 248, 0.94)";
        ctx.font = "700 8.8px ui-monospace, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(
          c.nameText.length > 11 ? `${c.nameText.slice(0, 10)}…` : c.nameText,
          c.x + c.w / 2,
          hpWrapY + hpWrapH + 2.2,
        );
      }

      if (c.isDown) {
        ctx.fillStyle = "rgba(8, 8, 8, 0.62)";
        this.roundedRectPath(ctx, c.x, c.y, c.w, c.h, cardRadius);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
        ctx.font = "700 11px ui-monospace, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("DOWN", c.x + c.w / 2, c.y + c.h / 2);
      }
    });
  }

  private parseHpRatio(hpText: string): number {
    const parts = hpText.split("/");
    if (parts.length !== 2) return 0;
    const hp = Number(parts[0]);
    const maxHp = Number(parts[1]);
    if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) return 0;
    return Math.max(0, Math.min(1, hp / maxHp));
  }
}
