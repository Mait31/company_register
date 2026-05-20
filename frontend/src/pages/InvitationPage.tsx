import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Collapse,
  DatePicker,
  Form,
  Input,
  Radio,
  Result,
  Spin,
  Typography,
} from 'antd'
import { useParams } from 'react-router-dom'

type Invitation = {
  id: number
  token: string
  status: string
  allow_forward: boolean
  expires_at: string | null
  remark: string | null
}

type InvitationFormValues = {
  name: string
  mobile?: string
  full_company_name?: string
  company_name_1?: string
  company_name_2?: string
  company_name_3?: string
  legal_address?: string
  director_name?: string
  director_phone?: string
  director_address?: string
  shareholder_note?: string
  registered_capital?: string
  business_scope?: string
  need_registered_address?: boolean
  need_bank_account?: boolean
  need_accounting?: boolean
  tax_regime?: string
  visa_type?: string
  filled_date?: { format: (template: string) => string } | string
}

type WeChatJsSdkSignature = {
  enabled: boolean
  appId?: string
  timestamp?: number
  nonceStr?: string
  signature?: string
  title?: string
  desc?: string
  imgUrl?: string
  reason?: string
}

type ShareOptions = {
  title: string
  desc?: string
  link: string
  imgUrl: string
}

type WeChatJsApi = {
  config: (options: {
    debug: boolean
    appId: string
    timestamp: number
    nonceStr: string
    signature: string
    jsApiList: string[]
  }) => void
  ready: (callback: () => void) => void
  error?: (callback: (error: unknown) => void) => void
  updateAppMessageShareData?: (options: ShareOptions) => void
  updateTimelineShareData?: (options: ShareOptions) => void
  onMenuShareAppMessage?: (options: ShareOptions) => void
  onMenuShareTimeline?: (options: ShareOptions) => void
}

declare global {
  interface Window {
    wx?: WeChatJsApi
  }
}

function loadWechatJsSdk() {
  return new Promise<void>((resolve, reject) => {
    if (window.wx) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-wechat-js-sdk="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('wechat_js_sdk_load_failed')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
    script.async = true
    script.dataset.wechatJsSdk = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('wechat_js_sdk_load_failed'))
    document.head.appendChild(script)
  })
}

async function setupWechatShare() {
  const signUrl = window.location.href.split('#')[0]
  const response = await fetch(`/api/wechat/js-sdk-signature?url=${encodeURIComponent(signUrl)}`)
  if (!response.ok) {
    console.warn('wechat signature failed', response.status)
    return
  }

  const config = (await response.json()) as WeChatJsSdkSignature
  if (!config.enabled || !config.appId || !config.timestamp || !config.nonceStr || !config.signature) {
    console.warn('wechat js sdk disabled', config.reason || 'missing config')
    return
  }

  await loadWechatJsSdk()
  const wx = window.wx
  if (!wx) {
    console.warn('window.wx missing')
    return
  }

  const share: ShareOptions = {
    title: config.title || '公司注册信息登记',
    desc: config.desc || '请填写公司注册登记信息，便于后续资料整理与业务确认',
    link: signUrl,
    imgUrl: config.imgUrl || `${window.location.origin}/wechat-share.png`,
  }

  wx.config({
    debug: false,
    appId: config.appId,
    timestamp: config.timestamp,
    nonceStr: config.nonceStr,
    signature: config.signature,
    jsApiList: [
      'updateAppMessageShareData',
      'updateTimelineShareData',
      'onMenuShareAppMessage',
      'onMenuShareTimeline',
    ],
  })

  wx.ready(() => {
    wx.updateAppMessageShareData?.(share)
    wx.updateTimelineShareData?.(share)
    wx.onMenuShareAppMessage?.(share)
    wx.onMenuShareTimeline?.(share)
  })

  wx.error?.((error) => {
    console.warn('wechat config error', error)
  })
}

const faqItems = [
  {
    key: 'company-name',
    label: '公司名称怎么填？',
    children: '填写希望注册的完整公司名称即可。如果还不确定俄文或公司类型，可以先填写中文名称，后续由内部人员整理确认。',
  },
  {
    key: 'legal-address',
    label: '没有注册地址怎么办？',
    children: '可以留空。没有注册地址时，内部人员会根据业务情况协助安排注册地址和相关合同。',
  },
  {
    key: 'shareholder',
    label: '股东信息怎么写？',
    children: '写清楚每位股东的姓名、股份比例和居住地址。股份比例合计应为 100%。',
  },
  {
    key: 'capital',
    label: '注册资金填多少？',
    children: '按实际计划填写，不是越高越好。如果不确定，可以先填写预期金额，后续再结合注册、银行和税务要求确认。',
  },
  {
    key: 'scope',
    label: '经营范围怎么写？',
    children: '用中文写主要业务即可，例如商品进出口、设备进出口、家具贸易等。内部会整理成注册可用表述。',
  },
  {
    key: 'tax',
    label: '税务制度不确定怎么选？',
    children: '不确定时请选择“待确认”。税务制度需要结合业务类型、开票和后续经营情况确认。',
  },
]

