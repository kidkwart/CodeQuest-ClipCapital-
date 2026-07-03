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
import { useTheme } from '@/context/theme-context';
import { FALLBACK_PRODUCTS } from './index';

const { width } = Dimensions.get('window');

export default function ProductDetails() {
  const { productId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { data: dbProducts } = useProducts();
  const cart = useCart();

  const [qty, setQty] = useState("1");
  const [isAdded, setIsAdded] = useState(false);

  const allProducts = (dbProducts && dbProducts.length > 0) ? dbProducts : FALLBACK_PRODUCTS;
  const product = allProducts.find(p => p.id === productId);

  if (!product) return null;

  const handleAddToCart = () => {
    const numericQty = parseInt(qty) || 1;
    cart.add({
      product_id: product.id,
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 10, marginRight: 16 }}>
            <TouchableOpacity onPress={() => router.push("/market/orders")} style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <ClipboardList size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/market/cart")} style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View>
                 <ShoppingCart size={18} color={colors.text} />
                 {totalItems > 0 && (
                   <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                     <Text style={styles.badgeTextCount}>{totalItems}</Text>
                   </View>
                 )}
              </View>
            </TouchableOpacity>
          </View>
        )
      }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ width: width, height: width * 0.85 }}>
          <Image
            source={{ uri: product.image_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={theme === 'dark' ? ['transparent', '#080c0a'] : ['transparent', colors.background]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
          />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: -10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={[styles.choiceBadge, { backgroundColor: colors.gold + '15', borderColor: colors.gold + '30' }]}>
                  <Sparkles size={8} color={colors.gold} />
                  <Text style={[styles.choiceBadgeText, { color: colors.gold }]}>Premium Choice</Text>
                </View>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{product.name}</Text>
            </View>
            <Text style={[styles.price, { color: colors.primary }]}>GH₵ {product.price.toLocaleString()}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Quantity Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionLabel, { color: colors.textDim }]}>Purchase Quantity</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
               <View style={[styles.qtyContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <TouchableOpacity onPress={decrement} style={[styles.qtyBtn, { backgroundColor: colors.cardBg }]}>
                     <Minus size={18} color={parseInt(qty) > 1 ? colors.primary : colors.textDim} />
                  </TouchableOpacity>
                  <TextInput
                    value={qty}
                    onChangeText={(val) => setQty(val.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    style={[styles.qtyInput, { color: colors.text }]}
                    selectTextOnFocus
                  />
                  <TouchableOpacity onPress={increment} style={[styles.qtyBtn, { backgroundColor: colors.cardBg }]}>
                     <Plus size={18} color={colors.primary} />
                  </TouchableOpacity>
               </View>
               <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>Total: GH₵ {(product.price * (parseInt(qty) || 0)).toLocaleString()}</Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>Authenticity Check</Text>
          <Card style={{ marginBottom: 24, padding: 16, backgroundColor: colors.cardBg, borderColor: colors.border, borderRadius: 20 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <ShieldCheck size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontFamily: 'Display-Bold', fontSize: 14, marginBottom: 2 }}>Verified Genuine</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, lineHeight: 18 }}>
                  Sourced from certified manufacturers. Full 12-month warranty included.
                </Text>
              </View>
            </View>
          </Card>

          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>Overview</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {product.description}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
        {Platform.OS !== 'web' && <BlurView intensity={80} tint={theme} style={StyleSheet.absoluteFill} />}
        <View style={[styles.bottomBarInner, { backgroundColor: Platform.OS === 'web' ? colors.background : 'transparent' }]}>
          <View style={{ flex: 1 }}>
            <Button
              title={isAdded ? "Added" : "Add"}
              variant="outline"
              size="default"
              onPress={handleAddToCart}
            />
          </View>
          <View style={{ flex: 2 }}>
            <Button
              title="Buy on Credit"
              variant="default"
              size="default"
              onPress={() => {
                handleAddToCart();
                router.push("/market/cart");
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    height: 40,
    width: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeTextCount: {
    color: 'black',
    fontSize: 7,
    fontWeight: 'bold'
  },
  title: {
    fontFamily: 'Display-Bold',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5
  },
  price: {
    fontFamily: 'Display-Bold',
    fontSize: 22,
    marginLeft: 12
  },
  choiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
  choiceBadgeText: {
    fontWeight: '900',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  sectionLabel: {
    fontWeight: '900',
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 40
  },
  divider: {
    height: 1,
    marginVertical: 20
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qtyInput: {
    fontFamily: 'Display-Bold',
    fontSize: 18,
    minWidth: 50,
    textAlign: 'center',
    padding: 0
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    overflow: 'hidden',
    zIndex: 10
  },
  bottomBarInner: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  }
});
