import React, { useEffect, useRef } from 'react';
import { BrandMark } from './BrandMark';
import { Button } from './ui/Button';
import { Empty } from './ui/Empty';
import { Field, Input } from './ui/Field';
import { IconDiscord } from './ui/glyphs';

export type LandingProps = {
  loginUser: string;
  loginPass: string;
  loginError: string;
  discordEnabled?: boolean;
  onLoginUserChange: (value: string) => void;
  onLoginPassChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

/** Dither 粒子背景 Canvas 组件 */
function LandingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
    };

    let particles: Particle[] = [];
    const colors = ['#22d3ee', '#818cf8', '#ec4899', '#ffffff'];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = Math.floor((width * height) / 28000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          size: Math.random() < 0.85 ? 1.5 : 2.5,
          alpha: Math.random() * 0.5 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 绘制慢速粒子
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      }
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="landing-canvas" aria-hidden="true" />;
}

export function Landing({
  loginUser,
  loginPass,
  loginError,
  discordEnabled = true,
  onLoginUserChange,
  onLoginPassChange,
  onSubmit,
}: LandingProps) {
  return (
    <div className="landing dark font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 动态粒子背景、网格背景与顶部光晕 */}
      <LandingCanvas />
      <div className="landing-grid-bg" aria-hidden="true" />
      <div className="landing-glow" aria-hidden="true" />

      {/* 顶部轻量状态导航条 */}
      <header className="relative z-40 w-full shrink-0 lp-top">
        <div className="mx-auto flex h-12 sm:h-16 max-w-7xl items-center justify-end px-4 sm:px-8 w-full">
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-8 sm:size-9 items-center justify-center rounded-full bg-[#0a0d14]/80 border border-white/10 text-white/70 backdrop-blur-md transition hover:border-white/20 hover:text-white hover:bg-white/5"
              title="GitHub"
            >
              <svg className="size-3.5 sm:size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
            <div className="hidden sm:inline-flex h-8 sm:h-9 items-center gap-2 rounded-full border border-white/10 bg-[#0a0d14]/80 px-3 text-xs font-mono text-white/70 backdrop-blur-md">
              <span className="text-cyan-400">SYSTEM:</span> ONLINE
            </div>
          </div>
        </div>
      </header>

      {/* 主屏展示区域 */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 py-2 sm:py-6 lg:py-10 max-w-7xl mx-auto w-full min-h-0 lp-stage">
        <div className="grid w-full gap-4 sm:gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:gap-12 xl:gap-16 items-center">
          
          {/* 左侧：Logo + 标题 + 矩阵 */}
          <section className="flex flex-col justify-center text-left lp-intro" aria-label="产品介绍">
            {/* LOGO 与大标题横向并排区 */}
            <div className="flex items-center gap-3.5 sm:gap-6 lg:gap-8 mb-1.5 lg:mb-5">
              {/* 放大版动效符文矩阵 Logo (PRESET 01 沉稳深邃电流光流动效) */}
              <div className="size-14 sm:size-24 lg:size-32 shrink-0 drop-shadow-[0_0_30px_rgba(56,189,248,0.4)]">
                <BrandMark animated className="w-full h-full" />
              </div>

              {/* 几何大标题 */}
              <div className="flex flex-col justify-center">
                <div className="font-pixel text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[0.96]">
                  <span className="pixel-char">S</span><span className="pixel-char">P</span><span className="pixel-char">E</span><span className="pixel-char">L</span><span className="pixel-char">L</span><span className="pixel-char">C</span><span className="pixel-char">R</span><span className="pixel-char">A</span><span className="pixel-char">F</span><span className="pixel-char">T</span>,
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300">
                    <span className="pixel-char">R</span><span className="pixel-char">E</span><span className="pixel-char">A</span><span className="pixel-char">L</span><span className="pixel-char">I</span><span className="pixel-char">Z</span><span className="pixel-char">E</span><span className="pixel-char">D</span>.
                  </span>
                </div>
              </div>
            </div>

            {/* 中文主标语与副标 */}
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mt-1 lg:mt-2">
              <h2 className="text-base sm:text-xl lg:text-2xl font-display font-bold text-white tracking-wide">
                咒语构建终端
              </h2>
              <span className="text-white/40 font-mono text-[11px] sm:text-xs">// PROMPT MANAGER</span>
            </div>

            {/* 移动端隐藏的金句段落 */}
            <h1 className="hidden lg:block mt-2 text-base sm:text-lg font-medium text-cyan-400/90">
              把散落的灵感，收成可再咏的咒语
            </h1>

            {/* 移动端隐藏的官方原生体验复刻副段落 */}
            <p className="hidden lg:block mt-3 text-sm sm:text-base text-white/65 leading-relaxed max-w-xl font-normal">
              深度复刻 NovelAI 官方原生级生图体验与核心参数生态，并针对提示词工程与创作流进行全方位现代化升维与效率优化，提供模块化串编排、画师军火库及灵感反推管理。
            </p>

            {/* 移动端隐藏的 4 格特性矩阵 */}
            <div className="hidden lg:grid grid-cols-2 gap-3 sm:gap-4 mt-8 pt-8 border-t border-white/10 w-full">
              <div className="group p-3 sm:p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400/80 mb-1">
                  <span>01 // CHAINS</span>
                  <svg className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                </div>
                <div className="font-semibold text-sm text-white/90">提示词串编排</div>
                <div className="text-[12px] text-white/45 mt-0.5">模块化组装与快速复用</div>
              </div>

              <div className="group p-3 sm:p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400/80 mb-1">
                  <span>02 // ARSENAL</span>
                  <svg className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                </div>
                <div className="font-semibold text-sm text-white/90">画师军火库</div>
                <div className="text-[12px] text-white/45 mt-0.5">千位画师权重语法混编</div>
              </div>

              <div className="group p-3 sm:p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400/80 mb-1">
                  <span>03 // INSPIRATION</span>
                  <svg className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                </div>
                <div className="font-semibold text-sm text-white/90">灵感图库</div>
                <div className="text-[12px] text-white/45 mt-0.5">精选作品与参数反推提取</div>
              </div>

              <div className="group p-3 sm:p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400/80 mb-1">
                  <span>04 // LAB</span>
                  <svg className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                </div>
                <div className="font-semibold text-sm text-white/90">生图实验室</div>
                <div className="text-[12px] text-white/45 mt-0.5">多角色与 Vibe 传递</div>
              </div>
            </div>
          </section>

          {/* 右侧：控制台登录卡片 */}
          <div className="w-full max-w-md mx-auto lg:ml-auto lp-login-col">
            <div className="terminal-card rounded-2xl p-5 sm:p-7 lg:p-8 relative overflow-hidden w-full auth-card">
              {/* 顶部状态指示灯 */}
              <div className="flex items-center gap-2 pb-3.5 sm:pb-4 border-b border-white/10 mb-4 sm:mb-5 auth-card-traffic">
                <span className="size-2 sm:size-2.5 rounded-full bg-red-500/80" />
                <span className="size-2 sm:size-2.5 rounded-full bg-amber-500/80" />
                <span className="size-2 sm:size-2.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              </div>

              <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-white tracking-tight mb-4 auth-title">
                终端登录
              </h2>

              {/* Discord 一键登录 */}
              {discordEnabled ? (
                <button
                  type="button"
                  onClick={() => { window.location.href = '/api/auth/discord'; }}
                  className="auth-discord group relative w-full h-10 sm:h-11 rounded-xl bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#6975f5] hover:to-[#535ecf] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(88,101,242,0.35)] transition-all active:scale-[0.98] overflow-hidden cursor-pointer"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <IconDiscord />
                  <span>使用 Discord 账号登录</span>
                </button>
              ) : (
                <p className="auth-error font-mono text-xs my-2 text-white/50">Discord 登录尚未配置</p>
              )}

              {/* OR PASSWORD 分割线 */}
              <div className="relative flex items-center justify-center my-3.5 sm:my-4 auth-divider">
                <div className="w-full border-t border-white/10" />
                <span className="absolute bg-[#0b0e15] px-2.5 font-mono text-[10px] sm:text-[11px] text-white/40 tracking-wider">
                  OR PASSWORD
                </span>
              </div>

              {/* 表单区 */}
              <form className="space-y-3 sm:space-y-3.5 auth-form" onSubmit={onSubmit} autoComplete="on">
                <div>
                  <label htmlFor="landing-username" className="block text-[11px] sm:text-xs font-mono text-white/70 mb-1 tracking-wide">
                    USERNAME // 用户名
                  </label>
                  <input
                    id="landing-username"
                    name="username"
                    type="text"
                    value={loginUser}
                    onChange={(e) => onLoginUserChange(e.target.value)}
                    placeholder="输入用户名"
                    className="terminal-input w-full h-9 sm:h-10 rounded-xl px-3 text-xs sm:text-sm text-white placeholder-white/25 outline-none font-mono"
                    autoComplete="username"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="landing-password" className="block text-[11px] sm:text-xs font-mono text-white/70 tracking-wide">
                      ACCESS KEY // 密码口令
                    </label>
                  </div>
                  <input
                    id="landing-password"
                    name="password"
                    type="password"
                    value={loginPass}
                    onChange={(e) => onLoginPassChange(e.target.value)}
                    placeholder="••••••••"
                    className="terminal-input w-full h-9 sm:h-10 rounded-xl px-3 text-xs sm:text-sm text-white placeholder-white/25 outline-none font-mono"
                    autoComplete="current-password"
                    required
                  />
                </div>

                {loginError ? (
                  <p className="auth-error font-mono text-xs text-red-400 text-center my-1" aria-live="polite">
                    {loginError}
                  </p>
                ) : null}

                {/* 登录提交按钮 (进入终端) */}
                <button
                  type="submit"
                  className="w-full h-9 sm:h-10 rounded-xl bg-white text-black hover:bg-cyan-300 font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-[0_2px_15px_rgba(255,255,255,0.2)] active:scale-[0.98] mt-1.5 flex items-center justify-center gap-1.5 group cursor-pointer"
                >
                  <span>进入终端</span>
                  <svg className="size-3.5 sm:size-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function DbSetupError() {
  return (
    <div className="landing db-error">
      <LandingCanvas />
      <div className="landing-glow" aria-hidden="true" />
      <header className="lp-top" />
      <main className="lp-stage db-error-stage">
        <div className="auth-card">
          <Empty
            title="数据库未连接"
            description="请在 Cloudflare 后台绑定 D1 数据库到变量 DB 并重新部署。"
            action={(
              <Button type="button" variant="primary" onClick={() => window.location.reload()}>
                刷新
              </Button>
            )}
          />
        </div>
      </main>
    </div>
  );
}


