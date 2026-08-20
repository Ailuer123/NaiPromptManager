import React from 'react';
import { APP_DISCORD_URL, APP_NAME, APP_REPO_URL, APP_VERSION, repoDisplayName } from '../app/version';
import { BrandMark } from './BrandMark';
import { IconDiscord, IconExternal, IconGithub } from './ui/glyphs';

export function AboutPage() {
  const repo = repoDisplayName(APP_REPO_URL);

  return (
    <div className="settings-prose">
      <section className="settings-block">
        <div className="settings-block-head">
          <h3>关于</h3>
        </div>
        <div className="about-identity">
          <div className="about-logo">
            <BrandMark title={APP_NAME} />
            <strong>{APP_NAME}</strong>
          </div>
          <div className="about-meta">
            <span className="about-ver">v{APP_VERSION}</span>
          </div>
        </div>
      </section>

      <section className="settings-block">
        <div className="settings-block-head">
          <h3>产品信息</h3>
        </div>
        <div className="about-links">
          <a
            href={APP_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="about-link"
          >
            <span className="about-link-k">
              <IconGithub />
              仓库
            </span>
            <span className="about-link-v">
              <span className="truncate">{repo}</span>
              <IconExternal />
            </span>
          </a>
          <a
            href={APP_DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            className="about-link"
          >
            <span className="about-link-k">
              <IconDiscord />
              Discord
            </span>
            <span className="about-link-v">
              <span className="truncate">社区</span>
              <IconExternal />
            </span>
          </a>
        </div>
      </section>
    </div>
  );
}
