import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coffee, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Database, 
  TrendingUp, 
  Check, 
  AlertCircle, 
  Package, 
  RefreshCw, 
  Layers, 
  FileText,
  Search,
  CheckCircle,
  X
} from 'lucide-react';

// === ข้อมูลเริ่มต้นสำหรับระบบจำลอง (Mock Data) ===
const INITIAL_CATEGORIES = [
  { id: 'coffee', name: 'กาแฟ (Coffee)', icon: '☕' },
  { id: 'tea', name: 'ชา (Tea)', icon: '🍵' },
  { id: 'bakery', name: 'เบเกอรี่ (Bakery)', icon: '🍰' },
  { id: 'other', name: 'เครื่องดื่มอื่นๆ (Others)', icon: '🥤' }
];

const INITIAL_PRODUCTS = [
  { id: 'p1', name: 'เอสเพรสโซ่ (Espresso)', price: 55, category: 'coffee', image: 'https://images.unsplash.com/photo-1510705315403-88ec7a0cd00f?w=150&auto=format&fit=crop&q=60', options: true, stock: 100 },
  { id: 'p2', name: 'ลาเต้ (Latte)', price: 65, category: 'coffee', image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?w=150&auto=format&fit=crop&q=60', options: true, stock: 100 },
  { id: 'p3', name: 'คาปูชิโน่ (Cappuccino)', price: 65, category: 'coffee', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=150&auto=format&fit=crop&q=60', options: true, stock: 100 },
  { id: 'p4', name: 'อเมริกาโน่ (Americano)', price: 50, category: 'coffee', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150&auto=format&fit=crop&q=60', options: true, stock: 100 },
  { id: 'p5', name: 'ชาเขียวมัทฉะ (Matcha Latte)', price: 70, category: 'tea', image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=150&auto=format&fit=crop&q=60', options: true, stock: 80 },
  { id: 'p6', name: 'ชาไทยเย็น (Thai Iced Tea)', price: 60, category: 'tea', image: 'https://images.unsplash.com/photo-1586944210601-39c13dd6162a?w=150&auto=format&fit=crop&q=60', options: true, stock: 90 },
  { id: 'p7', name: 'ครัวซองต์เนยสด (Butter Croissant)', price: 65, category: 'bakery', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=150&auto=format&fit=crop&q=60', options: false, stock: 15 },
  { id: 'p8', name: 'เค้กช็อกโกแลต (Chocolate Cake)', price: 85, category: 'bakery', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150&auto=format&fit=crop&q=60', options: false, stock: 10 },
];

const INITIAL_INVENTORY = [
  { id: 'i1', name: 'เมล็ดกาแฟ House Blend', quantity: 5.2, unit: 'กิโลกรัม', minQuantity: 2.0 },
  { id: 'i2', name: 'นมสดพาสเจอร์ไรส์', quantity: 18, unit: 'ลิตร', minQuantity: 5.0 },
  { id: 'i3', name: 'ผงมัทฉะอุจิ', quantity: 0.8, unit: 'กิโลกรัม', minQuantity: 0.3 },
  { id: 'i4', name: 'ไซรัปวานิลลา', quantity: 4, unit: 'ขวด', minQuantity: 1.0 },
  { id: 'i5', name: 'แก้วพลาสติก 16 ออนซ์', quantity: 450, unit: 'ใบ', minQuantity: 100 },
];

export default function App() {
  // === แท็บการทำงานหลัก ===
  const [activeTab, setActiveTab] = useState('pos'); // pos, menu, inventory, reports, supabase

  // === ตั้งค่าการเชื่อมต่อ Supabase ===
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('pos_sb_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('pos_sb_key') || '');
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ success: null, message: '' });

  // === States สำหรับเก็บข้อมูล ===
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('pos_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });
  
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('pos_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('pos_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('pos_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // === State ของระบบขาย (POS State) ===
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, promptpay, card
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastOrderReceipt, setLastOrderReceipt] = useState(null);
  
  // === ปรับปรุง UI: สลับการเปิด/ปิด ตะกร้าลอยน้ำ (Cart Drawer) ===
  const [isCartOpen, setIsCartOpen] = useState(false);

  // === สำหรับปรับแต่งตัวเลือกสินค้า (Customization Dialog) ===
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedSweetness, setSelectedSweetness] = useState('100%');
  const [selectedTemp, setSelectedTemp] = useState('เย็น'); // ร้อน, เย็น, ปั่น
  const [selectedSize, setSelectedSize] = useState('ปกติ'); // ปกติ, ใหญ่ (+10)

  // === สำหรับหน้าจัดการเมนู & คลัง (Forms) ===
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', price: '', category: 'coffee', image: '', options: true, stock: 50 });

  const [editingInventory, setEditingInventory] = useState(null);
  const [isAddingInventory, setIsAddingInventory] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({ name: '', quantity: '', unit: 'หน่วย', minQuantity: '' });

  // เซฟข้อมูลลง LocalStorage เมื่อมีการเปลี่ยนแปลง (กรณีที่ยังไม่ได้ต่อ Supabase หรือใช้เป็น Local Fallback)
  useEffect(() => {
    localStorage.setItem('pos_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('pos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('pos_orders', JSON.stringify(orders));
  }, [orders]);

  // ตรวจสอบสถานะการเชื่อมต่อ Supabase เบื้องต้น
  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      testSupabaseConnection(false);
    }
  }, []);

  // === ฟังก์ชันเชื่อมต่อและซิงค์ข้อมูลกับ Supabase (ใช้ REST API ของ Supabase โดยตรง) ===
  const testSupabaseConnection = async (showNotification = true) => {
    if (!supabaseUrl || !supabaseKey) {
      if (showNotification) {
        setSyncStatus({ success: false, message: 'กรุณากรอก Supabase URL และ Anon Key ให้ครบถ้วน' });
      }
      return;
    }

    setIsSyncing(true);
    try {
      // ทดสอบดึงข้อมูลจาก table 'products' พร้อมกำหนด charset=utf-8 ป้องกันอักษรเพี้ยน
      const response = await fetch(`${supabaseUrl}/rest/v1/products?select=*&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json; charset=utf-8'
        }
      });

      if (response.ok) {
        setIsConnected(true);
        localStorage.setItem('pos_sb_url', supabaseUrl);
        localStorage.setItem('pos_sb_key', supabaseKey);
        if (showNotification) {
          setSyncStatus({ success: true, message: 'เชื่อมต่อกับ Supabase สำเร็จแล้ว!' });
        }
        // ดึงข้อมูลจริงมาอัปเดตลงแอป
        pullDataFromSupabase();
      } else {
        throw new Error('ไม่สามารถเชื่อมต่อได้ ตรวจสอบสิทธิ์การเข้าถึงหรือชื่อตาราง');
      }
    } catch (error) {
      setIsConnected(false);
      if (showNotification) {
        setSyncStatus({ success: false, message: `ล้มเหลว: ${error.message}. กรุณาตรวจสอบให้มั่นใจว่าสร้าง Table ใน Supabase แล้ว` });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // ดึงข้อมูลจาก Supabase ลงเครื่อง
  const pullDataFromSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) return;
    setIsSyncing(true);
    try {
      // 1. ดึงเมนูสินค้า พร้อมตั้งค่า UTF-8 อย่างรัดกุม
      const resProducts = await fetch(`${supabaseUrl}/rest/v1/products?select=*`, {
        headers: { 
          'apikey': supabaseKey, 
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json; charset=utf-8'
        }
      });
      if (resProducts.ok) {
        const data = await resProducts.json();
        if (data && data.length > 0) setProducts(data);
      }

      // 2. ดึงคลังวัตถุดิบ
      const resInventory = await fetch(`${supabaseUrl}/rest/v1/inventory?select=*`, {
        headers: { 
          'apikey': supabaseKey, 
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json; charset=utf-8'
        }
      });
      if (resInventory.ok) {
        const data = await resInventory.json();
        if (data && data.length > 0) setInventory(data);
      }

      // 3. ดึงประวัติคำสั่งซื้อ
      const resOrders = await fetch(`${supabaseUrl}/rest/v1/orders?select=*&order=created_at.desc`, {
        headers: { 
          'apikey': supabaseKey, 
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json; charset=utf-8'
        }
      });
      if (resOrders.ok) {
        const data = await resOrders.json();
        if (data && data.length > 0) setOrders(data);
      }

    } catch (e) {
      console.error("Error pulling data: ", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // ดันข้อมูลยอดขายใหม่ขึ้น Supabase
  const pushOrderToSupabase = async (orderData) => {
    if (!isConnected || !supabaseUrl || !supabaseKey) return;
    try {
      await fetch(`${supabaseUrl}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(orderData)
      });
    } catch (e) {
      console.error("Error pushing order: ", e);
    }
  };

  // ซิงค์ข้อมูลสินค้าขึ้นลง Supabase (กำหนด charset UTF-8 เสมอ)
  const saveProductToSupabase = async (productData, isEdit = false) => {
    if (!isConnected || !supabaseUrl || !supabaseKey) return;
    try {
      const url = isEdit 
        ? `${supabaseUrl}/rest/v1/products?id=eq.${productData.id}`
        : `${supabaseUrl}/rest/v1/products`;
      
      const response = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(productData)
      });
      if (!response.ok) {
        throw new Error('Failed to save product to Supabase');
      }
    } catch (e) {
      console.error("Error saving product to Supabase: ", e);
    }
  };

  const deleteProductFromSupabase = async (productId) => {
    if (!isConnected || !supabaseUrl || !supabaseKey) return;
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete product from Supabase');
      }
    } catch (e) {
      console.error("Error deleting product from Supabase: ", e);
    }
  };

  // ซิงค์ข้อมูลคลังวัตถุดิบขึ้นลง Supabase
  const saveInventoryToSupabase = async (inventoryData, isEdit = false) => {
    if (!isConnected || !supabaseUrl || !supabaseKey) return;
    try {
      const url = isEdit 
        ? `${supabaseUrl}/rest/v1/inventory?id=eq.${inventoryData.id}`
        : `${supabaseUrl}/rest/v1/inventory`;
      
      const response = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(inventoryData)
      });
      if (!response.ok) {
        throw new Error('Failed to save inventory to Supabase');
      }
    } catch (e) {
      console.error("Error saving inventory to Supabase: ", e);
    }
  };

  const deleteInventoryFromSupabase = async (inventoryId) => {
    if (!isConnected || !supabaseUrl || !supabaseKey) return;
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/inventory?id=eq.${inventoryId}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete inventory from Supabase');
      }
    } catch (e) {
      console.error("Error deleting inventory from Supabase: ", e);
    }
  };

  // === ฟังก์ชันจัดการสินค้าในตะกร้า ===
  const handleAddToBag = (product) => {
    if (product.options) {
      // เปิดโมดอลปรับแต่งเครื่องดื่ม
      setCustomizingItem(product);
      setSelectedSweetness('100%');
      setSelectedTemp('เย็น');
      setSelectedSize('ปกติ');
    } else {
      // เพิ่มลงตะกร้าทันทีโดยไม่มีออปชัน (เช่น เบเกอรี่)
      addToCartWithDetails(product, null);
    }
  };

  const addToCartWithDetails = (product, details) => {
    const cartItemId = details 
      ? `${product.id}-${details.temp}-${details.sweetness}-${details.size}`
      : product.id;

    const priceModifier = details && details.size === 'ใหญ่' ? 10 : 0;
    const finalPrice = product.price + priceModifier;

    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item => 
          item.cartItemId === cartItemId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prev, {
          cartItemId,
          product,
          quantity: 1,
          price: finalPrice,
          details
        }];
      }
    });

    // ปิดโมดอลปรับแต่ง
    setCustomizingItem(null);
    
    // เปิด Drawer ตะกร้าสินค้าขึ้นมาอัตโนมัติเพื่อให้คนขายเห็นการเปลี่ยนแปลง
    setIsCartOpen(true);
  };

  const updateCartQuantity = (cartItemId, change) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = item.quantity + change;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  // คำนวณราคารวมในตะกร้า
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  // คำนวณจำนวนชิ้นทั้งหมดในตะกร้า
  const totalCartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // ทอนเงิน
  const changeAmount = useMemo(() => {
    const received = parseFloat(receivedAmount);
    if (isNaN(received) || received < totalAmount) return 0;
    return received - totalAmount;
  }, [receivedAmount, totalAmount]);

  // === ดำเนินการชำระเงิน ===
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && (receivedAmount === '' || parseFloat(receivedAmount) < totalAmount)) {
      // แนะนำ UI แสดงข้อผิดพลาดแบบนิ่มนวล ไม่ใช้ alert()
      return;
    }

    setIsProcessingPayment(true);

    // จำลองการตัดสต็อกวัตถุดิบและสต็อกสินค้า
    const updatedProducts = [...products];
    const updatedInventory = [...inventory];

    cart.forEach(cartItem => {
      // 1. ตัดสต็อกตัวสินค้า
      const prodIndex = updatedProducts.findIndex(p => p.id === cartItem.product.id);
      if (prodIndex !== -1 && updatedProducts[prodIndex].stock !== undefined) {
        updatedProducts[prodIndex].stock = Math.max(0, updatedProducts[prodIndex].stock - cartItem.quantity);
      }

      // 2. จำลองการตัดวัตถุดิบพื้นฐานตามประเภท
      if (cartItem.product.category === 'coffee') {
        const beansIndex = updatedInventory.findIndex(i => i.id === 'i1'); // เมล็ดกาแฟ
        const milkIndex = updatedInventory.findIndex(i => i.id === 'i2');  // นมสด
        if (beansIndex !== -1) updatedInventory[beansIndex].quantity = parseFloat((updatedInventory[beansIndex].quantity - (0.018 * cartItem.quantity)).toFixed(3)); // 18g ต่อแก้ว
        if (cartItem.product.name.includes('ลาเต้') || cartItem.product.name.includes('คาปูชิโน่')) {
          if (milkIndex !== -1) updatedInventory[milkIndex].quantity = parseFloat((updatedInventory[milkIndex].quantity - (0.150 * cartItem.quantity)).toFixed(2)); // 150ml ต่อแก้ว
        }
      }
    });

    setProducts(updatedProducts);
    setInventory(updatedInventory);

    // บันทึกข้อมูลบิลคำสั่งซื้อ
    const newOrder = {
      id: 'ORD-' + Date.now().toString().slice(-6),
      created_at: new Date().toISOString(),
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        details: item.details
      })),
      total: totalAmount,
      received: paymentMethod === 'cash' ? parseFloat(receivedAmount) : totalAmount,
      change: paymentMethod === 'cash' ? changeAmount : 0,
      payment_method: paymentMethod
    };

    setOrders(prev => [newOrder, ...prev]);
    setLastOrderReceipt(newOrder);

    // บันทึกลง Supabase ถ้าเชื่อมต่ออยู่
    if (isConnected) {
      await pushOrderToSupabase(newOrder);
      
      // อัปเดตสต็อกสินค้าที่เปลี่ยนไปบน Supabase
      for (const cartItem of cart) {
        const updatedProd = updatedProducts.find(p => p.id === cartItem.product.id);
        if (updatedProd) {
          await saveProductToSupabase(updatedProd, true);
        }
      }

      // อัปเดตสต็อกวัตถุดิบที่ใช้ไปบน Supabase
      if (cart.some(item => item.product.category === 'coffee')) {
        const updatedBeans = updatedInventory.find(i => i.id === 'i1');
        const updatedMilk = updatedInventory.find(i => i.id === 'i2');
        if (updatedBeans) await saveInventoryToSupabase(updatedBeans, true);
        if (updatedMilk) await saveInventoryToSupabase(updatedMilk, true);
      }
    }

    // ดีเลย์นิดหน่อยเพื่อความสมจริงของระบบ POS
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      setCart([]);
      setReceivedAmount('');
      setIsCartOpen(false); // ปิดตะกร้าเมื่อชำระเงินสำเร็จ
    }, 800);
  };

  // === ฟังก์ชันสำหรับหน้าตั้งค่าเมนู (CRUD Products) ===
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    const priceNum = parseFloat(productForm.price);
    const stockNum = parseInt(productForm.stock) || 0;

    let targetProduct = null;

    if (editingProduct) {
      // แก้ไขสินค้า
      targetProduct = {
        id: editingProduct.id,
        name: productForm.name,
        price: priceNum,
        category: productForm.category,
        image: productForm.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop&q=60',
        options: productForm.options,
        stock: stockNum
      };

      const updated = products.map(p => p.id === editingProduct.id ? targetProduct : p);
      setProducts(updated);
      setEditingProduct(null);

      // ซิงค์ไป Supabase
      if (isConnected) {
        await saveProductToSupabase(targetProduct, true);
      }
    } else {
      // เพิ่มสินค้าใหม่
      targetProduct = {
        id: 'p-' + Date.now(),
        name: productForm.name,
        price: priceNum,
        category: productForm.category,
        image: productForm.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop&q=60',
        options: productForm.options,
        stock: stockNum
      };

      setProducts([...products, targetProduct]);
      setIsAddingProduct(false);

      // ซิงค์ไป Supabase
      if (isConnected) {
        await saveProductToSupabase(targetProduct, false);
      }
    }

    // รีเซ็ตฟอร์ม
    setProductForm({ name: '', price: '', category: 'coffee', image: '', options: true, stock: 50 });
  };

  const startEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      price: prod.price.toString(),
      category: prod.category,
      image: prod.image,
      options: prod.options,
      stock: prod.stock ? prod.stock.toString() : '0'
    });
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("คุณต้องการลบเมนูนี้ใช่หรือไม่?")) {
      setProducts(products.filter(p => p.id !== id));
      
      // ลบจาก Supabase
      if (isConnected) {
        await deleteProductFromSupabase(id);
      }
    }
  };

  // === ฟังก์ชันสำหรับหน้าจัดการคลัง (CRUD Inventory) ===
  const handleSaveInventory = async (e) => {
    e.preventDefault();
    if (!inventoryForm.name || !inventoryForm.quantity) return;

    const qtyNum = parseFloat(inventoryForm.quantity);
    const minQtyNum = parseFloat(inventoryForm.minQuantity) || 0;

    let targetItem = null;

    if (editingInventory) {
      targetItem = {
        id: editingInventory.id,
        name: inventoryForm.name,
        quantity: qtyNum,
        unit: inventoryForm.unit,
        minQuantity: minQtyNum
      };

      const updated = inventory.map(item => item.id === editingInventory.id ? targetItem : item);
      setInventory(updated);
      setEditingInventory(null);

      // ซิงค์ไป Supabase
      if (isConnected) {
        await saveInventoryToSupabase(targetItem, true);
      }
    } else {
      targetItem = {
        id: 'i-' + Date.now(),
        name: inventoryForm.name,
        quantity: qtyNum,
        unit: inventoryForm.unit,
        minQuantity: minQtyNum
      };

      setInventory([...inventory, targetItem]);
      setIsAddingInventory(false);

      // ซิงค์ไป Supabase
      if (isConnected) {
        await saveInventoryToSupabase(targetItem, false);
      }
    }

    setInventoryForm({ name: '', quantity: '', unit: 'หน่วย', minQuantity: '' });
  };

  const startEditInventory = (item) => {
    setEditingInventory(item);
    setInventoryForm({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      minQuantity: item.minQuantity ? item.minQuantity.toString() : '0'
    });
    setIsAddingInventory(false);
  };

  const handleDeleteInventory = async (id) => {
    if (window.confirm("คุณต้องการลบวัตถุดิบนี้ใช่หรือไม่?")) {
      setInventory(inventory.filter(item => item.id !== id));

      // ลบจาก Supabase
      if (isConnected) {
        await deleteInventoryFromSupabase(id);
      }
    }
  };

  // กรองเมนูฝั่ง POS
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // สรุปยอดขายประจำวัน
  const salesSummary = useMemo(() => {
    const total = orders.reduce((sum, o) => sum + o.total, 0);
    const count = orders.length;
    
    // หาเมนูขายดี
    const menuCounts = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        menuCounts[item.name] = (menuCounts[item.name] || 0) + item.quantity;
      });
    });
    
    const bestSeller = Object.entries(menuCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'ไม่มีข้อมูล';

    return { total, count, bestSeller };
  }, [orders]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 relative">
      
      {/* --- ส่วนหัว / Header Bar --- */}
      <header className="bg-slate-900 text-white shadow-md px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 p-2.5 rounded-xl shadow-inner">
            <Coffee className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Caffeine POS Studio</h1>
            <p className="text-xs text-slate-400">ระบบจัดการหน้าร้าน & คลังกาแฟระดับพรีเมียม</p>
          </div>
        </div>

        {/* เมนูแท็บหลัก */}
        <nav className="flex bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => { setActiveTab('pos'); setPaymentSuccess(false); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${activeTab === 'pos' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>ขายหน้าร้าน (POS)</span>
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${activeTab === 'menu' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'}`}
          >
            <Layers className="h-4 w-4" />
            <span>จัดการเมนู</span>
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${activeTab === 'inventory' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'}`}
          >
            <Package className="h-4 w-4" />
            <span>คลังวัตถุดิบ</span>
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${activeTab === 'reports' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'}`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>รายงานยอดขาย</span>
          </button>
        </nav>

        {/* ตะกร้าและสถานะเชื่อมต่อ Supabase */}
        <div className="flex items-center space-x-3">
          {activeTab === 'pos' && (
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-2.5 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-750 transition-colors"
              title="เปิดตะกร้าสินค้า"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalCartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center animate-pulse">
                  {totalCartItemsCount}
                </span>
              )}
            </button>
          )}

          <button 
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
              isConnected 
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-rose-500/10 border-rose-500 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isConnected ? 'เชื่อมต่อ Supabase แล้ว' : 'โหมดออฟไลน์ / คลิกต่อ Supabase'}</span>
            <span className="h-2 w-2 rounded-full bg-current animate-pulse"></span>
          </button>
        </div>
      </header>

      {/* --- ส่วนเนื้อหาหลัก / Content --- */}
      <main className="flex-1 overflow-hidden relative">
        
        {/* ================= TAB 1: POS ================= */}
        {activeTab === 'pos' && (
          <div className="flex h-full flex-col lg:flex-row relative">
            
            {/* ซีกหลัก: เลือกสินค้า (Products & Categories) - ขยายเต็มสตรีมเพื่อลดความแออัด */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col space-y-6">
              
              {/* แถบค้นหาและตัวกรองหมวดหมู่ */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="h-5 w-5" />
                  </span>
                  <input 
                    type="text" 
                    placeholder="ค้นหาชื่อเครื่องดื่มหรือขนม..." 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* หมวดหมู่ */}
                <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 ${selectedCategory === 'all' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    💡 ทั้งหมด
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 ${selectedCategory === cat.id ? 'bg-amber-500 text-slate-950 shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* รายการสินค้าในหน้าร้าน (ปรับขนาด Grid ให้รองรับหน้าจอเต็มบาน) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => {
                  const isLowStock = product.stock !== undefined && product.stock <= 10;
                  return (
                    <div 
                      key={product.id}
                      onClick={() => handleAddToBag(product)}
                      className="group bg-white rounded-2xl border border-slate-200 p-3 shadow-sm hover:shadow-md hover:border-amber-400 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                    >
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3 bg-slate-100">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop&q=60'; }}
                        />
                        {product.options && (
                          <span className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            เลือกปรับแต่งได้
                          </span>
                        )}
                        {isLowStock && (
                          <span className="absolute bottom-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            สต็อกเหลือ: {product.stock}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 min-h-[40px]">{product.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-amber-600 font-extrabold text-base">฿{product.price}</span>
                          <button className="bg-slate-100 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-600 p-1.5 rounded-lg transition-colors duration-150">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Coffee className="h-12 w-12 mx-auto mb-3 stroke-1" />
                  <p className="text-base font-medium">ไม่พบรายการเมนูที่ตรงกับคำค้นหาของคุณ</p>
                </div>
              )}
            </div>

            {/* --- SLIDE-OVER DRAWER CART: ตะกร้าสินค้าสไลด์ด้านข้าง --- */}
            {isCartOpen && (
              <>
                {/* แผ่นหลังกึ่งโปร่งใสสำหรับกดยกเลิก */}
                <div 
                  className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity"
                  onClick={() => setIsCartOpen(false)}
                />
                
                <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 flex flex-col h-full shadow-2xl transform animate-slide-in border-l border-slate-200">
                  
                  {/* หัวข้อตะกร้าและปุ่มปิด */}
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                    <div className="flex items-center space-x-2">
                      <ShoppingBag className="h-5 w-5 text-amber-400" />
                      <span className="font-bold">รายการในตะกร้า ({cart.length})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {cart.length > 0 && (
                        <button 
                          onClick={() => setCart([])}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>ล้างทั้งหมด</span>
                        </button>
                      )}
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* รายการในตะกร้า */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
                        <ShoppingBag className="h-12 w-12 stroke-1 mb-2 text-slate-300" />
                        <p className="text-sm font-bold">ตะกร้าว่างเปล่า</p>
                        <p className="text-xs text-slate-450 mt-1">กรุณาแตะเลือกเครื่องดื่มด้านหลังเพื่อสั่งซื้อ</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.cartItemId} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-105">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-slate-800">{item.product.name}</h4>
                              {item.details && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  • {item.details.temp} • หวาน {item.details.sweetness} • ไซส์ {item.details.size}
                                </p>
                              )}
                            </div>
                            <span className="font-extrabold text-sm text-slate-800">฿{item.price * item.quantity}</span>
                          </div>
                          
                          {/* ปรับแต่งจำนวนสินค้า */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/50">
                            <span className="text-xs text-slate-400">฿{item.price} / แก้ว</span>
                            <div className="flex items-center space-x-2.5">
                              <button 
                                onClick={() => updateCartQuantity(item.cartItemId, -1)}
                                className="bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 p-1 rounded-md"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="font-bold text-sm">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQuantity(item.cartItemId, 1)}
                                className="bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 p-1 rounded-md"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => removeFromCart(item.cartItemId)}
                                className="text-rose-500 hover:text-rose-700 ml-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* ยอดรวม & หน้าต่างการจ่ายเงิน */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">รวมทั้งสิ้น</span>
                      <span className="text-2xl font-black text-slate-950">฿{totalAmount}</span>
                    </div>

                    {cart.length > 0 && (
                      <div className="space-y-3">
                        {/* เลือกประเภทการจ่ายเงิน */}
                        <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">วิธีชำระเงิน</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => { setPaymentMethod('cash'); setReceivedAmount(''); }}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all duration-150 ${paymentMethod === 'cash' ? 'bg-amber-500/15 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-600'}`}
                            >
                              💸 เงินสด
                            </button>
                            <button
                              onClick={() => { setPaymentMethod('promptpay'); setReceivedAmount(totalAmount.toString()); }}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all duration-150 ${paymentMethod === 'promptpay' ? 'bg-amber-500/15 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-600'}`}
                            >
                              📱 PromptPay
                            </button>
                            <button
                              onClick={() => { setPaymentMethod('card'); setReceivedAmount(totalAmount.toString()); }}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all duration-150 ${paymentMethod === 'card' ? 'bg-amber-500/15 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-600'}`}
                            >
                              💳 บัตรเครดิต
                            </button>
                          </div>
                        </div>

                        {/* ช่องสำหรับรับเงินสด */}
                        {paymentMethod === 'cash' && (
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 block">รับเงินสดมา (บาท)</label>
                            <input 
                              type="number" 
                              placeholder="กรอกจำนวนเงินที่รับมา..." 
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-base font-extrabold"
                              value={receivedAmount}
                              onChange={(e) => setReceivedAmount(e.target.value)}
                            />
                            
                            {/* ปุ่มตัวเลือกเงินด่วน */}
                            <div className="grid grid-cols-4 gap-1.5 pt-1">
                              {[totalAmount, 100, 500, 1000].map(val => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setReceivedAmount(val.toString())}
                                  className="bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 py-1.5 px-1 rounded-lg text-xs font-semibold"
                                >
                                  {val === totalAmount ? 'พอดี' : val}
                                </button>
                              ))}
                            </div>

                            {/* เงินทอน */}
                            {parseFloat(receivedAmount) >= totalAmount && (
                              <div className="flex justify-between items-center bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2">
                                <span className="text-xs text-amber-800 font-bold">เงินทอน</span>
                                <span className="text-lg font-black text-amber-900">฿{changeAmount}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ปุ่มสรุปบิลสั่งซื้อ */}
                        <button
                          onClick={handleCheckout}
                          disabled={isProcessingPayment}
                          className="w-full bg-slate-900 text-amber-400 hover:bg-slate-950 hover:text-amber-300 transition-colors py-3.5 rounded-xl text-base font-bold flex items-center justify-center space-x-2 shadow-md disabled:bg-slate-400 disabled:text-slate-200"
                        >
                          <span>{isProcessingPayment ? 'กำลังบันทึกบิล...' : 'พิมพ์ใบเสร็จ & บันทึกขาย'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </>
            )}

            {/* --- FLOAT BUTTON ตะกร้าสินค้า --- */}
            {!isCartOpen && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="fixed bottom-6 right-6 bg-slate-900 hover:bg-slate-950 text-amber-400 p-4.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-40 border-2 border-amber-500 flex items-center justify-center animate-bounce group"
                style={{ animationDuration: '3s' }}
              >
                <div className="relative">
                  <ShoppingBag className="h-7 w-7" />
                  {totalCartItemsCount > 0 ? (
                    <span className="absolute -top-3 -right-3 bg-rose-500 text-white text-xs font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-slate-900">
                      {totalCartItemsCount}
                    </span>
                  ) : (
                    <span className="absolute -top-1 -right-1 bg-amber-500 h-2 w-2 rounded-full"></span>
                  )}
                </div>
                {totalAmount > 0 && (
                  <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 text-xs font-bold transition-all duration-300 whitespace-nowrap">
                    ดูตะกร้า ฿{totalAmount}
                  </span>
                )}
              </button>
            )}

          </div>
        )}

        {/* ================= TAB 2: MANAGE MENU ================= */}
        {activeTab === 'menu' && (
          <div className="h-full p-6 overflow-y-auto flex flex-col md:flex-row gap-6">
            
            {/* ฝั่งซ้าย: ตารางรายการเมนู */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">☕ รายการเมนูทั้งหมดของร้าน ({products.length} เมนู)</h2>
                <button
                  onClick={() => {
                    setIsAddingProduct(true);
                    setEditingProduct(null);
                    setProductForm({ name: '', price: '', category: 'coffee', image: '', options: true, stock: 50 });
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>เพิ่มเมนูใหม่</span>
                </button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase bg-slate-50/50">
                      <th className="py-3 px-4">เมนู</th>
                      <th className="py-3 px-4">หมวดหมู่</th>
                      <th className="py-3 px-4">ราคาเริ่มต้น</th>
                      <th className="py-3 px-4">ตัวปรับแต่ง</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 flex items-center space-x-3">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop&q=60'; }}
                          />
                          <span className="font-bold text-slate-800">{product.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {categories.find(c => c.id === product.category)?.name || product.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-amber-600">฿{product.price}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${product.options ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                            {product.options ? 'มีปรับระดับ/ไซส์' : 'ไม่มี'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button 
                            onClick={() => startEditProduct(product)}
                            className="text-amber-600 hover:text-amber-800 font-semibold text-xs"
                          >
                            แก้ไข
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-rose-500 hover:text-rose-700 font-semibold text-xs"
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ฝั่งขวา: ฟอร์มเพิ่ม/แก้ไขสินค้า */}
            {(isAddingProduct || editingProduct) && (
              <div className="w-full md:w-80 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
                  {editingProduct ? '✏️ แก้ไขเมนู' : '➕ เพิ่มเมนูใหม่'}
                </h3>
                <form onSubmit={handleSaveProduct} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1 font-semibold">ชื่อเมนู</label>
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น คาปูชิโน่เย็น" 
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 font-semibold">ราคา (บาท)</label>
                      <input 
                        type="number" 
                        required
                        placeholder="60" 
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 font-semibold">สต็อกสินค้าเบื้องต้น</label>
                      <input 
                        type="number" 
                        placeholder="50" 
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1 font-semibold">หมวดหมู่</label>
                    <select 
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1 font-semibold">ลิงก์รูปภาพสินค้า (URL)</label>
                    <input 
                      type="text" 
                      placeholder="https://images.unsplash.com/..." 
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      value={productForm.image}
                      onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="has_options"
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                      checked={productForm.options}
                      onChange={(e) => setProductForm({...productForm, options: e.target.checked})}
                    />
                    <label htmlFor="has_options" className="text-xs font-semibold text-slate-600">มีตัวเลือกปรับแต่ง (หวาน, ร้อน/เย็น, ขนาด)</label>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-xl text-xs"
                    >
                      บันทึกรายการ
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-2 px-3 rounded-xl text-xs"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: INVENTORY ================= */}
        {activeTab === 'inventory' && (
          <div className="h-full p-6 overflow-y-auto flex flex-col md:flex-row gap-6">
            
            {/* ซีกซ้าย: ตารางคลังวัตถุดิบ */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-slate-800">📦 รายการวัตถุดิบในคลังสินค้า</h2>
                </div>
                <button
                  onClick={() => {
                    setIsAddingInventory(true);
                    setEditingInventory(null);
                    setInventoryForm({ name: '', quantity: '', unit: 'หน่วย', minQuantity: '' });
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>เพิ่มวัตถุดิบ</span>
                </button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase bg-slate-50/50">
                      <th className="py-3 px-4">ชื่อวัตถุดิบ</th>
                      <th className="py-3 px-4">คงเหลือปัจจุบัน</th>
                      <th className="py-3 px-4">แจ้งเตือนขั้นต่ำ</th>
                      <th className="py-3 px-4">สถานะคลัง</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {inventory.map(item => {
                      const isLow = item.quantity <= item.minQuantity;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800">{item.name}</td>
                          <td className="py-3 px-4 text-base font-extrabold text-slate-900">
                            {item.quantity} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {item.minQuantity} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold inline-flex items-center space-x-1 ${isLow ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'} mr-1`}></span>
                              {isLow ? 'ของใกล้หมด!' : 'ปกติ'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button 
                              onClick={() => startEditInventory(item)}
                              className="text-amber-600 hover:text-amber-800 font-semibold text-xs"
                            >
                              เติมของ / แก้ไข
                            </button>
                            <button 
                              onClick={() => handleDeleteInventory(item.id)}
                              className="text-rose-500 hover:text-rose-700 font-semibold text-xs"
                            >
                              ลบ
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ซีกขวา: ฟอร์มเพิ่ม/แก้ไขคลังวัตถุดิบ */}
            {(isAddingInventory || editingInventory) && (
              <div className="w-full md:w-80 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
                  {editingInventory ? '✏️ อัปเดตวัตถุดิบ' : '➕ เพิ่มวัตถุดิบใหม่'}
                </h3>
                <form onSubmit={handleSaveInventory} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1 font-semibold">ชื่อวัตถุดิบ</label>
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น นมจืดเมจิ" 
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      value={inventoryForm.name}
                      onChange={(e) => setInventoryForm({...inventoryForm, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 font-semibold">จำนวนคงคลัง</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        placeholder="10.5" 
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        value={inventoryForm.quantity}
                        onChange={(e) => setInventoryForm({...inventoryForm, quantity: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-550 mb-1 font-semibold">หน่วยเรียก</label>
                      <input 
                        type="text" 
                        required
                        placeholder="ลิตร / กิโลกรัม" 
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        value={inventoryForm.unit}
                        onChange={(e) => setInventoryForm({...inventoryForm, unit: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1 font-semibold">จำนวนแจ้งเตือนขั้นต่ำ</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="3" 
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      value={inventoryForm.minQuantity}
                      onChange={(e) => setInventoryForm({...inventoryForm, minQuantity: e.target.value})}
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-xl text-xs"
                    >
                      บันทึกวัตถุดิบ
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddingInventory(false); setEditingInventory(null); }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-2 px-3 rounded-xl text-xs"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: REPORTS ================= */}
        {activeTab === 'reports' && (
          <div className="h-full p-6 overflow-y-auto space-y-6">
            
            {/* สรุปตัวเลขยอดขาย (Card Widgets) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between border border-slate-800">
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-semibold">ยอดขายสะสมรวม</span>
                  <h3 className="text-3xl font-black text-amber-400">฿{salesSummary.total}</h3>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-amber-400" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-slate-500 text-xs font-semibold">จำนวนออเดอร์ขาย</span>
                  <h3 className="text-3xl font-black text-slate-900">{salesSummary.count} ออเดอร์</h3>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl">
                  <FileText className="h-6 w-6 text-amber-500" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-slate-500 text-xs font-semibold">เมนูขายดีประจำวัน</span>
                  <h3 className="text-xl font-bold text-slate-900 truncate max-w-[200px]">
                    {salesSummary.bestSeller}
                  </h3>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl">
                  <Coffee className="h-6 w-6 text-emerald-600" />
                </div>
              </div>

            </div>

            {/* ตารางบิลการขายล่าสุด */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4">📑 ประวัติการออกใบเสร็จ / บิลขายของวันนี้</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase bg-slate-50/50">
                      <th className="py-3 px-4">เลขบิล (Order ID)</th>
                      <th className="py-3 px-4">วัน-เวลา</th>
                      <th className="py-3 px-4">รายการสินค้า</th>
                      <th className="py-3 px-4">ช่องทางชำระ</th>
                      <th className="py-3 px-4">ยอดชำระจริง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400">ยังไม่มีข้อมูลประวัติยอดขายของวันนี้</td>
                      </tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-amber-600">{order.id}</td>
                          <td className="py-3 px-4 text-slate-500 text-xs">
                            {new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
                          </td>
                          <td className="py-3 px-4 max-w-[300px]">
                            <div className="truncate text-xs text-slate-600">
                              {order.items.map(i => `${i.name} (${i.quantity}x)`).join(', ')}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                              {order.payment_method === 'cash' ? '💵 เงินสด' : order.payment_method === 'promptpay' ? '📱 PromptPay' : '💳 บัตรเครดิต'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900">฿{order.total}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 5: SUPABASE INTEGRATION ================= */}
        {activeTab === 'supabase' && (
          <div className="h-full p-6 overflow-y-auto max-w-4xl mx-auto space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="bg-emerald-500 text-white p-2.5 rounded-xl">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">เชื่อมต่อ Supabase Database ของคุณ</h2>
                  <p className="text-xs text-slate-500">บันทึกข้อมูล ยอดขาย และคลังสินค้าแบบ Cloud-Database และดึงข้อมูลใช้งานข้ามเครื่องได้ทันที</p>
                </div>
              </div>

              {/* ช่องกรอกข้อมูล */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Supabase URL</label>
                  <input 
                    type="text" 
                    placeholder="https://your-project-id.supabase.co" 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Supabase Anon Key (API Key)</label>
                  <input 
                    type="password" 
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here..." 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                  />
                </div>
              </div>

              {/* การแจ้งเตือนสถานะ */}
              {syncStatus.message && (
                <div className={`p-4 rounded-xl flex items-start space-x-2 border text-sm ${syncStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                  {syncStatus.success ? <Check className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                  <span>{syncStatus.message}</span>
                </div>
              )}

              {/* ปุ่มเชื่อมต่อ */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => testSupabaseConnection(true)}
                  disabled={isSyncing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all disabled:bg-slate-300"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'กำลังซิงค์และตรวจสอบ...' : 'เชื่อมต่อ & ซิงค์ข้อมูล'}</span>
                </button>
                {isConnected && (
                  <button
                    onClick={() => {
                      setIsConnected(false);
                      setSupabaseUrl('');
                      setSupabaseKey('');
                      localStorage.removeItem('pos_sb_url');
                      localStorage.removeItem('pos_sb_key');
                      setSyncStatus({ success: null, message: 'ตัดการเชื่อมต่อแล้ว' });
                    }}
                    className="border border-slate-300 hover:bg-slate-50 text-slate-650 font-bold px-4 py-2.5 rounded-xl text-xs"
                  >
                    ตัดการเชื่อมต่อคลาวด์
                  </button>
                )}
              </div>
            </div>

            {/* โครงสร้าง Database Schema */}
            <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-1">
                <span>🛠️ โครงสร้างตาราง (SQL DDL Schema) สำหรับสร้างบน Supabase</span>
              </h3>
              <p className="text-xs text-slate-400">
                เพื่อให้ระบบบันทึกและซิงค์ข้อมูลได้ปกติ กรุณาไปเปิด SQL Editor บนเครื่องมือ Supabase ของคุณแล้ว Run คำสั่งด้านล่างนี้เพื่อสร้าง Table ทั้ง 3 ตาราง:
              </p>
              
              <pre className="bg-slate-950 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto text-emerald-400 border border-slate-800 leading-relaxed">
{`-- 1. ตารางผลิตภัณฑ์ (products)
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT,
  image TEXT,
  options BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางคลังวัตถุดิบ (inventory)
CREATE TABLE inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  minQuantity NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางยอดขาย (orders)
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  received NUMERIC NOT NULL,
  change NUMERIC NOT NULL,
  payment_method TEXT NOT NULL
);`}
              </pre>
            </div>

          </div>
        )}

      </main>

      {/* ================= MODAL: ปรับแต่งสินค้า ================= */}
      {customizingItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coffee className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-base">ปรับแต่งแก้วของคุณ</h3>
              </div>
              <button 
                onClick={() => setCustomizingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                <img 
                  src={customizingItem.image} 
                  alt={customizingItem.name} 
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <h4 className="font-black text-slate-800 text-base">{customizingItem.name}</h4>
                  <p className="text-amber-600 font-extrabold text-sm">ราคาเริ่มต้น ฿{customizingItem.price}</p>
                </div>
              </div>

              {/* เลือกร้อน/เย็น/ปั่น */}
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1.5">อุณหภูมิ</span>
                <div className="grid grid-cols-3 gap-2">
                  {['ร้อน', 'เย็น', 'ปั่น'].map(temp => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => setSelectedTemp(temp)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${selectedTemp === temp ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {temp === 'ร้อน' ? '☕ ร้อน' : temp === 'เย็น' ? '🧊 เย็น' : '🌪️ ปั่น'}
                    </button>
                  ))}
                </div>
              </div>

              {/* เลือกความหวาน */}
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1.5">ระดับความหวาน</span>
                <div className="grid grid-cols-4 gap-2">
                  {['0%', '50%', '100%', '120%'].map(sweet => (
                    <button
                      key={sweet}
                      type="button"
                      onClick={() => setSelectedSweetness(sweet)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${selectedSweetness === sweet ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {sweet === '0%' ? 'ไม่หวาน' : sweet === '50%' ? 'หวานน้อย' : sweet === '100%' ? 'ปกติ' : 'หวานมาก'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ขนาดแก้ว */}
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1.5">ขนาดแก้ว</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ปกติ', label: 'ปกติ (M)', add: 0 },
                    { id: 'ใหญ่', label: 'ใหญ่ (L)', add: 10 }
                  ].map(sz => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setSelectedSize(sz.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex justify-between items-center ${selectedSize === sz.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      <span>{sz.label}</span>
                      <span className="text-[10px] font-normal">{sz.add > 0 ? `+฿${sz.add}` : 'ราคาปกติ'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ปุ่มเพิ่มลงตะกร้า */}
              <button
                onClick={() => addToCartWithDetails(customizingItem, {
                  temp: selectedTemp,
                  sweetness: selectedSweetness,
                  size: selectedSize
                })}
                className="w-full bg-slate-900 text-amber-400 hover:bg-slate-950 py-3 rounded-xl font-bold text-sm mt-2 transition-colors"
              >
                ใส่ตระกร้าสั่งซื้อ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ยืนยันจ่ายเงิน / พิมพ์ใบเสร็จ ================= */}
      {paymentSuccess && lastOrderReceipt && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-emerald-550 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-extrabold text-lg">ชำระเงินสำเร็จ!</h3>
              <p className="text-xs text-emerald-100">บันทึกบิล {lastOrderReceipt.id} และตัดสต็อกเรียบร้อย</p>
            </div>

            {/* หน้าตาใบเสร็จจำลอง */}
            <div className="p-6 bg-amber-50/20 text-xs font-mono text-slate-700 border-b border-dashed border-slate-200 space-y-3">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-800">CAFFEINE POS COFFEE SHOP</h4>
                <p className="text-[10px] text-slate-400">ใบเสร็จรับเงินอย่างย่อ</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-200 py-2 space-y-1 text-[10px]">
                <p>เลขที่บิล: {lastOrderReceipt.id}</p>
                <p>วันที่: {new Date(lastOrderReceipt.created_at).toLocaleDateString('th-TH')} {new Date(lastOrderReceipt.created_at).toLocaleTimeString('th-TH')}</p>
                <p>การชำระ: {lastOrderReceipt.payment_method === 'cash' ? 'เงินสด' : lastOrderReceipt.payment_method === 'promptpay' ? 'PromptPay' : 'บัตรเครดิต'}</p>
              </div>

              {/* รายการอาหารเครื่องดื่ม */}
              <div className="space-y-2 py-1">
                {lastOrderReceipt.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start text-[11px]">
                    <div className="max-w-[180px]">
                      <div>{item.name} x{item.quantity}</div>
                      {item.details && (
                        <div className="text-[9px] text-slate-400">• {item.details.temp} | หวาน {item.details.sweetness} | ไซส์ {item.details.size}</div>
                      )}
                    </div>
                    <span>฿{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span>ราคารวมทั้งหมด</span>
                  <span>฿{lastOrderReceipt.total}</span>
                </div>
                {lastOrderReceipt.payment_method === 'cash' && (
                  <>
                    <div className="flex justify-between text-slate-500">
                      <span>รับเงินสดมา</span>
                      <span>฿{lastOrderReceipt.received}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-slate-800 text-sm">
                      <span>เงินทอน</span>
                      <span>฿{lastOrderReceipt.change}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex space-x-2">
              <button
                onClick={() => setPaymentSuccess(false)}
                className="flex-1 bg-slate-900 text-amber-400 hover:bg-slate-950 hover:text-amber-300 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                เริ่มขายออเดอร์ถัดไป
              </button>
            </div>
          </div>
        </div>
      )}

      {/* สไตล์การสไลด์เปิด-ปิดลิ้นชักตะกร้าด้านข้าง */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out forwards;
        }
        .backdrop-blur-xs {
          backdrop-filter: blur(2px);
        }
      `}</style>

    </div>
  );
}
