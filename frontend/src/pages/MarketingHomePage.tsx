import { useEffect, useState } from 'react'
import heroImage from '../assets/central-asia-hero.webp'
import galleryImage from '../assets/central-asia-gallery.webp'
import wechatContactQr from '../assets/wechat-contact-qr.jpg'
import { setPageSeo } from '../seo'

const brandName = '吉速通出入境服务'

const navItems = [
  { label: '首页', mobile: true, mobileLabel: '首页', href: '#home' },
  { label: '签证办理', mobile: true, mobileLabel: '服务项目', href: '#visa' },
  { label: '公司办理', href: '#business' },
  { label: '财税服务', href: '#tax' },
  { label: '关于我们', href: '#about' },
  { label: '联系我们', mobile: true, mobileLabel: '联系我们', href: '#contact' },
]

const serviceCards = [
  {
    title: '签证办理',
    summary: '吉尔吉斯斯坦、塔吉克斯坦签证材料清单、资料预审和办理跟进。',
    points: ['材料清单确认', '资料预审', '进度反馈'],
    icon: 'passport',
  },
  {
    title: '公司办理',
    summary: '面向中亚业务落地需求，协助公司注册、文件准备和本地对接。',
    points: ['公司注册', '商务邀请', '本地协助'],
    icon: 'building',
  },
  {
    title: '财税服务',
    summary: '提供税务咨询、记账申报、合规维护等后续企业服务。',
    points: ['税务咨询', '记账申报', '合规维护'],
    icon: 'calculator',
  },
  {
    title: '商务落地',
    summary: '为个人与企业客户提供中文沟通、本地资源和长期陪伴支持。',
    points: ['中文服务', '资源对接', '长期陪伴'],
    icon: 'handshake',
  },
]

const visaServices = [
  {
    country: '吉尔吉斯斯坦签证',
    description: '适合商务访问、资料准备、邀请协调和入境前咨询。',
    items: ['护照与基础信息核对', '签证材料清单说明', '办理节点跟进'],
  },
  {
    country: '塔吉克斯坦签证',
    description: '适合商务出行、短期访问和企业客户出行安排。',
    items: ['材料完整性检查', '申请信息整理', '出签结果交付'],
  },
]

const businessItems = [
  '公司注册资料准备',
  '商务邀请与落地接待',
  '本地资源协调',
  '后续财税服务衔接',
]

const processSteps = ['咨询需求', '确认材料', '资料审核', '递交办理', '结果交付']

function SiteIcon({ name }: { name: string }) {
  if (name === 'passport') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3.5h8.2A2.8 2.8 0 0 1 18 6.3v11.4a2.8 2.8 0 0 1-2.8 2.8H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" />
        <path d="M9 7.8h5M9 16.2h4.2" />
        <circle cx="11.6" cy="12" r="2.7" />
        <path d="M9.2 12h4.8M11.6 9.3c.8.8 1.2 1.7 1.2 2.7s-.4 1.9-1.2 2.7M11.6 9.3c-.8.8-1.2 1.7-1.2 2.7s.4 1.9 1.2 2.7" />
      </svg>
    )
  }

  if (name === 'building') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.8 20.5h14.4M7 20.5V5.3l5-2 5 2v15.2" />
        <path d="M9.2 8h1.2M13.6 8h1.2M9.2 11.4h1.2M13.6 11.4h1.2M9.2 14.8h1.2M13.6 14.8h1.2" />
      </svg>
    )
  }

  if (name === 'calculator') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="6" y="3.8" width="12" height="16.4" rx="2" />
        <path d="M8.8 7.2h6.4M9 11h.1M12 11h.1M15 11h.1M9 14h.1M12 14h.1M15 14h.1M9 17h3.1M15 17h.1" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8.2 12.2 2.4 2.4a2 2 0 0 0 2.8 0l5.1-5.1a2.1 2.1 0 0 0-3-3l-.7.7" />
      <path d="m15.8 11.8-2.4-2.4a2 2 0 0 0-2.8 0l-5.1 5.1a2.1 2.1 0 0 0 3 3l.7-.7" />
    </svg>
  )
}

