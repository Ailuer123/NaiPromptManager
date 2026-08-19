import React from 'react';
import { Atmosphere } from './Atmosphere';
import { BrandMark } from './BrandMark';
import { ThemePicker } from './ThemePicker';
import { ModeSwitch } from './ui/ModeSwitch';
import { Button } from './ui/Button';
import { Seg } from './ui/Chip';
import { Field, Input } from './ui/Field';

const AUTH_TABS = [
  { value: 'user', label: '账号登录' },
  { value: 'guest', label: '游客参观' },
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
          <BrandMark />
          <div className="brand-text">
            <strong>NAI 咒语构建终端</strong>
          </div>
        </div>
        <div className="top-actions">
          <ModeSwitch />
          <ThemePicker />
        </div>
      </div>

      <div className="lp-stage">
        <section className="lp-intro" aria-label="产品介绍">
          <h1>把散落的灵感，收成可再咏的咒语</h1>
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
                <Field label="游客口令">
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
          <BrandMark />
          <div className="brand-text">
            <strong>NAI 咒语构建终端</strong>
          </div>
        </div>
        <div className="top-actions">
          <ModeSwitch />
          <ThemePicker />
        </div>
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
