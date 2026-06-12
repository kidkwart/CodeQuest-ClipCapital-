import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, StyleSheet, TextInput, Platform, Vibration } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useProducts } from '@/lib/app-queries';
import { useCart } from '@/lib/cart';
import { Button } from '@/components/native/button';
import { Card } from '@/components/native/card';
import { ArrowLeft, ShoppingCart, ShieldCheck, Sparkles, Plus, Minus, ClipboardList } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function ProductDetails() {
  const { productId } = useLocalSearchParams();
  const router = useRouter();
  const { data: dbProducts } = useProducts();
  const cart = useCart();

  const [qty, setQty] = useState("1");
  const [isAdded, setIsAdded] = useState(false);

  // Fallback products from the main marketplace file
  const FALLBACK_PRODUCTS = [
    {
      id: "38947f6a-4933-4f9e-9d2a-4a2a1a8c9b0e",
      name: "Wahl Professional Cordless Magic Clip",
      price: 2450,
      image_url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=800",
      description: "The 'Gold Standard' for Ghanaian master barbers. Features the iconic stagger-tooth blade for the ultimate seamless fade."
    },
    {
      id: "982b6e12-32b4-4b5a-9e12-c2e3f4a5b6c7",
      name: "BaBylissPRO GoldFX Skeleton Trimmer",
      price: 3200,
      image_url: "https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?auto=format&fit=crop&q=80&w=800",
      description: "The world's most desired hitter. 360-degree exposed T-blade for surgical precision lineups."
    },
    {
      id: "716a5b4c-d3e2-4f1a-b0c9-d8e7f6a5b4c3",
      name: "Luxury Gold Vintage Hydraulic Barber Chair",
      price: 7800,
      image_url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800",
      description: "Industrial-grade heavy-duty hydraulic pump. Hand-stitched premium leather with 24k gold-plated accents."
    },
    {
      id: "a1b2c3d4-e5f6-4a5b-9c8d-7e6f5a4b3c2d",
      name: "Dyson Supersonic™ Pro Stylist Edition",
      price: 4500,
      image_url: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&q=80&w=800",
      description: "Intelligent heat control to protect natural shine. Fastest drying for high-volume salons."
    },
    {
      id: "f1e2d3c4-b5a6-4f5e-9d8c-7b6a5e4d3c2b",
      name: "Wahl Professional Cordless Senior",
      price: 2600,
      image_url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=800",
      description: "The most powerful motor in the Wahl range. Metal bottom housing for durability and high-torque performance."
    },
    {
      id: "e1d2c3b4-a5f6-4e5d-9c8b-7a6f5e4d3c2b",
      name: "Andis Master Cordless Gold Edition",
      price: 4200,
      image_url: "https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?auto=format&fit=crop&q=80&w=800",
      description: "The legendary Master motor now in a high-speed cordless body. Unbreakable aluminum housing."
    }
  ];

  const allProducts = [...(dbProducts || []), ...FALLBACK_PRODUCTS];
  const product = allProducts.find(p => p.id === productId);

  if (!product) return null;

  const handleAddToCart = () => {
    const numericQty = parseInt(qty) || 1;
    cart.add({
      product_id: product.id,
      vendor_id: product.vendor_id,
      name: product.name,
      price: product.price,
      qty: numericQty
    });

    setIsAdded(true);
    Vibration.vibrate(Platform.OS === 'ios' ? 0 : 10);
    setTimeout(() => setIsAdded(false), 3000);
  };

  const increment = () => setQty(prev => {
    const n = (parseInt(prev) || 0) + 1;
    return n.toString();
  });
  const decrement = () => setQty(prev => {
    const n = Math.max(1, (parseInt(prev) || 1) - 1);
    return n.toString();
  });

  const totalItems = cart.items.reduce((s, i) => s + i.qty, 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 12, marginRight: 16 }}>
            <TouchableOpacity onPress={() => router.push("/market/orders")} style={styles.headerBtn}>
              <ClipboardList size={20} color="#10b981" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/market/cart")} style={styles.headerBtn}>
              <View>
                 <ShoppingCart size={20} color="#FFF" />
                 {totalItems > 0 && (
                   <View style={styles.badge}>
                     <Text style={styles.badgeTextCount}>{totalItems}</Text>
                   </View>
                 )}
              </View>
            </TouchableOpacity>
          </View>
        )
      }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={{ width: width, height: width }}>
          <Image
            source={{ uri: product.image_url || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80" }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', '#080c0a']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }}
          />
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: -20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <View style={styles.choiceBadge}>
                  <Sparkles size={10} color="#f59e0b" />
                  <Text style={styles.choiceBadgeText}>Premium Choice</Text>
                </View>
              </View>
              <Text style={styles.title}>{product.name}</Text>
            </View>
            <Text style={styles.price}>GH₵ {product.price.toLocaleString()}</Text>
          </View>

          <View style={styles.divider} />

          {/* Quantity Input */}
          <View style={{ marginBottom: 32 }}>
            <Text style={styles.sectionLabel}>Purchase Quantity</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
               <View style={styles.qtyContainer}>
                  <TouchableOpacity onPress={decrement} style={styles.qtyBtn}>
                     <Minus size={20} color={parseInt(qty) > 1 ? "#10b981" : "#405045"} />
                  </TouchableOpacity>
                  <TextInput
                    value={qty}
                    onChangeText={(val) => setQty(val.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    style={styles.qtyInput}
                    selectTextOnFocus
                  />
                  <TouchableOpacity onPress={increment} style={styles.qtyBtn}>
                     <Plus size={20} color="#10b981" />
                  </TouchableOpacity>
               </View>
               <Text style={{ color: '#7d8a84', fontSize: 12, fontWeight: 'bold' }}>Total: GH₵ {(product.price * (parseInt(qty) || 0)).toLocaleString()}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Authenticity Check</Text>
          <Card style={{ marginBottom: 32, padding: 24, backgroundColor: '#0f1714' }}>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <ShieldCheck size={24} color="#10b981" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontFamily: 'Display-Bold', fontSize: 15, marginBottom: 4 }}>Verified Genuine</Text>
                <Text style={{ color: '#b2baac', fontSize: 12, lineHeight: 20 }}>
                  Sourced from certified manufacturers. Full 12-month warranty included with every purchase.
                </Text>
              </View>
            </View>
          </Card>

          <Text style={styles.sectionLabel}>Overview</Text>
          <Text style={styles.description}>
            {product.description || "This professional-grade tool is the standard for high-performance grooming. Engineered for precision and built to last in a high-traffic shop environment."}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {Platform.OS !== 'web' && <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />}
        <View style={{ paddingHorizontal: 24, paddingVertical: 24, backgroundColor: Platform.OS === 'web' ? 'rgba(8, 12, 10, 0.9)' : 'transparent' }}>
          <Button
            title={isAdded ? "Added to Cart ✓" : "Confirm Order"}
            variant={isAdded ? "outline" : "default"}
            size="lg"
            onPress={handleAddToCart}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    height: 48,
    width: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 20, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#10b981',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#080c0a'
  },
  badgeTextCount: {
    color: 'black',
    fontSize: 8,
    fontWeight: 'bold'
  },
  title: {
    fontFamily: 'Display-Bold',
    color: 'white',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1
  },
  price: {
    fontFamily: 'Display-Bold',
    color: '#10b981',
    fontSize: 26,
    marginLeft: 16
  },
  choiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)'
  },
  choiceBadgeText: {
    color: '#f59e0b',
    fontWeight: '900',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  sectionLabel: {
    color: 'rgba(252,252,252,0.3)',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 16,
    marginLeft: 4
  },
  description: {
    color: '#b2baac',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 40
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 32
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 6
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#0f1714',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qtyInput: {
    fontFamily: 'Display-Bold',
    color: 'white',
    fontSize: 20,
    minWidth: 60,
    textAlign: 'center',
    padding: 0
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    zIndex: 10
  }
});
