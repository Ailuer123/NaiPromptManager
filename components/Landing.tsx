import React from 'react';
import { Atmosphere } from './Atmosphere';
import { ThemePicker } from './ThemePicker';
import { Button } from './ui/Button';
import { Seg } from './ui/Chip';
import { Empty } from './ui/Empty';
import { Field, Input } from './ui/Field';

const AUTH_TABS = [
  { value: 'user', label: '账号登录' },
  { value: 'guest', label: '游客参观' },
] as const;

const MODULES = [
  {
    title: '串看板',
    desc: '画师串与角色串分栏，标签筛选后进入编辑。',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M4 12h10M4 17h14" />
      </svg>
    ),
  },
  {
    title: '提示词结构',
    desc: '模块按前置 / 后置插入，编译结果分段可检。',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 20l-4 1 1-4 11.5-13.5z" />
      </svg>
    ),
  },
  {
    title: '军火库',
    desc: '画师组合进购物车，按权重插入当前串。',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="M3 16l4.5-3.5L11 15l3-2.5L21 17" />
      </svg>
    ),
  },
  {
    title: '生图实验室',
    desc: '同一提示词一次出多张，对比采样与强度。',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 3h6l1 4H8l1-4z" />
        <path d="M8 7h8v3a4 4 0 0 1-8 0V7z" />
        <path d="M10 14v7M14 14v7" />
      </svg>
    ),
  },
  {
    title: '生成历史',
    desc: '本地留图，可复用参数或发布到灵感库。',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
] as const;

export type LandingProps = {
  isGuestMode: boolean;
  onGuestModeChange: (guest: boolean) => void;
  loginUser: string;
  loginPass: string;
  guestPasscode: string;
  loginError: string;
  onLoginUserChange: (value: string) => void;
  onLoginPassChange: (value: string) => void;
  onGuestPasscodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function Landing({
  isGuestMode,
  onGuestModeChange,
  loginUser,
  loginPass,
  guestPasscode,
  loginError,
  onLoginUserChange,
  onLoginPassChange,
  onGuestPasscodeChange,
  onSubmit,
}: LandingProps) {
  return (
    <div className="landing">
      <Atmosphere />
      <div className="lp-top">
        <div className="brand">
          <div className="brand-mark">NA</div>
          <div className="brand-text">
            <strong>NAI 咒语构建终端</strong>
          </div>
        </div>
        <ThemePicker />
      </div>

      <div className="lp-stage">
        <section className="lp-intro" aria-label="产品介绍">
          <h1>把画师、模块与参数，编译成可复用的咒语</h1>
          <p className="lp-intro-lead">
            一条流水线：基础画风 → 前置模块 → 主体 → 后置模块。看板管串，实验室做对比。
          </p>
          <ul className="lp-modules">
            {MODULES.map((mod) => (
              <li key={mod.title} className="lp-mod">
                <div className="lp-mod-icon" aria-hidden="true">{mod.icon}</div>
                <div className="lp-mod-body">
                  <strong>{mod.title}</strong>
                  <span>{mod.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="lp-login-col">
          <div className="auth-card glass-strong">
            <h2 className="auth-title">登录</h2>
            <Seg
              fill
              aria-label="登录方式"
              value={isGuestMode ? 'guest' : 'user'}
              onChange={(value) => onGuestModeChange(value === 'guest')}
              options={AUTH_TABS}
            />
            <form className="auth-form" onSubmit={onSubmit} autoComplete="on">
              {!isGuestMode ? (
                <>
                  <Field label="用户名">
                    <Input
                      name="username"
                      value={loginUser}
                      onChange={(e) => onLoginUserChange(e.target.value)}
                      placeholder="用户名"
                      autoComplete="username"
                      autoFocus
                    />
                  </Field>
                  <Field label="密码">
                    <Input
                      name="password"
                      type="password"
                      value={loginPass}
                      onChange={(e) => onLoginPassChange(e.target.value)}
                      placeholder="密码"
                      autoComplete="current-password"
                    />
                  </Field>
                </>
              ) : (
                <Field
                  label="游客口令"
                  hint="游客可查看提示词，填入 API Key 后可测试生图 (数据仅存本地)"
                >
                  <Input
                    name="guest-passcode"
                    type="password"
                    value={guestPasscode}
                    onChange={(e) => onGuestPasscodeChange(e.target.value)}
                    placeholder="输入游客口令"
                    autoComplete="off"
                    autoFocus
                  />
                </Field>
              )}
              {loginError ? (
                <p className="auth-error" aria-live="polite">{loginError}</p>
              ) : null}
              <Button type="submit" variant="primary" size="lg" block>
                {isGuestMode ? '进入参观' : '登录'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DbSetupError() {
  return (
    <div className="landing db-error">
      <Atmosphere />
      <div className="lp-top">
        <div className="brand">
          <div className="brand-mark">NA</div>
          <div className="brand-text">
            <strong>NAI 咒语构建终端</strong>
          </div>
        </div>
        <ThemePicker />
      </div>
      <div className="lp-stage db-error-stage">
        <div className="auth-card glass-strong">
          <Empty
            title="数据库未连接"
            description="请在 Cloudflare 后台绑定 D1 数据库到变量 DB 并重新部署。"
            action={(
              <Button type="button" onClick={() => window.location.reload()}>
                刷新
              </Button>
            )}
          />
        </div>
      </div>
    </div>
  );
}
