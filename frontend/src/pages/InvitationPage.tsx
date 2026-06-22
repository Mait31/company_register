import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, DatePicker, Form, Input, Radio, Result, Spin, Typography, message } from 'antd'
import { useLocation, useParams } from 'react-router-dom'

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

type MaterialFile = {
  id: number
  file_name: string
  file_ext: string | null
  mime_type: string | null
  file_size: number
  uploaded_at: string
}

type InvitationMaterial = {
  id: number
  material_type: string
  material_name: string
  description: string
  required: boolean
  status: string
  review_comment: string | null
  reviewed_at: string | null
  file: MaterialFile | null
}

type MaterialSummary = {
  invitation_id: number
  token: string
  status: string
  total: number
  uploaded: number
  approved: number
  rejected: number
  missing: number
  materials: InvitationMaterial[]
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

const publicIntakeToken = 'company-registration'
const maxMaterialUploadSize = 20 * 1024 * 1024
const allowedMaterialExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp']

function publicIntakeInvitation(): Invitation {
  return {
    id: 0,
    token: publicIntakeToken,
    status: 'waiting_customer',
    allow_forward: true,
    expires_at: null,
    remark: '公开填写入口',
  }
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
  if (!response.ok) return

  const config = (await response.json()) as WeChatJsSdkSignature
  if (!config.enabled || !config.appId || !config.timestamp || !config.nonceStr || !config.signature) {
    return
  }

  await loadWechatJsSdk()
  const wx = window.wx
  if (!wx) return

  const share: ShareOptions = {
    title: config.title || '委托书材料上传',
    desc: config.desc || '请上传护照翻译件、PIN 码和落地签材料',
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
}

const statusText: Record<string, string> = {
  missing: '待上传',
  uploaded: '待核对',
  reviewing: '待核对',
  approved: '已通过',
  rejected: '需重传',
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

export function InvitationPage() {
  const { token } = useParams()
  const location = useLocation()
  const [form] = Form.useForm<InvitationFormValues>()
  const isMaterialRoute = location.pathname.endsWith('/materials')
  const [activeToken, setActiveToken] = useState(token || '')
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [summary, setSummary] = useState<MaterialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [savedParticipantId, setSavedParticipantId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const completeCount = useMemo(() => summary?.uploaded || 0, [summary])
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
    document.title = isMaterialRoute ? '委托书材料上传' : '公司注册信息登记'
  }, [isMaterialRoute])

  useEffect(() => {
    if (!token) return
    setActiveToken(token)
  }, [token])

  useEffect(() => {
    async function loadInvitation() {
      if (!activeToken) return
      setLoading(true)
      setError(null)
      try {
        const invitationResponse = await fetch(`/api/invitations/${activeToken}`)
        if (!invitationResponse.ok) {
          if (activeToken === publicIntakeToken && !isMaterialRoute) {
            setInvitation(publicIntakeInvitation())
            return
          }
          throw new Error('登记入口不存在或已失效')
        }
        setInvitation((await invitationResponse.json()) as Invitation)

        if (isMaterialRoute) {
          const materialsResponse = await fetch(`/api/invitations/${activeToken}/materials`)
          if (!materialsResponse.ok) {
            throw new Error('委托书材料收集尚未发起或链接已失效')
          }
          setSummary((await materialsResponse.json()) as MaterialSummary)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '入口加载失败')
      } finally {
        setLoading(false)
      }
    }

    void loadInvitation()
  }, [activeToken, isMaterialRoute])

  useEffect(() => {
    if (!token) return
    void setupWechatShare()
  }, [token])

  const submitRegistration = async (values: InvitationFormValues) => {
    if (!activeToken) return
    setSubmitting(true)
    setError(null)
    setSavedParticipantId(null)
    try {
      const response = await fetch(`/api/invitations/${activeToken}/participants`, {
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
      if (!response.ok) throw new Error('提交失败，请稍后重试')
      const data = await response.json()
      setSavedParticipantId(data.participant_id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const uploadMaterial = async (materialType: string, file: File) => {
    if (!activeToken) return
    setUploadingType(materialType)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('upload', file)
      message.loading({ content: '正在上传材料...', key: `upload-${materialType}`, duration: 0 })
      const response = await fetch(`/api/invitations/${activeToken}/materials/${materialType}/files`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || '上传失败，请稍后重试')
      }
      setSummary((await response.json()) as MaterialSummary)
      message.success({ content: '材料已上传', key: `upload-${materialType}` })
    } catch (err) {
      message.destroy(`upload-${materialType}`)
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploadingType(null)
    }
  }

  const handleMaterialFileChange = (materialType: string, fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !allowedMaterialExtensions.includes(extension)) {
      setError('仅支持 PDF、JPG、PNG、WEBP 文件')
      return
    }
    if (file.size > maxMaterialUploadSize) {
      setError('文件不能超过 20MB')
      return
    }

    void uploadMaterial(materialType, file)
  }

  const submitMaterials = async () => {
    if (!activeToken) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/invitations/${activeToken}/materials/submit`, {
        method: 'POST',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || '提交失败，请先上传全部材料')
      }
      setSummary((await response.json()) as MaterialSummary)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className={isMaterialRoute ? 'material-public-page material-loading-page' : 'public-page public-loading-page'}>
        <Spin />
      </main>
    )
  }

  if (!isMaterialRoute) {
    return (
      <main className="public-page registration-intake-page">
        <section className="public-hero-panel">
          <div>
            <Typography.Text className="public-eyebrow">公司注册</Typography.Text>
            <Typography.Title level={1}>公司注册信息登记</Typography.Title>
            <Typography.Paragraph>
              请按实际情况填写下方信息。提交后资料会进入内部整理流程，确认无误后再由工作人员发起委托书材料收集。
            </Typography.Paragraph>
          </div>
        </section>

        <section className="public-form-layout single-column-public-form">
          <Card className="public-card public-form-card">
            {savedParticipantId ? (
              <Result
                status="success"
                title="信息已登记"
                subTitle="我们已收到你的公司注册信息，工作人员核对无误后会再发送委托书材料上传链接。"
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
                  onFinish={submitRegistration}
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
                      <Input.TextArea rows={3} placeholder="已有地址请填写；没有地址可留空" />
                    </Form.Item>
                    <Form.Item
                      label="注册资金"
                      name="registered_capital"
                      rules={[{ required: true, message: '请输入注册资金' }]}
                    >
                      <Input placeholder="例如：200000 美金" />
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
                        <Input />
                      </Form.Item>
                      <Form.Item
                        label="联系电话"
                        name="director_phone"
                        rules={[{ required: true, message: '请输入联系电话' }]}
                      >
                        <Input />
                      </Form.Item>
                    </div>
                    <Form.Item label="法人/总经理地址" name="director_address">
                      <Input.TextArea rows={2} />
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
                      <Input.TextArea rows={4} placeholder="例如：商品贸易进出口、设备进出口等" />
                    </Form.Item>
                    <div className="public-two-column">
                      <Form.Item label="是否需要银行开户" name="need_bank_account">
                        <Radio.Group>
                          <Radio.Button value={true}>是</Radio.Button>
                          <Radio.Button value={false}>否</Radio.Button>
                        </Radio.Group>
                      </Form.Item>
                      <Form.Item label="是否需要代理记账" name="need_accounting">
                        <Radio.Group>
                          <Radio.Button value={true}>是</Radio.Button>
                          <Radio.Button value={false}>否</Radio.Button>
                        </Radio.Group>
                      </Form.Item>
                    </div>
                    <Form.Item label="税务制度" name="tax_regime" rules={[{ required: true }]}>
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
                        <Input />
                      </Form.Item>
                      <Form.Item label="填写人联系电话" name="mobile">
                        <Input />
                      </Form.Item>
                    </div>
                  </div>

                  <div className="public-submit-bar">
                    <div>
                      <strong>提交前请确认信息真实有效</strong>
                      <span>委托书材料收集会在内部核对后单独发起。</span>
                    </div>
                    <Button type="primary" htmlType="submit" loading={submitting} disabled={!invitation}>
                      提交登记信息
                    </Button>
                  </div>
                </Form>
              </>
            )}
          </Card>
        </section>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="material-public-page">
        <Card className="material-success-card">
          <Result
            status="success"
            title="材料已提交"
            subTitle="工作人员会核对材料是否齐全、清晰、有效；如需重传，会通过原沟通渠道联系你。"
            extra={
              <Button type="primary" onClick={() => setSubmitted(false)}>
                查看已上传材料
              </Button>
            }
          />
        </Card>
      </main>
    )
  }

  return (
    <main className="material-public-page">
      <section className="material-phone">
        <div className="material-phone-bar">
          <span>委托书材料</span>
          <span>{invitation?.status === 'completed' ? '已齐全' : `${completeCount}/3`}</span>
        </div>

        <div className="material-phone-screen">
          <div className="material-title-block">
            <Typography.Text className="public-eyebrow">材料上传</Typography.Text>
            <Typography.Title level={1}>委托书材料</Typography.Title>
            <Typography.Paragraph>
              请上传以下 3 项文件。提交后，后台只核对材料是否齐全、是否清晰正确、是否需要重传。
            </Typography.Paragraph>
          </div>

          {error ? <Alert type="error" message={error} showIcon className="public-alert" /> : null}

          <div className="material-upload-list">
            {summary?.materials.map((material) => (
              <article className={`material-upload-card status-${material.status}`} key={material.material_type}>
                <div className="material-upload-card-head">
                  <div>
                    <strong>
                      {material.required ? <span className="required">*</span> : null}
                      {material.material_name}
                    </strong>
                    <p>{material.description}</p>
                  </div>
                  <span className="material-status">{statusText[material.status] || material.status}</span>
                </div>

                <div className={material.file ? 'material-file-box done' : 'material-file-box'}>
                  {material.file ? (
                    <div>
                      <strong>{material.file.file_name}</strong>
                      <span>{formatFileSize(material.file.file_size)}</span>
                    </div>
                  ) : (
                    <span>支持 PDF、JPG、PNG、WEBP，单个文件不超过 20MB</span>
                  )}
                </div>

                {material.review_comment ? (
                  <Alert type="warning" message={material.review_comment} className="material-review-alert" />
                ) : null}

                <input
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="material-file-input"
                  disabled={uploadingType === material.material_type}
                  id={`material-file-${material.material_type}`}
                  onChange={(event) => {
                    handleMaterialFileChange(material.material_type, event.target.files)
                    event.target.value = ''
                  }}
                  type="file"
                />
                <Button
                  block
                  loading={uploadingType === material.material_type}
                  onClick={() => document.getElementById(`material-file-${material.material_type}`)?.click()}
                >
                  {material.file ? '重新上传' : '选择文件'}
                </Button>
              </article>
            ))}
          </div>

          <div className="material-submit-bar">
            <Button
              type="primary"
              block
              disabled={!summary || summary.missing > 0}
              loading={submitting}
              onClick={submitMaterials}
            >
              提交材料
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
