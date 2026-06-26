import { useEffect, useState } from 'react'
import wechatContactQr from '../assets/wechat-contact-qr.jpg'
import { companyGuidePages } from '../data/companyGuidePages'
import { setPageSeo } from '../seo'

const brandName = '吉速通出入境服务'

function MountainMark() {
  return (
    <span className="site-brand-mark">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M6 34.5 17.3 16l7.3 11.5 5.8-8.7L42 34.5H6Z" />
        <path d="m18 16 3.7 18.5M30.4 18.8l-4.2 15.7" />
      </svg>
    </span>
  )
}

export function CompanyGuidePage() {
  const [wechatOpen, setWechatOpen] = useState(false)

  useEffect(() => {
    setPageSeo({
      title: '吉尔吉斯斯坦公司注册指南｜材料、费用、流程与税务｜吉速通',
      description:
        '吉速通出入境服务整理吉尔吉斯斯坦公司注册费用、材料、流程、外资股东、LLC/ОсОО、税务记账和银行开户问题。',
      path: '/company',
      keywords: ['吉尔吉斯斯坦公司注册', '吉尔吉斯斯坦注册公司', '吉尔吉斯斯坦 LLC 注册', '吉尔吉斯斯坦公司税务'],
    })
  }, [])

  return (
    <main className="marketing-site company-guide-site" id="top">
      <header className="site-header">
        <a className="site-brand" href="/" aria-label="返回首页">
          <MountainMark />
          <span>
            <strong>{brandName}</strong>
            <em>签证办理 · 公司办理 · 财税服务</em>
          </span>
        </a>
        <nav className="site-nav" aria-label="网站导航">
          <a href="/">
            <span className="site-nav-label-full">首页</span>
            <span className="site-nav-label-short">首页</span>
          </a>
          <a href="/#business">
            <span className="site-nav-label-full">公司办理</span>
            <span className="site-nav-label-short">服务项目</span>
          </a>
          <a className="site-nav-optional" href="/visa">
            <span className="site-nav-label-full">签证指南</span>
            <span className="site-nav-label-short">签证指南</span>
          </a>
          <a href="/#contact">
            <span className="site-nav-label-full">联系我们</span>
            <span className="site-nav-label-short">联系我们</span>
          </a>
        </nav>
        <button className="site-header-contact" onClick={() => setWechatOpen(true)} type="button">
          <span>微信咨询</span>
          <strong>扫码添加顾问</strong>
        </button>
      </header>

      <section className="visa-guide-hero">
        <span className="seo-eyebrow">公司注册指南中心</span>
        <h1>吉尔吉斯斯坦公司注册材料、费用与合规咨询</h1>
        <p>
          这里集中放置客户常问的公司注册问题。先看股东身份、材料清单、费用构成和税务银行衔接，再把实际经营计划发给顾问确认。
        </p>
        <div className="seo-hero-actions">
          <button className="site-button site-button-primary" onClick={() => setWechatOpen(true)} type="button">
            微信咨询公司注册
          </button>
          <a className="site-button site-button-light" href="/#business">
            返回企业服务
          </a>
        </div>
      </section>

      <section className="visa-guide-summary" aria-label="公司注册咨询重点">
        <article>
          <span>01</span>
          <h2>先判断股东身份</h2>
          <p>中国个人、中国公司、本地合资和外资法人股东对应材料不同，费用和周期也不同。</p>
        </article>
        <article>
          <span>02</span>
          <h2>先拆费用范围</h2>
          <p>政府规费只是很小一部分，翻译、公证、认证、地址、银行开户和会计交接更影响总成本。</p>
        </article>
        <article>
          <span>03</span>
          <h2>注册后还要合规</h2>
          <p>公司成立后还要处理税务制度、印章、银行 KYC、会计记账和可能的行业许可。</p>
        </article>
      </section>

      <section className="seo-related-section visa-guide-list">
        <div className="site-section-heading">
          <h2>常见公司注册问题</h2>
          <p>以下页面按搜索问题拆分，分别说明材料准备、费用判断、注册流程、外资股东和税务记账。</p>
        </div>
        <div className="site-seo-link-grid">
          {companyGuidePages.map((page) => (
            <a className="site-seo-link-card" href={page.path} key={page.slug}>
              <span>{page.keyword}</span>
              <strong>{page.h1}</strong>
            </a>
          ))}
        </div>
      </section>

      <section className="site-contact-section" id="contact">
        <div>
          <h2>准备在吉尔吉斯斯坦注册公司？</h2>
          <p>把股东身份、业务类型、预计时间和现有材料发给我们，先确认材料清单和办理路径。</p>
        </div>
        <div className="site-contact-actions">
          <button className="site-button site-button-light" onClick={() => setWechatOpen(true)} type="button">
            微信咨询
          </button>
        </div>
      </section>

      <footer className="site-footer site-footer-links">
        <span>{brandName}</span>
        <a href="/">首页</a>
        <a href="/company/jierjisisitan-gongsi-zhuce">吉尔吉斯斯坦公司注册</a>
        <a href="/visa">签证指南</a>
        <a href="https://beian.miit.gov.cn/" rel="noreferrer" target="_blank">
          备案号：浙ICP备2026036299号-1
        </a>
      </footer>

      <div className="site-mobile-cta" aria-label="移动端咨询入口">
        <button onClick={() => setWechatOpen(true)} type="button">
          微信咨询
        </button>
      </div>

      {wechatOpen ? (
        <div
          aria-labelledby="wechat-consult-title"
          aria-modal="true"
          className="site-wechat-modal"
          role="dialog"
        >
          <button
            aria-label="关闭微信咨询"
            className="site-wechat-backdrop"
            onClick={() => setWechatOpen(false)}
            type="button"
          />
          <div className="site-wechat-panel">
            <button
              aria-label="关闭"
              className="site-wechat-close"
              onClick={() => setWechatOpen(false)}
              type="button"
            >
              ×
            </button>
            <div className="site-wechat-copy">
              <span>微信咨询</span>
              <h2 id="wechat-consult-title">扫码添加吉速通顾问</h2>
              <p>电脑端请使用微信扫码添加；手机端可长按二维码识别，发送办理国家和需求。</p>
            </div>
            <img alt="吉速通微信咨询二维码" className="site-wechat-qr" src={wechatContactQr} />
          </div>
        </div>
      ) : null}
    </main>
  )
}
