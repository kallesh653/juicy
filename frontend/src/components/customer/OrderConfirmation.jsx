import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Result, Spin, message, Descriptions, Table } from 'antd';
import { CheckCircleOutlined, ShoppingOutlined, HomeOutlined } from '@ant-design/icons';
import publicApi from '../../services/publicApi';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    loadOrderConfirmation();
  }, [orderId]);

  const loadOrderConfirmation = async () => {
    try {
      const token = searchParams.get('token');
      if (!token) {
        message.error('Invalid confirmation link');
        return;
      }

      const { data } = await publicApi.get(`/orders/${orderId}/confirmation?token=${token}`);
      setOrder(data.order);

    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Item',
      dataIndex: 'itemName',
      key: 'itemName'
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty, record) => `${qty} ${record.unit}`
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `₹${price}`
    },
    {
      title: 'Total',
      dataIndex: 'itemTotal',
      key: 'itemTotal',
      render: (total) => `₹${total}`
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="error"
          title="Order Not Found"
          subTitle="Unable to load order confirmation"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Result
        status="success"
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title="Order Placed Successfully!"
        subTitle={`Order #${order.orderNo} has been received`}
      />

      <Card style={{ marginBottom: 16 }}>
        <Descriptions title="Order Details" bordered column={1}>
          <Descriptions.Item label="Order Number">
            <strong>{order.orderNo}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Table">
            {order.tableName} ({order.tableNumber})
          </Descriptions.Item>
          <Descriptions.Item label="Order Time">
            {new Date(order.orderDate).toLocaleString()}
          </Descriptions.Item>
          {order.customerName && order.customerName !== 'Guest' && (
            <Descriptions.Item label="Customer Name">
              {order.customerName}
            </Descriptions.Item>
          )}
          {order.specialInstructions && (
            <Descriptions.Item label="Special Instructions">
              {order.specialInstructions}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="Order Items" style={{ marginBottom: 16 }}>
        <Table
          dataSource={order.items}
          columns={columns}
          pagination={false}
          rowKey={(record, index) => index}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={3} align="right">
                  <strong>Total:</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell>
                  <strong>₹{order.grandTotal}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#666', marginBottom: 16 }}>
          Your order has been sent to the kitchen. Our staff will serve it shortly.
        </p>
        <Button
          type="primary"
          size="large"
          icon={<ShoppingOutlined />}
          onClick={() => navigate(`/menu/${order.tableNumber}`)}
          style={{ marginRight: 8 }}
        >
          Order More
        </Button>
      </div>
    </div>
  );
};

export default OrderConfirmation;
