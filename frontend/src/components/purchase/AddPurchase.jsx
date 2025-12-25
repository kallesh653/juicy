import { useState, useEffect } from 'react';
import {
  Card, Form, Input, Select, DatePicker, InputNumber, Button, Table, message, Space, Row, Col, Divider
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, ClearOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';

const { TextArea } = Input;

const AddPurchase = () => {
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get('/suppliers?isActive=true');
      setSuppliers(data.suppliers || []);
    } catch (error) {
      message.error('Failed to load suppliers');
    }
  };

  const addItemToPurchase = (values) => {
    if (!values.itemName || !values.quantity || !values.rate) {
      message.error('Please fill in all required fields');
      return;
    }

    const total = values.quantity * values.rate;

    const newItem = {
      key: Date.now(),
      itemName: values.itemName,
      itemType: values.itemType || 'Raw Material',
      quantity: values.quantity,
      unit: values.unit || 'Piece',
      rate: values.rate,
      total: total,
      description: values.description || ''
    };

    setPurchaseItems([...purchaseItems, newItem]);

    // Reset item form fields
    form.setFieldsValue({
      itemName: undefined,
      itemType: 'Raw Material',
      quantity: 1,
      unit: 'Piece',
      rate: undefined,
      description: undefined
    });

    message.success('Item added to purchase list');
  };

  const removeItem = (key) => {
    setPurchaseItems(purchaseItems.filter(item => item.key !== key));
  };

  const calculateTotals = () => {
    return purchaseItems.reduce((sum, item) => sum + item.total, 0);
  };

  const savePurchase = async () => {
    if (purchaseItems.length === 0) {
      message.error('Please add at least one item');
      return;
    }

    try {
      const values = await form.validateFields(['supplier']);

      setLoading(true);

      const invoiceAmount = calculateTotals();
      const supplier = suppliers.find(s => s._id === values.supplier);

      const purchaseData = {
        supplier: values.supplier,
        supplierName: supplier.supplierName,
        supplierMobile: supplier.mobile,
        invoiceNo: values.invoiceNo || undefined,
        invoiceDate: values.invoiceDate ? values.invoiceDate.toDate() : undefined,
        invoiceAmount: invoiceAmount,
        paidAmount: values.paidAmount || 0,
        gstAmount: values.gstAmount || 0,
        cgst: values.cgst || 0,
        sgst: values.sgst || 0,
        igst: values.igst || 0,
        isLocalPurchase: values.isLocalPurchase || false,
        remarks: values.remarks || undefined,
        items: purchaseItems.map(item => ({
          itemName: item.itemName,
          itemType: item.itemType,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          total: item.total,
          description: item.description
        }))
      };

      const { data } = await api.post('/purchases', purchaseData);

      message.success('Purchase saved successfully!');

      // Reset form
      form.resetFields();
      setPurchaseItems([]);

    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    form.resetFields();
    setPurchaseItems([]);
  };

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          {record.description && (
            <div style={{ fontSize: 12, color: '#999' }}>{record.description}</div>
          )}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'itemType',
      key: 'itemType',
      width: 130,
      render: (type) => <span style={{ fontSize: 12 }}>{type}</span>
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (qty, record) => `${qty} ${record.unit}`
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      width: 120,
      render: (rate) => `₹${rate.toFixed(2)}`
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      render: (total) => <strong>₹{total.toFixed(2)}</strong>
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.key)}
        />
      )
    }
  ];

  return (
    <Layout>
      <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
        Add Purchase
      </h1>
      <p style={{ marginTop: -15, marginBottom: 24, color: '#666' }}>
        Add raw materials, packaging, and shop supplies purchase
      </p>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Purchase Details" style={{ marginBottom: 16 }}>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="supplier"
                    label="Supplier"
                    rules={[{ required: true, message: 'Please select supplier' }]}
                  >
                    <Select
                      placeholder="Select Supplier"
                      size="large"
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {suppliers.map(s => (
                        <Select.Option key={s._id} value={s._id}>
                          {s.supplierName} - {s.mobile}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="invoiceNo"
                    label="Invoice Number (Optional)"
                  >
                    <Input placeholder="INV-001 or leave blank" size="large" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="invoiceDate"
                    label="Invoice Date (Optional)"
                  >
                    <DatePicker style={{ width: '100%' }} size="large" placeholder="Select date" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="paidAmount" label="Paid Amount" initialValue={0}>
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      size="large"
                      placeholder="0.00"
                      prefix="₹"
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="isLocalPurchase" label="Purchase Type" initialValue={false}>
                    <Select size="large">
                      <Select.Option value={false}>Regular (with GST)</Select.Option>
                      <Select.Option value={true}>Local (No GST)</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name="cgst" label="CGST (%)" initialValue={0}>
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                      size="large"
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name="sgst" label="SGST (%)" initialValue={0}>
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                      size="large"
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name="igst" label="IGST (%)" initialValue={0}>
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                      size="large"
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item name="remarks" label="Remarks (Optional)">
                    <TextArea rows={2} placeholder="Additional notes..." />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <Card title="Add Raw Material Items">
            <Form layout="vertical" onFinish={addItemToPurchase}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="itemName"
                    label="Item Name"
                    rules={[{ required: true, message: 'Please enter item name' }]}
                  >
                    <Input
                      placeholder="e.g., Sugar, Bottles, Lemon, etc."
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="itemType"
                    label="Item Type"
                    initialValue="Raw Material"
                  >
                    <Select size="large">
                      <Select.Option value="Raw Material">Raw Material</Select.Option>
                      <Select.Option value="Packaging">Packaging</Select.Option>
                      <Select.Option value="Shop Supply">Shop Supply</Select.Option>
                      <Select.Option value="Other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="quantity"
                    label="Quantity"
                    initialValue={1}
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <InputNumber min={0.01} style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="unit"
                    label="Unit"
                    initialValue="Piece"
                  >
                    <Select size="large">
                      <Select.Option value="Piece">Piece</Select.Option>
                      <Select.Option value="KG">KG</Select.Option>
                      <Select.Option value="Liter">Liter</Select.Option>
                      <Select.Option value="ML">ML</Select.Option>
                      <Select.Option value="Gram">Gram</Select.Option>
                      <Select.Option value="Box">Box</Select.Option>
                      <Select.Option value="Packet">Packet</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="rate"
                    label="Rate (per unit)"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      size="large"
                      prefix="₹"
                      placeholder="0.00"
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item
                    name="description"
                    label="Description (Optional)"
                  >
                    <Input
                      placeholder="Additional details about the item..."
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    htmlType="submit"
                    size="large"
                  >
                    Add Item to Purchase
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card>

          <Card title="Purchase Items" style={{ marginTop: 16 }}>
            <Table
              dataSource={purchaseItems}
              columns={columns}
              pagination={false}
              size="small"
              locale={{ emptyText: 'No items added yet' }}
            />

            {purchaseItems.length > 0 && (
              <Button
                danger
                icon={<ClearOutlined />}
                onClick={clearAll}
                style={{ marginTop: 16 }}
              >
                Clear All
              </Button>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Purchase Summary" style={{ position: 'sticky', top: 24 }}>
            <div style={{ fontSize: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>Total Items:</span>
                <strong>{purchaseItems.length}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>Total Quantity:</span>
                <strong>{purchaseItems.reduce((sum, item) => sum + item.quantity, 0)}</strong>
              </div>

              <Divider />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 20, color: '#667eea' }}>
                <span style={{ fontWeight: 600 }}>Invoice Amount:</span>
                <strong>₹{calculateTotals().toFixed(2)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span>Paid Amount:</span>
                <span>₹{(form.getFieldValue('paidAmount') || 0).toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: '#ff4d4f' }}>
                <span style={{ fontWeight: 600 }}>Pending:</span>
                <strong>₹{(calculateTotals() - (form.getFieldValue('paidAmount') || 0)).toFixed(2)}</strong>
              </div>

              <Divider />

              <Button
                type="primary"
                size="large"
                block
                icon={<SaveOutlined />}
                onClick={savePurchase}
                loading={loading}
                disabled={purchaseItems.length === 0}
                style={{ height: 50, fontSize: 16, fontWeight: 600, marginBottom: 12 }}
              >
                Save Purchase
              </Button>

              <Button
                size="large"
                block
                icon={<ClearOutlined />}
                onClick={clearAll}
              >
                Reset Form
              </Button>
            </div>

            <Divider />

            <div style={{ background: '#f0f2f5', padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>What happens on save:</h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#666' }}>
                <li>Raw materials purchase is saved</li>
                <li>Supplier balance is updated</li>
                <li>Purchase history is recorded</li>
                <li>GST details are saved (if applicable)</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};

export default AddPurchase;