export function MarketingHomePage() {
  const [wechatOpen, setWechatOpen] = useState(false)

  useEffect(() => {
    setPageSeo({
      title: '吉速通出入境服务｜吉尔吉斯斯坦、塔吉克斯坦签证与商务落地服务',
      description: '吉速通出入境服务提供吉尔吉斯斯坦、塔吉克斯坦签证办理、公司办理、财税服务与商务落地协助。',
      path: '/',
      keywords: ['吉尔吉斯斯坦签证', '塔吉克斯坦签证', '中亚签证办理', '吉尔吉斯斯坦商务签证'],
    })
  }, [])

  return (
    <main className="marketing-site" id="home">
      <header className="site-header">
        <a className="site-brand" href="#home" aria-label="返回首页">
          <span className="site-brand-mark">
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <path d="M6 34.5 17.3 16l7.3 11.5 5.8-8.7L42 34.5H6Z" />
              <path d="m18 16 3.7 18.5M30.4 18.8l-4.2 15.7" />
            </svg>
          </span>
          <span>
            <strong>{brandName}</strong>
            <em>签证办理 · 公司办理 · 财税服务</em>
          </span>
        </a>
        <nav className="site-nav" aria-label="网站导航">
          {navItems.map((item) => (
            <a className={item.mobile ? undefined : 'site-nav-optional'} href={item.href} key={item.href}>
              <span className="site-nav-label-full">{item.label}</span>
              <span className="site-nav-label-short">{item.mobileLabel || item.label}</span>
            </a>
          ))}
        </nav>
        <button className="site-header-contact" onClick={() => setWechatOpen(true)} type="button">
          <span>微信咨询</span>
          <strong>扫码添加顾问</strong>
        </button>
      </header>

      <section className="site-hero" aria-label="首页首屏">
        <img src={heroImage} alt="吉尔吉斯斯坦和塔吉克斯坦自然风貌" />
        <div className="site-hero-content">
          <h1>吉尔吉斯斯坦、塔吉克斯坦签证与商务落地服务</h1>
          <p>为中国客户提供签证办理、公司注册、财税咨询与本地协助。</p>
          <div className="site-hero-actions" aria-label="主要咨询入口">
            <button className="site-button site-button-primary" onClick={() => setWechatOpen(true)} type="button">
              立即咨询
            </button>
            <a className="site-button site-button-light" href="#visa">
              查看签证材料
            </a>
            <a className="site-button site-button-gold" href="#business">
              企业服务咨询
            </a>
          </div>
        </div>
      </section>

      <section className="site-section site-service-strip" aria-label="核心业务">
        <div className="site-grid site-service-grid">
          {serviceCards.map((card) => (
            <article className="site-service-card" key={card.title}>
              <div className="site-service-icon">
                <SiteIcon name={card.icon} />
              </div>
              <div>
                <h2>{card.title}</h2>
                <p>{card.summary}</p>
              </div>
              <ul>
                {card.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-visa-section" id="visa">
        <div className="site-section-heading">
          <h2>签证办理</h2>
          <p>先确认目的国家、出行目的和材料基础，再给出清晰的资料清单与办理建议。</p>
        </div>
        <div className="site-visa-grid">
          {visaServices.map((service) => (
            <article className="site-visa-card" key={service.country}>
              <span>{service.country}</span>
              <h3>{service.description}</h3>
              <ul>
                {service.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="site-guide-strip">
          <div>
            <span>签证指南</span>
            <strong>费用、材料和商务签证问题，集中放到指南中心查看。</strong>
          </div>
          <a className="site-guide-link" href="/visa">
            查看签证指南
          </a>
        </div>
      </section>

      <section className="site-section site-scenery-section" aria-label="国家自然风貌展示">
        <div className="site-section-heading">
          <h2>走进吉尔吉斯斯坦与塔吉克斯坦</h2>
          <p>展示国家气质，不销售旅行行程。让客户先看到真实的地域感，再理解我们的本地服务能力。</p>
        </div>
        <figure className="site-scenery-frame">
          <img src={galleryImage} alt="雪山、湖泊、草原、帕米尔高原与丝路文化" />
          <figcaption>
            <span>雪山</span>
            <span>湖泊</span>
            <span>草原</span>
            <span>帕米尔高原</span>
            <span>丝路文化</span>
          </figcaption>
        </figure>
      </section>

      <section className="site-section site-business-section" id="business">
        <div className="site-business-panel">
          <div>
            <h2>企业服务</h2>
            <p>
              针对计划在中亚开展业务的客户，先协助梳理资料、办理路径和本地协作事项，再进入后续公司办理或商务落地流程。
            </p>
          </div>
          <div className="site-business-list">
            {businessItems.map((item, index) => (
              <div key={item}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="site-guide-strip">
          <div>
            <span>公司注册指南</span>
            <strong>费用、材料、外资股东、LLC 注册和税务记账问题，集中放到指南中心查看。</strong>
          </div>
          <a className="site-guide-link" href="/company">
            查看公司注册指南
          </a>
        </div>
      </section>

      <section className="site-section site-tax-section" id="tax">
        <div className="site-section-heading">
          <h2>财税服务</h2>
          <p>公司成立只是开始，后续税务咨询、记账申报和合规维护同样需要稳定跟进。</p>
        </div>
        <div className="site-tax-layout">
          <article>
            <h3>税务咨询</h3>
            <p>根据企业经营模式，说明基础税务事项、申报节奏和常见合规风险。</p>
          </article>
          <article>
            <h3>记账申报</h3>
            <p>协助企业客户整理财务资料，衔接当地记账和申报服务。</p>
          </article>
          <article>
            <h3>长期维护</h3>
            <p>保持中文沟通和定期提醒，降低跨境经营中的信息差。</p>
          </article>
        </div>
      </section>

      <section className="site-section site-process-section" aria-label="办理流程">
        <div className="site-section-heading">
          <h2>办理流程</h2>
          <p>用固定节点管理服务过程，让客户知道现在进行到哪一步。</p>
        </div>
        <ol className="site-process-list">
          {processSteps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="site-section site-about-section" id="about">
        <div className="site-about-copy">
          <h2>关于我们</h2>
          <p>
            我们专注服务中国客户在吉尔吉斯斯坦、塔吉克斯坦的签证办理、公司办理、财税咨询与商务落地需求。通过中文沟通、材料预审和本地协助，帮助客户减少跨境办理中的信息差。
          </p>
        </div>
        <div className="site-about-values">
          <div>
            <strong>中文沟通</strong>
            <span>减少跨境办理信息差</span>
          </div>
          <div>
            <strong>材料预审</strong>
            <span>先核对，再进入办理</span>
          </div>
          <div>
            <strong>本地协助</strong>
            <span>对接当地资源与流程</span>
          </div>
        </div>
      </section>

      <section className="site-contact-section" id="contact">
        <div>
          <h2>需要办理签证、公司或财税服务？</h2>
          <p>把目的国家、办理事项和预计时间发给我们，先确认路径和材料清单。</p>
        </div>
        <div className="site-contact-actions">
          <button className="site-button site-button-light" onClick={() => setWechatOpen(true)} type="button">
            微信咨询
          </button>
        </div>
      </section>

      <footer className="site-footer">
        <span>{brandName}</span>
        <a href="/visa">签证指南</a>
        <a href="/company">公司注册指南</a>
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
