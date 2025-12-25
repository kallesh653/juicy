import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Card, Row, Col, Select, Button, Table, InputNumber, message, Modal, Input, Divider, Space, Tag, Badge, Statistic, Empty, Spin, Tooltip
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  TableOutlined,
  MinusOutlined
} from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';

const { Option } = Select;

const TakeTableOrder = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editOrderId = searchParams.get('editOrder');

  const [table, setTable] = useState(null);
  const [mainCodes, setMainCodes] = useState([]);
  const [subCodes, setSubCodes] = useState([]);
  const [filteredSubCodes, setFilteredSubCodes] = useState([]);
  const [selectedMainCode, setSelectedMainCode] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [existingOrder, setExistingOrder] = useState(null);

  useEffect(() => {
    fetchTable();
    fetchMainCodes();
    fetchSubCodes();
  }, [tableId]);

  useEffect(() => {
    if (editOrderId && subCodes.length > 0) {
      fetchExistingOrder();
    }
  }, [editOrderId, subCodes]);

  const fetchTable = async () => {
    try {
      setTableLoading(true);
      const response = await api.get(`/tables/${tableId}`);
      setTable(response.data.table);
    } catch (error) {
      message.error('Failed to fetch table details');
      console.error(error);
      navigate('/tables');
    } finally {
      setTableLoading(false);
    }
  };

  const fetchMainCodes = async () => {
    try {
      const { data } = await api.get('/maincodes?isActive=true');
      setMainCodes(data.mainCodes || []);
    } catch (error) {
      message.error('Failed to load categories');
      console.error(error);
    }
  };

  const fetchSubCodes = async () => {
    try {
      const { data } = await api.get('/subcodes?isActive=true');
      setSubCodes(data.subCodes || []);
    } catch (error) {
      message.error('Failed to load items');
      console.error(error);
    }
  };

  const fetchExistingOrder = async () => {
    try {
      const response = await api.get(`/orders/${editOrderId}`);
      const order = response.data.order;
      setExistingOrder(order);

      // Populate form with existing order data
      setCustomerName(order.customerName || '');
      setCustomerMobile(order.customerMobile || '');

      // Populate cart with existing items
      const cartItemsFromOrder = order.items.map(item => {
        // Extract the subCode ID (handle both object and string formats)
        const subCodeId = typeof item.subCode === 'object' && item.subCode._id
          ? item.subCode._id
          : item.subCode;

        return {
          _id: subCodeId,
          subCode: subCodeId,
          itemName: item.itemName,
          quantity: item.quantity,
          price: item.price,
          itemTotal: item.itemTotal,
          unit: item.unit || 'Piece'
        };
      });
      setCartItems(cartItemsFromOrder);

      message.success('Order loaded for editing');
    } catch (error) {
      message.error('Failed to load order for editing');
      console.error(error);
    }
  };

  const handleMainCodeChange = (value) => {
    setSelectedMainCode(value);
    setSearchText('');
    if (value) {
      const filtered = subCodes.filter((sc) => sc.mainCode && sc.mainCode._id === value);
      setFilteredSubCodes(filtered);
    } else {
      setFilteredSubCodes([]);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      if (selectedMainCode) {
        const filtered = subCodes.filter((sc) => sc.mainCode && sc.mainCode._id === selectedMainCode);
        setFilteredSubCodes(filtered);
      } else {
        setFilteredSubCodes([]);
      }
      return;
    }

    let filtered = selectedMainCode
      ? subCodes.filter((sc) => sc.mainCode && sc.mainCode._id === selectedMainCode)
      : subCodes;

    filtered = filtered.filter(sc =>
      (sc.name && sc.name.toLowerCase().includes(value.toLowerCase())) ||
      (sc.subCode && sc.subCode.toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredSubCodes(filtered);
  };

  const addToCart = (subCode) => {
    if (!subCode || !subCode._id || !subCode.name) {
      message.error('Invalid item data');
      return;
    }

    const existingItem = cartItems.find((item) => item._id === subCode._id);

    if (existingItem) {
      if (subCode.currentStock !== undefined && subCode.currentStock !== null && existingItem.quantity >= subCode.currentStock) {
        message.warning('Maximum available stock reached');
        return;
      }
      updateQuantity(subCode._id, existingItem.quantity + 1);
      message.success(`Quantity increased for ${subCode.name}`);
      return;
    }

    if (subCode.currentStock !== undefined && subCode.currentStock !== null && subCode.currentStock <= 0) {
      message.error('Item out of stock');
      return;
    }

    const price = subCode.price || 0;
    const newItem = {
      _id: subCode._id,
      subCode: subCode._id,
      itemName: subCode.name || 'Unknown Item',
      quantity: 1,
      price: price,
      itemTotal: price,
      currentStock: subCode.currentStock,
      unit: subCode.unit || 'Piece',
    };

    setCartItems([...cartItems, newItem]);
    message.success(`${subCode.name} added to cart`);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item._id === id) {
          if (item.currentStock !== undefined && item.currentStock !== null && newQuantity > item.currentStock) {
            message.warning('Cannot exceed available stock');
            return item;
          }
          return {
            ...item,
            quantity: newQuantity,
            itemTotal: newQuantity * item.price,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id) => {
    setCartItems(prevItems => {
      const filtered = prevItems.filter((item) => item._id !== id);
      console.log('Removing item with id:', id);
      console.log('Previous items:', prevItems.map(i => ({id: i._id, name: i.itemName})));
      console.log('Filtered items:', filtered.map(i => ({id: i._id, name: i.itemName})));
      return filtered;
    });
    message.info('Item removed from cart');
  };

  const clearCart = () => {
    Modal.confirm({
      title: 'Clear Cart',
      content: 'Are you sure you want to clear all items from the cart?',
      okText: 'Yes',
      cancelText: 'No',
      okButtonProps: { danger: true },
      onOk: () => {
        setCartItems([]);
        message.success('Cart cleared');
      },
    });
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
    const discountPercent = 0;
    const discountAmount = 0;
    const totalAfterDiscount = subtotal - discountAmount;
    const gstAmount = 0;
    const totalAmount = totalAfterDiscount + gstAmount;
    const roundOff = Math.round(totalAmount) - totalAmount;
    const grandTotal = Math.round(totalAmount);

    return {
      subtotal,
      discountPercent,
      discountAmount,
      gstAmount,
      totalAmount,
      roundOff,
      grandTotal,
    };
  };

  const handleGenerateOrder = async () => {
    if (cartItems.length === 0) {
      message.warning('Please add items to cart');
      return;
    }

    if (!table) {
      message.error('Table information not loaded');
      return;
    }

    const isEditMode = !!editOrderId;
    const totals = calculateTotals();

    Modal.confirm({
      title: isEditMode ? 'Update Order' : 'Generate Order',
      content: (
        <div>
          <p>{isEditMode ? 'Update' : 'Generate'} order for <strong>{table.tableName}</strong>?</p>
          {!isEditMode && <p>The table will be marked as occupied.</p>}

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ marginBottom: 12 }}>
            <strong style={{ fontSize: 15, display: 'block', marginBottom: 8 }}>Order Items ({cartItems.length}):</strong>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {cartItems.map((item, index) => (
                <div
                  key={item._id || index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: index % 2 === 0 ? '#fafafa' : '#fff',
                    borderRadius: 4,
                    marginBottom: 4
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.itemName || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {item.quantity || 1} × ₹{(item.price || 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: '#52c41a', fontSize: 15 }}>
                    ₹{(item.itemTotal || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Subtotal:</span>
              <strong>₹{totals.subtotal.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600, paddingTop: 6, borderTop: '1px solid #d9d9d9' }}>
              <span>Grand Total:</span>
              <span style={{ color: '#667eea' }}>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ),
      okText: isEditMode ? 'Update Order' : 'Generate Order',
      cancelText: 'Cancel',
      width: 500,
      onOk: async () => {
        try {
          setLoading(true);

          const totals = calculateTotals();

          const orderData = {
            orderType: 'Dine-In',
            tableId: tableId,
            customerName: customerName || 'Walk-in Customer',
            customerMobile: customerMobile || '',
            guestCount: 1,
            items: cartItems.map(item => ({
              subCode: item.subCode,
              itemName: item.itemName,
              quantity: item.quantity,
              unit: item.unit || 'Piece',
              price: item.price,
              itemTotal: item.itemTotal
            })),
            subtotal: totals.subtotal,
            discountPercent: totals.discountPercent,
            discountAmount: totals.discountAmount,
            gstAmount: totals.gstAmount,
            totalAmount: totals.totalAmount,
            roundOff: totals.roundOff,
            grandTotal: totals.grandTotal,
            remarks: '',
            specialInstructions: ''
          };

          console.log('Sending order data:', orderData);

          let response;
          if (isEditMode) {
            response = await api.put(`/orders/${editOrderId}`, orderData);
            console.log('Order updated response:', response.data);
          } else {
            response = await api.post('/orders', orderData);
            console.log('Order created response:', response.data);
          }

          if (response.data.success) {
            message.success(isEditMode ? 'Order updated successfully!' : 'Order created successfully! Table is now occupied.');

            // Navigate back to order view or tables
            setTimeout(() => {
              navigate(isEditMode ? `/orders/${editOrderId}` : '/tables');
            }, 800);
          } else {
            message.error(isEditMode ? 'Order updated but response was unsuccessful' : 'Order created but response was unsuccessful');
          }

        } catch (error) {
          console.error('Order operation error:', error);
          message.error(error.response?.data?.message || (isEditMode ? 'Failed to update order' : 'Failed to create order'));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Memoized cart columns to prevent recreation on every render
  const cartColumns = useMemo(() => [
    {
      title: 'Item',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (text) => <strong style={{ fontSize: 14 }}>{text || 'Unknown'}</strong>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (price) => <span style={{ fontWeight: 600, color: '#667eea' }}>₹{(price || 0).toFixed(2)}</span>,
      responsive: ['md']
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      render: (qty, record) => (
        <Space size={4} className="table-qty-control">
          <Button
            size="small"
            icon={<MinusOutlined style={{ fontSize: 12 }} />}
            onClick={(e) => {
              e.stopPropagation();
              updateQuantity(record._id, (qty || 1) - 1);
            }}
            disabled={(qty || 1) <= 1}
            style={{
              minWidth: 32,
              minHeight: 32,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
          <InputNumber
            min={1}
            max={record.currentStock || 999}
            value={qty || 1}
            onChange={(value) => updateQuantity(record._id, value)}
            controls={false}
            style={{
              width: 50,
              textAlign: 'center'
            }}
            className="table-qty-input"
          />
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined style={{ fontSize: 12 }} />}
            onClick={(e) => {
              e.stopPropagation();
              const maxStock = record.currentStock || 999;
              if ((qty || 1) < maxStock) {
                updateQuantity(record._id, (qty || 1) + 1);
              }
            }}
            disabled={record.currentStock && (qty || 1) >= record.currentStock}
            style={{
              minWidth: 32,
              minHeight: 32,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Space>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'itemTotal',
      key: 'itemTotal',
      align: 'right',
      render: (total) => <strong style={{ color: '#52c41a', fontSize: 15 }}>₹{(total || 0).toFixed(2)}</strong>,
    },
    {
      title: '',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Remove">
          <Button
            danger
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeFromCart(record._id)}
            style={{
              minWidth: 36,
              minHeight: 36
            }}
          />
        </Tooltip>
      ),
    },
  ], []);

  // Memoized totals calculation
  const totals = useMemo(() => calculateTotals(), [cartItems]);

  if (tableLoading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, fontSize: 16 }}>Loading table details...</p>
        </div>
      </Layout>
    );
  }

  if (!table) {
    return (
      <Layout>
        <div style={{ padding: '100px 0' }}>
          <Card>
            <Empty description="Table not found">
              <Button type="primary" onClick={() => navigate('/tables')}>
                Back to Tables
              </Button>
            </Empty>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '0 24px 24px' }}>
        {/* Header with Table Info */}
        <div style={{
          marginBottom: 20
        }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/tables')}
            style={{ marginBottom: 16 }}
            size="large"
          >
            Back to Tables
          </Button>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
            <TableOutlined style={{ color: '#667eea' }} />
            {editOrderId ? 'Edit Order' : 'Take Order'} - {table.tableName || 'Unknown Table'}
          </h1>
          <div style={{ marginTop: 12 }}>
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
              {table.tableNumber || 'N/A'}
            </Tag>
            <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
              {table.seatingCapacity || 0} Seats
            </Tag>
            {editOrderId && existingOrder && (
              <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>
                Editing Order: {existingOrder.orderNo}
              </Tag>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={8}>
            <Card style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}>
              <Statistic
                title={<span style={{ color: 'white', fontSize: 14 }}>Cart Items</span>}
                value={cartItems.length}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: 'white', fontSize: 28, fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none'
            }}>
              <Statistic
                title={<span style={{ color: 'white', fontSize: 14 }}>Total Quantity</span>}
                value={cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                valueStyle={{ color: 'white', fontSize: 28, fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none'
            }}>
              <Statistic
                title={<span style={{ color: 'white', fontSize: 14 }}>Grand Total</span>}
                value={totals.grandTotal}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white', fontSize: 28, fontWeight: 600 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Row gutter={16}>
          {/* Left: Items Selection */}
          <Col xs={24} lg={14}>
            <Card title={<span style={{ fontSize: 16, fontWeight: 600 }}>Select Items</span>}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Select
                  placeholder="Select Category"
                  style={{ width: '100%' }}
                  onChange={handleMainCodeChange}
                  value={selectedMainCode}
                  allowClear
                  size="large"
                >
                  {mainCodes.map((mc) => (
                    <Option key={mc._id} value={mc._id}>
                      {mc.name}
                    </Option>
                  ))}
                </Select>

                <Input
                  placeholder="Search items..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  size="large"
                  allowClear
                />
              </Space>

              <Divider />

              {filteredSubCodes.length === 0 ? (
                <Empty
                  description={selectedMainCode ? "No items found" : "Select a category to see items"}
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <Row gutter={[12, 12]}>
                  {filteredSubCodes.map((subCode) => (
                    <Col xs={24} sm={12} md={8} key={subCode._id}>
                      <Card
                        hoverable
                        onClick={() => addToCart(subCode)}
                        style={{
                          borderRadius: 8,
                          border: '2px solid #f0f0f0',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                        }}
                        bodyStyle={{ padding: 12 }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {subCode.name || 'Unknown Item'}
                          </div>
                          <div style={{ color: '#52c41a', fontWeight: 600, fontSize: 18 }}>
                            ₹{(subCode.price || 0).toFixed(2)}
                          </div>
                          {subCode.currentStock !== undefined && subCode.currentStock !== null && (
                            <Tag color={subCode.currentStock > 10 ? 'green' : subCode.currentStock > 0 ? 'orange' : 'red'} style={{ marginTop: 8 }}>
                              Stock: {subCode.currentStock}
                            </Tag>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          </Col>

          {/* Right: Cart */}
          <Col xs={24} lg={10}>
            <Card
              title={
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  <ShoppingCartOutlined style={{ marginRight: 8 }} />
                  Cart ({cartItems.length} items)
                </span>
              }
              extra={
                cartItems.length > 0 && (
                  <Button size="small" danger onClick={clearCart}>
                    Clear All
                  </Button>
                )
              }
            >
              {cartItems.length === 0 ? (
                <Empty description="Cart is empty" style={{ margin: '40px 0' }} />
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="cart-desktop-view">
                    <Table
                      columns={cartColumns}
                      dataSource={cartItems}
                      rowKey="_id"
                      pagination={false}
                      scroll={{ y: 300 }}
                      size="small"
                    />
                  </div>

                  {/* Mobile Card View */}
                  <div className="cart-mobile-view">
                    <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
                      {cartItems.map((item) => (
                        <Card
                          key={item._id}
                          size="small"
                          style={{
                            marginBottom: 12,
                            borderRadius: 12,
                            border: '1px solid #e8e8e8',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                          }}
                          bodyStyle={{ padding: 14 }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#262626' }}>
                                {item.itemName || 'Unknown Item'}
                              </div>
                              <div style={{ fontSize: 12, color: '#999' }}>
                                Price: <span style={{ color: '#667eea', fontWeight: 600 }}>₹{(item.price || 0).toFixed(2)}</span>
                              </div>
                            </div>
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => removeFromCart(item._id)}
                              style={{
                                minWidth: 44,
                                minHeight: 44,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Button
                                size="large"
                                onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)}
                                disabled={(item.quantity || 1) <= 1}
                                style={{
                                  minWidth: 48,
                                  minHeight: 48,
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 22,
                                  fontWeight: 700,
                                  borderRadius: 10
                                }}
                              >
                                −
                              </Button>
                              <div
                                style={{
                                  minWidth: 56,
                                  height: 48,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 20,
                                  fontWeight: 700,
                                  border: '2px solid #d9d9d9',
                                  borderRadius: 10,
                                  backgroundColor: '#fafafa'
                                }}
                              >
                                {item.quantity || 1}
                              </div>
                              <Button
                                size="large"
                                type="primary"
                                onClick={() => {
                                  const maxStock = item.currentStock || 999;
                                  if ((item.quantity || 1) < maxStock) {
                                    updateQuantity(item._id, (item.quantity || 1) + 1);
                                  }
                                }}
                                disabled={item.currentStock && (item.quantity || 1) >= item.currentStock}
                                style={{
                                  minWidth: 48,
                                  minHeight: 48,
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 22,
                                  fontWeight: 700,
                                  borderRadius: 10
                                }}
                              >
                                +
                              </Button>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Total</div>
                              <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>
                                ₹{(item.itemTotal || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Divider />

                  {/* Customer Details */}
                  <div style={{ marginBottom: 16 }}>
                    <Input
                      placeholder="Customer Name (Optional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{ marginBottom: 8 }}
                      size="large"
                    />
                    <Input
                      placeholder="Customer Mobile (Optional)"
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      maxLength={10}
                      size="large"
                    />
                  </div>

                  {/* Totals */}
                  <div style={{
                    background: '#f5f5f5',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 16
                  }}>
                    <Row justify="space-between" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>Subtotal:</span>
                      <strong style={{ fontSize: 16 }}>₹{totals.subtotal.toFixed(2)}</strong>
                    </Row>
                    <Divider style={{ margin: '8px 0' }} />
                    <Row justify="space-between">
                      <span style={{ fontSize: 18, fontWeight: 600 }}>Grand Total:</span>
                      <strong style={{ fontSize: 22, color: '#52c41a' }}>
                        ₹{totals.grandTotal.toFixed(2)}
                      </strong>
                    </Row>
                  </div>

                  {/* Generate Order Button */}
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<CheckCircleOutlined />}
                    onClick={handleGenerateOrder}
                    loading={loading}
                    style={{
                      height: 50,
                      fontSize: 16,
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    {editOrderId ? 'Update Order' : 'Generate Order & Lock Table'}
                  </Button>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Mobile-specific styles for cart and table order */}
      <style>{`
        /* Desktop: Show table, hide cards */
        .cart-desktop-view {
          display: block;
        }

        .cart-mobile-view {
          display: none;
        }

        @media (max-width: 768px) {
          /* Mobile: Hide table, show cards */
          .cart-desktop-view {
            display: none;
          }

          .cart-mobile-view {
            display: block;
          }

          /* Cart card mobile optimizations */
          .cart-mobile-view .ant-card {
            border-radius: 12px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          }

          .cart-mobile-view .ant-btn {
            border-radius: 10px !important;
            font-weight: 700 !important;
          }

          .cart-mobile-view .ant-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: none !important;
          }

          /* Table quantity controls mobile optimization (for desktop table view on small screens - fallback) */
          .table-qty-control {
            display: flex !important;
            align-items: center;
            gap: 4px !important;
          }

          .table-qty-control .ant-btn {
            min-width: 36px !important;
            min-height: 36px !important;
            font-size: 16px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 8px !important;
            padding: 0 !important;
          }

          .table-qty-input .ant-input-number-input {
            height: 36px !important;
            font-size: 16px !important;
            font-weight: 600;
            text-align: center;
          }

          /* Back button mobile */
          .ant-btn-lg {
            height: 44px !important;
          }

          /* Stat cards responsive */
          .ant-statistic-title {
            font-size: 13px !important;
          }

          .ant-statistic-content {
            font-size: 22px !important;
          }

          /* Input fields mobile */
          .ant-input-lg,
          .ant-select-selector {
            height: 48px !important;
            font-size: 16px !important;
          }

          /* Item cards clickable area */
          .ant-card-hoverable {
            min-height: 100px;
          }

          /* Generate order button mobile */
          .ant-btn-primary[block] {
            height: 56px !important;
            font-size: 17px !important;
          }
        }

        @media (max-width: 480px) {
          /* Extra small devices */
          .table-qty-control .ant-btn {
            min-width: 32px !important;
            min-height: 32px !important;
          }

          .cart-mobile-view .ant-btn {
            min-width: 44px !important;
            min-height: 44px !important;
          }
        }

        /* Touch-friendly enhancements */
        @media (hover: none) and (pointer: coarse) {
          .cart-mobile-view .ant-btn {
            min-width: 52px !important;
            min-height: 52px !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default TakeTableOrder;
