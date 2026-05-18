import { Button, Card, Space, Table, Tag, Typography } from 'antd'

const columns = [
  { title: '工单号', dataIndex: 'orderNo' },
  { title: '客户', dataIndex: 'customer' },
  {
    title: '状态',
    dataIndex: 'status',
    render: (status: string) => <Tag color="blue">{status}</Tag>,
  },
  { title: '负责人', dataIndex: 'owner' },
]

const rows = [
  {
    key: 'demo',
    orderNo: 'CR-DEMO',
    customer: '测试客户',
    status: 'draft',
    owner: '企业微信用户',
  },
]

export function AdminOrdersPage() {
  return (
    <Space direction="vertical" size="large" className="page-stack">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>公司注册工单</Typography.Title>
          <Typography.Text type="secondary">
            主链路：创建定向邀请、客户填写、内部确认、正式工单、报价、材料审核、文件生成、归档。
          </Typography.Text>
        </div>
        <Button type="primary">创建工单</Button>
      </div>
      <Card>
        <Table columns={columns} dataSource={rows} pagination={false} />
      </Card>
    </Space>
  )
}
