import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import wechatContactQr from '../assets/wechat-contact-qr.jpg'
import { visaSeoPages, visaSeoPagesBySlug } from '../data/visaSeoPages'
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

export function VisaSeoPage() {
  const { slug } = useParams()
  const [wechatOpen, setWechatOpen] = useState(false)
  const page = slug ? visaSeoPagesBySlug[slug] : undefined

  const relatedPages = useMemo(() => visaSeoPages.filter((item) => item.slug !== slug).slice(0, 4), [slug])

  useEffect(() => {
    if (!page) {
      return
    }

    setPageSeo({
      title: page.title,
      description: page.description,
      path: page.path,
      keywords: [page.keyword, '吉尔吉斯斯坦签证办理', '吉尔吉斯斯坦商务签证', '中亚签证服务'],
    })
  }, [page])

  if (!page) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="marketing-site seo-site" id="top">
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

      <section className="seo-hero">
        <div>
          <span className="seo-eyebrow">吉尔吉斯斯坦签证咨询</span>
          <h1>{page.h1}</h1>
          <p>{page.intro}</p>
          <div className="seo-hero-actions">
            <button className="site-button site-button-primary" onClick={() => setWechatOpen(true)} type="button">
              微信咨询费用
            </button>
            <a className="site-button site-button-light" href="#materials">
              查看所需材料
            </a>
          </div>
        </div>
        <aside className="seo-intent-card" aria-label="关键词信息">
          <span>常见搜索</span>
          <strong>{page.keyword}</strong>
          <em>先核对材料，再确认费用和办理路径</em>
        </aside>
      </section>

      <section className="seo-content-grid">
        <article className="seo-answer-card">
          <h2>{page.keyword}怎么判断？</h2>
          <p>{page.directAnswer}</p>
        </article>
        <article className="seo-answer-card">
          <h2>费用通常看哪些因素</h2>
          <ul>
            {page.costFactors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="seo-panel" id="materials">
        <div className="site-section-heading">
          <h2>先准备这些信息</h2>
          <p>咨询前先准备基础信息，顾问才能判断费用、材料和办理路径。</p>
        </div>
        <div className="seo-list-grid">
          {page.checklist.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      </section>

      <section className="seo-panel">
        <div className="site-section-heading">
          <h2>办理咨询流程</h2>
          <p>先判断材料和可办理路径，再进入正式办理，减少反复补充。</p>
        </div>
        <ol className="site-process-list">
          {page.processNotes.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="seo-panel">
        <div className="site-section-heading">
          <h2>常见问题</h2>
        </div>
        <div className="seo-faq-list">
          {page.faqs.map((faq) => (
            <article key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="seo-related-section">
        <div className="site-section-heading">
          <h2>相关签证费用问题</h2>
          <p>不同说法背后对应的材料和办理场景不同，可以继续查看相近问题。</p>
        </div>
        <div className="site-seo-link-grid">
          {relatedPages.map((item) => (
            <a className="site-seo-link-card" href={item.path} key={item.slug}>
              <span>{item.keyword}</span>
              <strong>{item.h1}</strong>
            </a>
          ))}
        </div>
      </section>

      <section className="site-contact-section" id="contact">
        <div>
          <h2>需要确认吉尔吉斯斯坦签证费用？</h2>
          <p>把出行目的、预计时间和现有材料发给我们，先确认路径和材料清单。</p>
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
        <a href="/#visa">签证办理</a>
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
