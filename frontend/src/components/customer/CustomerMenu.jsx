import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Input, Card, Badge, Drawer, InputNumber, message,
  Empty, Spin, Tag, Segmented, Form
} from 'antd';
import {
  ShoppingCartOutlined, PlusOutlined, MinusOutlined, DeleteOutlined,
  SearchOutlined, CheckCircleOutlined, PictureOutlined
} from '@ant-design/icons';
import publicApi from '../../services/publicApi';
import '../../styles/customer-menu.css';

const CustomerMenu = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    loadTableAndMenu();
  }, [tableId]);

  const loadTableAndMenu = async () => {
    try {
      setLoading(true);

      // Validate table
      const { data: tableData } = await publicApi.get(`/table/${tableId}`);
      setTable(tableData.table);

      // Load menu
      const { data: menuData } = await publicApi.get('/menu');
      setCategories(menuData.categories);

    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load menu');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c._id === item._id);
    if (existing) {
      setCart(cart.map(c =>
        c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    message.success(`${item.name} added to cart`);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(c =>
        c._id === itemId ? { ...c, quantity: newQuantity } : c
      ));
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c._id !== itemId));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gst = subtotal * 0.05; // 5% GST
    return {
      subtotal,
      gst,
      total: subtotal + gst
    };
  };

  const placeOrder = async (values) => {
    if (cart.length === 0) {
      message.warning('Please add items to cart');
      return;
    }

    try {
      setSubmitting(true);

      const { subtotal, gst, total } = calculateTotal();

      const orderData = {
        tableId: table._id,
        items: cart.map(item => ({
          subCode: item._id,
          itemName: item.name,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit
        })),
        customerName: values.customerName || 'Guest',
        customerMobile: values.customerMobile || '',
        specialInstructions: values.specialInstructions || '',
        subtotal,
        gstAmount: gst,
        totalAmount: total,
        grandTotal: Math.round(total)
      };

      const { data } = await publicApi.post('/orders', orderData);

      message.success('Order placed successfully!');
      navigate(`/order-confirmation/${data.order._id}?token=${data.confirmationToken}`);

    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = () => {
    let items = [];

    if (selectedCategory === 'all') {
      categories.forEach(cat => items.push(...cat.items));
    } else {
      const category = categories.find(c => c._id === selectedCategory);
      if (category) items = category.items;
    }

    if (searchQuery) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  };

  const { subtotal, gst, total } = calculateTotal();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="customer-menu">
      {/* Header */}
      <div className="menu-header">
        <div>
          <h2 style={{ margin: 0 }}>Menu</h2>
          <div style={{ color: '#666', fontSize: 14 }}>
            {table.tableName} ({table.tableNumber})
          </div>
        </div>
        <Badge count={cart.length} offset={[-5, 5]}>
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            size="large"
            onClick={() => setCartOpen(true)}
          >
            Cart
          </Button>
        </Badge>
      </div>

      {/* Search */}
      <div style={{ padding: '16px' }}>
        <Input
          placeholder="Search items..."
          prefix={<SearchOutlined />}
          size="large"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
        <Segmented
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={[
            { label: 'All', value: 'all' },
            ...categories.map(cat => ({
              label: cat.name,
              value: cat._id
            }))
          ]}
          block
        />
      </div>

      {/* Menu Items */}
      <div className="menu-grid">
        {filteredItems().length === 0 ? (
          <Empty description="No items found" style={{ padding: '40px 0' }} />
        ) : (
          filteredItems().map(item => (
            <Card
              key={item._id}
              hoverable
              className="menu-item-card"
              cover={
                item.imageUrl ? (
                  <img
                    src={`http://localhost:5000${item.imageUrl}`}
                    alt={item.name}
                    style={{ height: 180, objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    height: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f5f5f5'
                  }}>
                    <PictureOutlined style={{ fontSize: 48, color: '#ccc' }} />
                  </div>
                )
              }
            >
              <Card.Meta
                title={item.name}
                description={item.description}
              />
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#667eea' }}>
                  ₹{item.price}
                </div>
                {item.isAvailable ? (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => addToCart(item)}
                  >
                    Add
                  </Button>
                ) : (
                  <Tag color="red">Out of Stock</Tag>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Cart Drawer */}
      <Drawer
        title="Your Order"
        placement="bottom"
        height="80vh"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      >
        {cart.length === 0 ? (
          <Empty description="Cart is empty" />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              {cart.map(item => (
                <Card key={item._id} size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div style={{ color: '#666' }}>₹{item.price} x {item.quantity}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      />
                      <InputNumber
                        size="small"
                        min={1}
                        value={item.quantity}
                        onChange={(val) => updateQuantity(item._id, val)}
                        style={{ width: 50 }}
                      />
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      />
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeFromCart(item._id)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>GST (5%):</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 16, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                <span>Total:</span>
                <span>₹{Math.round(total)}</span>
              </div>
            </Card>

            <Form form={form} layout="vertical" onFinish={placeOrder}>
              <Form.Item name="customerName" label="Your Name (Optional)">
                <Input placeholder="Enter your name" />
              </Form.Item>
              <Form.Item name="customerMobile" label="Mobile Number (Optional)">
                <Input placeholder="Enter mobile number" />
              </Form.Item>
              <Form.Item name="specialInstructions" label="Special Instructions (Optional)">
                <Input.TextArea rows={2} placeholder="Any special requests..." />
              </Form.Item>
              <Button
                type="primary"
                size="large"
                block
                htmlType="submit"
                icon={<CheckCircleOutlined />}
                loading={submitting}
              >
                Place Order
              </Button>
            </Form>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default CustomerMenu;
