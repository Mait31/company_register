import { Button, Card, Descriptions, Drawer, Form, Input, Select, Space, Table, Tag, Typography, message } from 'antd'
import { useEffect, useState } from 'react'

type InvitationListItem = {
  id: number
  token: string
  status: string
  remark?: string | null
  company_name?: string | null
  contact_name?: string | null
  contact_mobile?: string | null
  latest_submitted_at?: string | null
  created_at: string
  updated_at: string
}

type InvitationParticipant = {
  id: number
  role: string
  name?: string | null
  mobile?: string | null
  submitted_fields_json?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

type InvitationDetail = InvitationListItem & {
  allow_forward: boolean
  expires_at?: string | null
  participants: InvitationParticipant[]
}

type FollowFormValues = {
  status: string
  remark?: string
  full_company_name?: string
  legal_address?: string
  shareholder_note?: string
  registered_capital?: string
  director_name?: string
  director_phone?: string
  director_address?: string
  business_scope?: string
  tax_regime?: string
  need_bank_account?: string
  need_accounting?: string
  visa_type?: string
  name?: string
  mobile?: string
}

const statusText: Record<string, string> = {
  waiting_customer: '待客户填写',
  pending_internal_confirm: '待内部确认',
  processing: '办理中',
  completed: '已完成',
  draft: '待客户填写',
}

const statusColor: Record<string, string> = {
  waiting_customer: 'default',
  pending_internal_confirm: 'orange',
  processing: 'blue',
  completed: 'green',
  draft: 'default',
}

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-WeCom-Userid': localStorage.getItem('admin_wecom_userid') || 'demo',
  }
}

