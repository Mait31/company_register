import { useEffect, useState } from 'react'
import wechatContactQr from '../assets/wechat-contact-qr.jpg'
import { visaSeoPages } from '../data/visaSeoPages'
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

export function VisaGuidePage() {
  const [wechatOpen, setWechatOpen] = useState(false)

  useEffect(() => {
    setPageSeo({
      title: '吉尔吉斯斯坦签证指南｜费用、材料与办理咨询｜吉速通',
      description:
        '吉速通出入境服务整理吉尔吉斯斯坦签证费用、商务签证、材料清单和办理咨询入口，面向中国客户提供中文服务。',
      path: '/visa',
      keywords: ['吉尔吉斯斯坦签证指南', '吉尔吉斯斯坦签证费用', '吉尔吉斯斯坦签证材料', '吉尔吉斯斯坦商务签证'],
    })
  }, [])

  return (
    <main className="marketing-site visa-guide-site" id="top">
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
          <a href="/#visa">
            <span className="site-nav-label-full">签证办理</span>
            <span className="site-nav-label-short">服务项目</span>
          </a>
          <a className="site-nav-optional" href="/#business">
            <span className="site-nav-label-full">企业服务</span>
            <span className="site-nav-label-short">企业服务</span>
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
        <span className="seo-eyebrow">签证指南中心</span>
        <h1>吉尔吉斯斯坦签证费用、材料与办理咨询</h1>
        <p>
          这里集中放置客户常问的问题。先了解费用影响因素和材料清单，再把出行目的、预计时间和现有资料发给顾问确认。
        </p>
        <div className="seo-hero-actions">
          <button className="site-button site-button-primary" onClick={() => setWechatOpen(true)} type="button">
            微信咨询
          </button>
          <a className="site-button site-button-light" href="/#visa">
            返回签证服务
          </a>
        </div>
      </section>

      <section className="visa-guide-summary" aria-label="签证咨询重点">
        <article>
          <span>01</span>
          <h2>费用先看场景</h2>
          <p>商务访问、短期停留、邀请文件和本地协助都会影响费用，不能只按一个固定价格判断。</p>
        </article>
        <article>
          <span>02</span>
          <h2>材料先做预审</h2>
          <p>护照、出行目的、停留时间和邀请方信息要先核对，避免按错误清单准备。</p>
        </article>
        <article>
          <span>03</span>
          <h2>中文沟通跟进</h2>
          <p>咨询、材料清单、办理节点和结果交付都以中文沟通，减少跨境办理信息差。</p>
        </article>
      </section>

      <section className="seo-related-section visa-guide-list">
        <div className="site-section-heading">
          <h2>常见签证问题</h2>
          <p>以下页面按搜索问题拆分，分别说明费用影响因素、材料准备和办理路径。</p>
        </div>
        <div className="site-seo-link-grid">
          {visaSeoPages.map((page) => (
            <a className="site-seo-link-card" href={page.path} key={page.slug}>
              <span>{page.keyword}</span>
              <strong>{page.h1}</strong>
            </a>
          ))}
        </div>
      </section>

      <section className="site-contact-section" id="contact">
        <div>
          <h2>不确定自己适合哪种办理路径？</h2>
          <p>把目的国家、办理事项和预计时间发给我们，先确认材料清单和费用影响因素。</p>
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
        <a href="/visa/jierjisisitan-qianzheng">吉尔吉斯斯坦签证</a>
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