const fieldGroups = [
  { key: 'company', label: '公司信息' },
  { key: 'people', label: '人员与股东' },
  { key: 'business', label: '经营与税务' },
  { key: 'contact', label: '提交人' },
]

export function InvitationPage() {
  const { token } = useParams()
  const [form] = Form.useForm<InvitationFormValues>()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savedParticipantId, setSavedParticipantId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initialValues = useMemo(
    () => ({
      need_registered_address: false,
      need_bank_account: true,
      need_accounting: true,
      tax_regime: '待确认',
    }),
    [],
  )

  useEffect(() => {
    async function loadInvitation() {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/invitations/${token}`)
        if (!response.ok) {
          throw new Error('登记入口不存在或已失效')
        }
        setInvitation(await response.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : '登记入口加载失败')
      } finally {
        setLoading(false)
      }
    }

    void loadInvitation()
  }, [token])

  useEffect(() => {
    if (!token) return
    void setupWechatShare()
  }, [token])

  const submit = async (values: InvitationFormValues) => {
    if (!token) return
    setSubmitting(true)
    setError(null)
    setSavedParticipantId(null)
    try {
      const response = await fetch(`/api/invitations/${token}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'customer',
          ...values,
          filled_date:
            typeof values.filled_date === 'object'
              ? values.filled_date.format('YYYY-MM-DD')
              : values.filled_date,
        }),
      })
      if (!response.ok) {
        throw new Error('提交失败，请稍后重试')
      }
      const data = await response.json()
      setSavedParticipantId(data.participant_id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="public-page public-loading-page">
        <Spin />
      </main>
    )
  }

  return (
    <main className="public-page registration-intake-page">
      <section className="public-hero-panel">
        <div>
          <Typography.Text className="public-eyebrow">公司注册</Typography.Text>
          <Typography.Title level={1}>公司注册信息登记</Typography.Title>
          <Typography.Paragraph>
            请按实际情况填写下方信息。提交后资料会进入内部整理流程，稍后会有专业人员联系确认。
          </Typography.Paragraph>
        </div>
        <div className="public-hero-meta" aria-label="登记流程">
          <span>信息登记</span>
          <span>内部整理</span>
          <span>联系确认</span>
        </div>
      </section>

      <section className="public-form-layout">
        <Card className="public-card public-form-card">
          {savedParticipantId ? (
            <Result
              status="success"
              title="信息已登记"
              subTitle="我们已收到你的公司注册信息，稍后会有专业人员联系确认。"
              extra={
                <Button type="primary" onClick={() => window.location.reload()}>
                  重新填写
                </Button>
              }
            />
          ) : (
            <>
              {error ? <Alert type="error" message={error} showIcon className="public-alert" /> : null}

              <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
                onFinish={submit}
                requiredMark="optional"
              >
                <div className="public-form-section">
                  <div className="section-heading">
                    <span>01</span>
                    <div>
                      <h2>公司信息</h2>
                      <p>填写公司名称、注册地址和注册资金。</p>
                    </div>
                  </div>
                  <Form.Item
                    label="公司名称"
                    name="full_company_name"
                    rules={[{ required: true, message: '请输入公司名称' }]}
                  >
                    <Input placeholder="例如：WLCH 有限责任公司 OcOO" />
                  </Form.Item>
                  <Form.Item label="法律地址" name="legal_address">
                    <Input.TextArea
                      rows={3}
                      placeholder="已有地址请填写；没有地址可留空，由内部协助注册地址"
                    />
                  </Form.Item>
                  <Form.Item
                    label="注册资金"
                    name="registered_capital"
                    rules={[{ required: true, message: '请输入注册资金' }]}
                  >
                    <Input placeholder="例如：200000 美金（20万美金）" />
                  </Form.Item>
                  <Form.Item label="是否需要注册地址" name="need_registered_address">
                    <Radio.Group>
                      <Radio.Button value={true}>需要</Radio.Button>
                      <Radio.Button value={false}>暂不需要</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </div>

                <div className="public-form-section">
                  <div className="section-heading">
                    <span>02</span>
                    <div>
                      <h2>人员与股东</h2>
                      <p>填写股东、法人/总经理及联系方式。</p>
                    </div>
                  </div>
                  <Form.Item
                    label="股东信息（股份比例、居住地址）"
                    name="shareholder_note"
                    rules={[{ required: true, message: '请填写股东和股份比例' }]}
                  >
                    <Input.TextArea rows={4} placeholder="例如：张三 100%，居住地址：..." />
                  </Form.Item>
                  <div className="public-two-column">
                    <Form.Item
                      label="总经理/法人代表姓名"
                      name="director_name"
                      rules={[{ required: true, message: '请输入姓名' }]}
                    >
                      <Input placeholder="请输入姓名" />
                    </Form.Item>
                    <Form.Item
                      label="联系电话"
                      name="director_phone"
                      rules={[{ required: true, message: '请输入联系电话' }]}
                    >
                      <Input placeholder="请输入联系电话" />
                    </Form.Item>
                  </div>
                  <Form.Item label="法人/总经理地址" name="director_address">
                    <Input.TextArea rows={2} placeholder="请输入地址" />
                  </Form.Item>
                </div>

                <div className="public-form-section">
                  <div className="section-heading">
                    <span>03</span>
                    <div>
                      <h2>经营与税务</h2>
                      <p>填写经营范围、开户、记账和签证需求。</p>
                    </div>
                  </div>
                  <Form.Item
                    label="主要经营范围"
                    name="business_scope"
                    rules={[{ required: true, message: '请输入主要经营范围' }]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="例如：商品贸易进出口、木材贸易进出口、设备进出口等"
                    />
                  </Form.Item>
                  <div className="public-two-column">
                    <Form.Item label="是否需要银行开户" name="need_bank_account">
                      <Radio.Group>
                        <Radio.Button value={true}>是</Radio.Button>
                        <Radio.Button value={false}>否</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item label="是否需要代理记账/报税 U 盘" name="need_accounting">
                      <Radio.Group>
                        <Radio.Button value={true}>是</Radio.Button>
                        <Radio.Button value={false}>否</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                  <Form.Item
                    label="税务制度"
                    name="tax_regime"
                    rules={[{ required: true, message: '请选择税务制度' }]}
                  >
                    <Radio.Group>
                      <Radio.Button value="增值税">增值税</Radio.Button>
                      <Radio.Button value="普通税">普通税</Radio.Button>
                      <Radio.Button value="待确认">待确认</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <div className="public-two-column">
                    <Form.Item label="签证" name="visa_type">
                      <Input placeholder="例如：旅游签证、工作签、商务签、待确认" />
                    </Form.Item>
                    <Form.Item label="填写日期" name="filled_date">
                      <DatePicker className="full-width" />
                    </Form.Item>
                  </div>
                </div>

                <div className="public-form-section">
                  <div className="section-heading">
                    <span>04</span>
                    <div>
                      <h2>提交人</h2>
                      <p>用于确认资料来源和后续联系。</p>
                    </div>
                  </div>
                  <div className="public-two-column">
                    <Form.Item
                      label="填写人姓名"
                      name="name"
                      rules={[{ required: true, message: '请输入填写人姓名' }]}
                    >
                      <Input placeholder="请输入姓名" />
                    </Form.Item>
                    <Form.Item label="填写人联系电话" name="mobile">
                      <Input placeholder="用于内部人员联系确认" />
                    </Form.Item>
                  </div>
                </div>

                <div className="public-submit-bar">
                  <div>
                    <strong>提交前请确认信息真实有效</strong>
                    <span>提交后仍可由内部人员协助补充和修正。</span>
                  </div>
                  <Button type="primary" htmlType="submit" loading={submitting} disabled={!invitation}>
                    提交登记信息
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Card>

        <aside className="public-side-panel">
          <Card className="public-side-card">
            <Typography.Title level={3}>填写说明</Typography.Title>
            <div className="public-flow-list">
              {fieldGroups.map((item, index) => (
                <div key={item.key}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item.label}</strong>
                </div>
              ))}
            </div>
          </Card>
          <Card className="public-side-card">
            <Typography.Title level={3}>常见问题</Typography.Title>
            <Collapse ghost items={faqItems} />
          </Card>
        </aside>
      </section>
    </main>
  )
}