function displayTime(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function boolToText(value: unknown) {
  if (value === true) return '是'
  if (value === false) return '否'
  return undefined
}

function textToBool(value?: string) {
  if (value === '是') return true
  if (value === '否') return false
  return undefined
}

function toFormValues(detail: InvitationDetail): FollowFormValues {
  const fields = detail.participants[0]?.submitted_fields_json || {}
  return {
    status: detail.status === 'draft' ? 'waiting_customer' : detail.status,
    remark: detail.remark || undefined,
    full_company_name: String(fields.full_company_name || ''),
    legal_address: String(fields.legal_address || ''),
    shareholder_note: String(fields.shareholder_note || ''),
    registered_capital: String(fields.registered_capital || ''),
    director_name: String(fields.director_name || ''),
    director_phone: String(fields.director_phone || ''),
    director_address: String(fields.director_address || ''),
    business_scope: String(fields.business_scope || ''),
    tax_regime: String(fields.tax_regime || ''),
    need_bank_account: boolToText(fields.need_bank_account),
    need_accounting: boolToText(fields.need_accounting),
    visa_type: String(fields.visa_type || ''),
    name: String(fields.name || detail.contact_name || ''),
    mobile: String(fields.mobile || detail.contact_mobile || ''),
  }
}

function toSubmittedFields(values: FollowFormValues) {
  return {
    name: values.name || undefined,
    mobile: values.mobile || undefined,
    full_company_name: values.full_company_name || undefined,
    legal_address: values.legal_address || undefined,
    shareholder_note: values.shareholder_note || undefined,
    registered_capital: values.registered_capital || undefined,
    director_name: values.director_name || undefined,
    director_phone: values.director_phone || undefined,
    director_address: values.director_address || undefined,
    business_scope: values.business_scope || undefined,
    tax_regime: values.tax_regime || undefined,
    need_bank_account: textToBool(values.need_bank_account),
    need_accounting: textToBool(values.need_accounting),
    visa_type: values.visa_type || undefined,
  }
}

export function AdminOrdersPage() {
  const [rows, setRows] = useState<InvitationListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<InvitationDetail | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<FollowFormValues>()
  const publicBaseUrl = window.location.origin
  const publicIntakeLink = `${publicBaseUrl}/i/company-registration`

  const loadRows = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/invitations', { headers: adminHeaders() })
      if (!response.ok) throw new Error('加载资料列表失败')
      setRows(await response.json())
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载资料列表失败')
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async (id: number) => {
    const response = await fetch(`/api/admin/invitations/${id}`, { headers: adminHeaders() })
    if (!response.ok) {
      message.error('加载资料详情失败')
      return
    }
    const data = (await response.json()) as InvitationDetail
    setDetail(data)
    form.setFieldsValue(toFormValues(data))
    setDrawerOpen(true)
  }

  const saveDetail = async (values: FollowFormValues) => {
    if (!detail) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/invitations/${detail.id}`, {
        method: 'PATCH',
        headers: adminHeaders(),
        body: JSON.stringify({
          status: values.status,
          remark: values.remark || null,
          submitted_fields_json: toSubmittedFields(values),
        }),
      })
      if (!response.ok) throw new Error('保存资料失败')
      const updated = (await response.json()) as InvitationDetail
      setDetail(updated)
      form.setFieldsValue(toFormValues(updated))
      await loadRows()
      message.success('资料已保存')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存资料失败')
    } finally {
      setSaving(false)
    }
  }

  const copyPublicLink = async () => {
    await navigator.clipboard.writeText(publicIntakeLink)
    message.success('公开填写入口已复制')
  }

  const columns = [
      {
        title: '状态',
        dataIndex: 'status',
        width: 130,
        render: (status: string) => (
          <Tag color={statusColor[status] || 'default'}>{statusText[status] || status}</Tag>
        ),
      },
      {
        title: '公司名称',
        dataIndex: 'company_name',
        render: (value: string | null) => value || <Typography.Text type="secondary">未填写</Typography.Text>,
      },
      {
        title: '联系人',
        render: (_: unknown, row: InvitationListItem) => row.contact_name || row.contact_mobile || '-',
      },
      {
        title: '最近提交',
        dataIndex: 'latest_submitted_at',
        render: displayTime,
      },
      {
        title: '操作',
        width: 100,
        render: (_: unknown, row: InvitationListItem) => (
          <Space>
            <Button type="link" onClick={() => openDetail(row.id)}>
              详情
            </Button>
          </Space>
        ),
      },
    ]

  useEffect(() => {
    void loadRows()
  }, [])

  return (
    <Space direction="vertical" size={24} className="page-stack admin-workspace">
      <div className="admin-hero">
        <div>
          <Typography.Title level={2}>公司注册资料跟进</Typography.Title>
          <Typography.Text type="secondary">
            客户通过固定入口提交资料后，后台自动生成一条跟进记录。
          </Typography.Text>
        </div>
        <Button type="primary" onClick={copyPublicLink}>
          复制公开填写入口
        </Button>
      </div>

      <Card className="intake-card">
        <Space direction="vertical" size={4}>
          <Typography.Text className="eyebrow">公开填写入口</Typography.Text>
          <Typography.Text className="intake-link" copyable>
            {publicIntakeLink}
          </Typography.Text>
        </Space>
      </Card>

      <Card className="data-card">
        <Table
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          className="follow-table"
        />
      </Card>

      <Drawer
        title="客户资料详情"
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        {detail ? (
          <Space direction="vertical" size="large" className="page-stack">
            <Descriptions column={1} size="small" bordered className="detail-summary">
              <Descriptions.Item label="来源">公开填写入口</Descriptions.Item>
              <Descriptions.Item label="创建时间">{displayTime(detail.created_at)}</Descriptions.Item>
              <Descriptions.Item label="最近提交">{displayTime(detail.latest_submitted_at)}</Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" onFinish={saveDetail}>
              <Form.Item label="跟进状态" name="status" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'waiting_customer', label: '待客户填写' },
                    { value: 'pending_internal_confirm', label: '待内部确认' },
                    { value: 'processing', label: '办理中' },
                    { value: 'completed', label: '已完成' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="内部备注" name="remark">
                <Input.TextArea rows={3} placeholder="记录内部跟进情况，例如缺什么、谁负责、下一步做什么" />
              </Form.Item>
              <Form.Item label="公司名称" name="full_company_name">
                <Input />
              </Form.Item>
              <Form.Item label="法律地址" name="legal_address">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item label="股东信息" name="shareholder_note">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label="注册资金" name="registered_capital">
                <Input />
              </Form.Item>
              <Form.Item label="总经理/法人代表姓名" name="director_name">
                <Input />
              </Form.Item>
              <Form.Item label="联系电话" name="director_phone">
                <Input />
              </Form.Item>
              <Form.Item label="法人/总经理地址" name="director_address">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item label="主要经营范围" name="business_scope">
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item label="税务制度" name="tax_regime">
                <Input />
              </Form.Item>
              <Form.Item label="是否需要银行开户" name="need_bank_account">
                <Select allowClear options={[{ value: '是' }, { value: '否' }]} />
              </Form.Item>
              <Form.Item label="是否需要代理记账" name="need_accounting">
                <Select allowClear options={[{ value: '是' }, { value: '否' }]} />
              </Form.Item>
              <Form.Item label="签证" name="visa_type">
                <Input />
              </Form.Item>
              <Form.Item label="填写人姓名" name="name">
                <Input />
              </Form.Item>
              <Form.Item label="填写人联系电话" name="mobile">
                <Input />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={saving} block>
                保存内部修改
              </Button>
            </Form>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  )
}
