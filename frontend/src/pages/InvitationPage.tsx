import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Result, Spin, Typography, Upload, message } from 'antd'
import { useParams } from 'react-router-dom'

type Invitation = {
  id: number
  token: string
  status: string
  allow_forward: boolean
  expires_at: string | null
  remark: string | null
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
  const [activeToken, setActiveToken] = useState(token || '')
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [summary, setSummary] = useState<MaterialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completeCount = useMemo(() => summary?.uploaded || 0, [summary])

  useEffect(() => {
    if (!token) return
    setActiveToken(token)
  }, [token])

  useEffect(() => {
    async function loadMaterials() {
      if (!activeToken) return
      setLoading(true)
      setError(null)
      try {
        const [invitationResponse, materialsResponse] = await Promise.all([
          fetch(`/api/invitations/${activeToken}`),
          fetch(`/api/invitations/${activeToken}/materials`),
        ])
        if (!invitationResponse.ok || !materialsResponse.ok) {
          throw new Error('材料入口不存在或已失效')
        }
        const materialData = (await materialsResponse.json()) as MaterialSummary
        setInvitation((await invitationResponse.json()) as Invitation)
        setSummary(materialData)
        if (materialData.token !== activeToken) setActiveToken(materialData.token)
      } catch (err) {
        setError(err instanceof Error ? err.message : '材料入口加载失败')
      } finally {
        setLoading(false)
      }
    }

    void loadMaterials()
  }, [activeToken])

  useEffect(() => {
    if (!token) return
    void setupWechatShare()
  }, [token])

  const uploadMaterial = async (materialType: string, file: File) => {
    if (!activeToken) return
    setUploadingType(materialType)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('upload', file)
      const response = await fetch(`/api/invitations/${activeToken}/materials/${materialType}/files`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || '上传失败，请稍后重试')
      }
      setSummary((await response.json()) as MaterialSummary)
      message.success('材料已上传')
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploadingType(null)
    }
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
      <main className="material-public-page material-loading-page">
        <Spin />
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

                <Upload
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  beforeUpload={(file) => {
                    void uploadMaterial(material.material_type, file)
                    return Upload.LIST_IGNORE
                  }}
                  maxCount={1}
                  showUploadList={false}
                >
                  <Button block loading={uploadingType === material.material_type}>
                    {material.file ? '重新上传' : '选择文件'}
                  </Button>
                </Upload>
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
