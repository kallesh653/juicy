import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  message,
  Modal,
  Descriptions,
  Tag,
  Divider,
  Space,
  Spin,
  Empty,
  Image,
  Badge
} from 'antd';
import {
  ArrowLeftOutlined,
  DollarOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TableOutlined,
  CheckCircleOutlined,
  EditOutlined,
  PictureOutlined
} from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';
import { printThermalBill } from '../../utils/exportUtils';

const OrderView = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${orderId}`);
      console.log('Order fetched:', response.data);
      setOrder(response.data.order);
    } catch (error) {
      message.error('Failed to fetch order details');
      console.error(error);
      navigate('/tables');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToBill = async () => {
    Modal.confirm({
      title: 'Convert to Bill',
      content: (
        <div>
          <p>Convert this order to a bill and release the table?</p>
          <p><strong>Order No:</strong> {order.orderNo}</p>
          <p><strong>Table:</strong> {order.table?.tableName}</p>
          <p><strong>Amount:</strong> ₹{order.grandTotal.toFixed(2)}</p>
        </div>
      ),
      okText: 'Convert & Generate Bill',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setConverting(true);
          const response = await api.post(`/orders/${orderId}/convert-to-bill`, {
            paymentMode: 'Cash',
            paymentDetails: ''
          });

          message.success('Order converted to bill successfully! Table is now available.');

          const billData = response.data.bill;

          // Print bill
          Modal.confirm({
            title: 'Bill Generated Successfully',
            content: 'Do you want to print the bill?',
            okText: 'Print',
            cancelText: 'Skip',
            onOk: () => {
              printThermalBill(billData);
            }
          });

          // Navigate back to tables
          setTimeout(() => {
            navigate('/tables');
          }, 1500);

        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to convert to bill');
          console.error(error);
        } finally {
          setConverting(false);
        }
      },
    });
  };

  const handleCancelOrder = async () => {
    Modal.confirm({
      title: 'Cancel Order',
      content: (
        <div>
          <p>Are you sure you want to cancel this order?</p>
          <p><strong>Order No:</strong> {order.orderNo}</p>
          <p>The table will be released and stock will be restored.</p>
        </div>
      ),
      okText: 'Yes, Cancel Order',
      cancelText: 'No',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.put(`/orders/${orderId}/cancel`);
          message.success('Order cancelled successfully! Table is now available.');
          navigate('/tables');
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to cancel order');
          console.error(error);
        }
      },
    });
  };

  const itemColumns = [
    {
      title: 'Image',
      key: 'image',
      width: 70,
      render: (_, record) => {
        const imageUrl = record.subCode?.imageUrl;
        return imageUrl ? (
          <Image
            src={`http://localhost:5000${imageUrl}`}
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div style={{
            width: 50,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed #d9d9d9',
            borderRadius: 4
          }}>
            <PictureOutlined style={{ fontSize: 20, color: '#ccc' }} />
          </div>
        );
      },
      responsive: ['md']
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (text, record) => (
        <div>
          <strong style={{ fontSize: 14 }}>{text}</strong>
          <div className="mobile-order-item-details" style={{ display: 'none', marginTop: 4, fontSize: 13 }}>
            <span style={{ color: '#667eea', marginRight: 8 }}>₹{record.price.toFixed(2)}</span>
            <span style={{ color: '#999' }}>× {record.quantity}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (price) => `₹${price.toFixed(2)}`,
      responsive: ['md']
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      responsive: ['md']
    },
    {
      title: 'Total',
      dataIndex: 'itemTotal',
      key: 'itemTotal',
      align: 'right',
      render: (total) => <strong style={{ color: '#52c41a', fontSize: 15 }}>₹{total.toFixed(2)}</strong>,
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Loading order details...</p>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <Card>
          <Empty description="Order not found">
            <Button type="primary" onClick={() => navigate('/tables')}>
              Back to Tables
            </Button>
          </Empty>
        </Card>
      </Layout>
    );
  }

  const duration = order.startTime
    ? moment.duration(moment().diff(moment(order.startTime)))
    : null;

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        {/* Header */}
        <div className="order-view-header">
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/tables')}
              style={{ marginBottom: 12 }}
              className="mobile-back-button"
            >
              Back to Tables
            </Button>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }} className="order-view-title">
              Order Details - {order.orderNo}
            </h1>
            <p style={{ marginTop: 8, marginBottom: 0, color: '#666' }}>
              <Tag color="blue" icon={<ClockCircleOutlined />}>
                {duration ? `${Math.floor(duration.asHours())}h ${duration.minutes()}m ago` : 'Just now'}
              </Tag>
              <Tag color={
                order.orderStatus === 'Active' ? 'green' :
                order.orderStatus === 'Cancelled' ? 'red' : 'orange'
              }>
                {order.orderStatus}
              </Tag>
            </p>
          </div>

          <Space className="order-view-actions">
            {order.orderStatus === 'Active' && (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/tables/${order.table._id}/order?editOrder=${orderId}`)}
                  size="large"
                  className="mobile-action-button"
                  style={{
                    background: '#52c41a',
                    color: 'white',
                    border: 'none',
                    height: 45
                  }}
                >
                  <span className="button-text-desktop">Edit Order</span>
                  <span className="button-text-mobile">Edit</span>
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleCancelOrder}
                  size="large"
                  className="mobile-action-button"
                >
                  <span className="button-text-desktop">Cancel Order</span>
                  <span className="button-text-mobile">Cancel</span>
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleConvertToBill}
                  loading={converting}
                  size="large"
                  className="mobile-action-button mobile-convert-button"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    height: 45
                  }}
                >
                  <span className="button-text-desktop">Convert to Bill & Release Table</span>
                  <span className="button-text-mobile">Convert</span>
                </Button>
              </>
            )}
          </Space>
        </div>

        <Row gutter={16}>
          {/* Left: Order Details */}
          <Col xs={24} lg={16}>
            <Card title="Order Information" style={{ marginBottom: 16 }}>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Order No" span={2}>
                  <strong style={{ fontSize: 16 }}>{order.orderNo}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Table" span={2}>
                  <TableOutlined style={{ marginRight: 8 }} />
                  <strong style={{ fontSize: 16 }}>{order.table?.tableNumber}</strong> - {order.table?.tableName}
                </Descriptions.Item>
                <Descriptions.Item label="Customer">
                  <UserOutlined style={{ marginRight: 8 }} />
                  {order.customerName || 'Walk-in Customer'}
                </Descriptions.Item>
                <Descriptions.Item label="Mobile">
                  {order.customerMobile || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Order Time">
                  {moment(order.startTime).format('DD MMM YYYY, hh:mm A')}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {duration ? `${Math.floor(duration.asHours())}h ${duration.minutes()}m` : 'Just started'}
                </Descriptions.Item>
                <Descriptions.Item label="Created By">
                  {order.userId?.name || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={
                    order.orderStatus === 'Active' ? 'green' :
                    order.orderStatus === 'Cancelled' ? 'red' : 'orange'
                  }>
                    {order.orderStatus}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Order Items">
              <Table
                columns={itemColumns}
                dataSource={order.items}
                rowKey={(record, index) => `${record.subCode}-${index}`}
                pagination={false}
                scroll={{ x: 500 }}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={3} align="right">
                        <strong>Subtotal:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <strong>₹{order.subtotal.toFixed(2)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    {order.discount > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell colSpan={3} align="right">
                          <strong>Discount:</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell align="right">
                          <strong style={{ color: '#ff4d4f' }}>-₹{order.discount.toFixed(2)}</strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={3} align="right">
                        <strong style={{ fontSize: 16 }}>Grand Total:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <strong style={{ fontSize: 18, color: '#52c41a' }}>
                          ₹{order.grandTotal.toFixed(2)}
                        </strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
          </Col>

          {/* Right: Summary */}
          <Col xs={24} lg={8}>
            <Card
              title="Order Summary"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
              headStyle={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)' }}
            >
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Total Items</div>
                <div style={{ fontSize: 32, fontWeight: 600 }}>
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
              </div>

              <Divider style={{ background: 'rgba(255,255,255,0.2)' }} />

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Subtotal</div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>
                  ₹{order.subtotal.toFixed(2)}
                </div>
              </div>

              {order.discount > 0 && (
                <>
                  <Divider style={{ background: 'rgba(255,255,255,0.2)' }} />
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Discount</div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>
                      -₹{order.discount.toFixed(2)}
                    </div>
                  </div>
                </>
              )}

              <Divider style={{ background: 'rgba(255,255,255,0.2)' }} />

              <div>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Grand Total</div>
                <div style={{ fontSize: 36, fontWeight: 700 }}>
                  ₹{order.grandTotal.toFixed(2)}
                </div>
              </div>
            </Card>

            {order.orderStatus === 'Active' && (
              <Card
                style={{
                  marginTop: 16,
                  background: '#fff7e6',
                  borderColor: '#faad14'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 12 }} />
                  <h3 style={{ margin: 0, marginBottom: 8 }}>Table Occupied</h3>
                  <p style={{ margin: 0, color: '#666' }}>
                    This table has been occupied for {duration ? `${Math.floor(duration.asHours())}h ${duration.minutes()}m` : 'a few moments'}
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#999' }}>
                    Convert to bill to release the table
                  </p>
                </div>
              </Card>
            )}
          </Col>
        </Row>
      </div>

      {/* Mobile-specific styles for order view */}
      <style>{`
        @media (max-width: 768px) {
          /* Header and buttons mobile layout */
          .order-view-header {
            display: flex;
            flex-direction: column;
            gap: 16px;
            align-items: stretch !important;
            margin-bottom: 24px;
          }

          .order-view-actions {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap;
            gap: 8px !important;
            width: 100%;
          }

          .mobile-action-button {
            flex: 1;
            min-width: calc(33.33% - 6px);
            height: 44px !important;
            padding: 0 8px !important;
            font-size: 13px !important;
          }

          .mobile-convert-button {
            flex: 1 1 100%;
            margin-top: 8px;
          }

          .button-text-desktop {
            display: none;
          }

          .button-text-mobile {
            display: inline;
          }

          .order-view-title {
            font-size: 20px !important;
          }

          /* Show mobile item details */
          .mobile-order-item-details {
            display: block !important;
          }

          /* Order information descriptions */
          .ant-descriptions-item-label {
            font-size: 12px !important;
            padding: 8px !important;
          }

          .ant-descriptions-item-content {
            font-size: 13px !important;
            padding: 8px !important;
          }

          /* Order summary card on mobile */
          .ant-col-xs-24:nth-child(2) {
            margin-top: 16px;
          }

          /* Table summary mobile */
          .ant-table-summary .ant-table-cell {
            padding: 8px 4px !important;
            font-size: 13px !important;
          }
        }

        @media (min-width: 769px) {
          /* Desktop layout */
          .order-view-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }

          .button-text-mobile {
            display: none;
          }

          .button-text-desktop {
            display: inline;
          }
        }
      `}</style>
    </Layout>
  );
};

export default OrderView;
