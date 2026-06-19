import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, StyleSheet, TextInput, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useProducts } from '@/lib/app-queries';
import { useCart } from '@/lib/cart';
import { Button } from '@/components/native/button';
import { Card } from '@/components/native/card';
import { ArrowLeft, ShoppingCart, ShieldCheck, Sparkles, Plus, Minus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function ProductDetails() {
  const { productId } = useLocalSearchParams();
  const router = useRouter();
  const { data: products } = useProducts();
  const cart = useCart();

  const [qty, setQty] = useState("1");
  const [isAdded, setIsAdded] = useState(false);

  const product = products?.find(p => p.id === productId);

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
    setTimeout(() => setIsAdded(false), 3000);
  };

  const increment = () => setQty(prev => (parseInt(prev) || 0 + 1).toString());
  const decrement = () => setQty(prev => Math.max(1, (parseInt(prev) || 1) - 1).toString());

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
          <TouchableOpacity onPress={() => router.push("/market/cart")} style={styles.headerBtn}>
            <View>
               <ShoppingCart size={20} color="#FFF" />
               {cart.items.length > 0 && (
                 <View style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#10b981', width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }}>
                   <Text style={{ color: 'black', fontSize: 8, fontWeight: 'bold' }}>{cart.items.length}</Text>
                 </View>
               )}
            </View>
          </TouchableOpacity>
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
                <View style={styles.badge}>
                  <Sparkles size={10} color="#f59e0b" />
                  <Text style={styles.badgeText}>Premium Choice</Text>
                </View>
              </View>
              <Text style={styles.title}>{product.name}</Text>
            </View>
            <Text style={styles.price}>GH₵ {product.price}</Text>
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
          <Card glass style={{ marginBottom: 32, padding: 24 }}>
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
            This professional-grade tool is the standard for high-performance grooming. Engineered for precision and built to last in a high-traffic shop environment.
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
    marginLeft: 16,
    marginRight: 16,
    height: 48,
    width: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 20, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
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
    color: '#f59e0b',
    fontSize: 26,
    marginLeft: 16
  },
  badge: {
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
  badgeText: {
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
    overflow: 'hidden'
  }
});
