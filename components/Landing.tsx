import React from 'react';
import { Atmosphere } from './Atmosphere';
import { BrandMark } from './BrandMark';
import { ThemePicker } from './ThemePicker';
import { ModeSwitch } from './ui/ModeSwitch';
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
            {discordEnabled ? (
              <Button
                type="button"
                variant="primary"
                size="lg"
                block
                className="auth-discord"
                onClick={() => { window.location.href = '/api/auth/discord'; }}
              >
                <IconDiscord />
                使用 Discord 登录
              </Button>
            ) : (
              <p className="hint">Discord 登录尚未配置</p>
            )}
            <form className="auth-form" onSubmit={onSubmit} autoComplete="on">
              <Field label="用户名">
                <Input
                  name="username"
                  value={loginUser}
                  onChange={(e) => onLoginUserChange(e.target.value)}
                  placeholder="用户名"
                  autoComplete="username"
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
              {loginError ? (
                <p className="auth-error" aria-live="polite">{loginError}</p>
              ) : null}
              <Button type="submit" variant="secondary" size="lg" block>
                登录
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
