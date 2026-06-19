import React, { useState } from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import { Card } from "./card";

export function LoanCalculator({ defaultAmount = 500, maxAmount = 5000 }) {
  const [amount, setAmount] = useState(defaultAmount);
  const [term, setTerm] = useState(3);
  const interestRate = 15;

  const interest = amount * (interestRate / 100) * term;
  const total = amount + interest;
  const monthly = total / term;

  const CustomSlider = ({ value, onValueChange, min, max, step }: any) => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onValueChange(Number(e.target.value))}
          style={{ width: '100%', height: '8px', accentColor: '#10B981', cursor: 'pointer', marginTop: 12, marginBottom: 12 }}
        />
      );
    }
    return null; // Add Native Slider if needed
  };

  return (
    <Card style={{ backgroundColor: '#0f1714', borderWeight: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <View style={{ height: 24, width: 24, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
          <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 10 }}>%</Text>
        </View>
        <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>Loan Estimator</Text>
      </View>

      <View>
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
            <Text style={{ color: 'rgba(252,252,252,0.4)', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2 }}>Requested Amount</Text>
            <Text style={{ fontFamily: 'Display-Bold', color: '#10b981', fontSize: 24 }}>GH₵ {Math.round(amount).toLocaleString()}</Text>
          </View>
          <CustomSlider min={100} max={maxAmount} step={50} value={amount} onValueChange={setAmount} />
        </View>

        <View style={{ marginBottom: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
            <Text style={{ color: 'rgba(252,252,252,0.4)', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2 }}>Repayment Term</Text>
            <Text style={{ fontFamily: 'Display-Bold', color: '#f59e0b', fontSize: 24 }}>{Math.round(term)} Months</Text>
          </View>
          <CustomSlider min={1} max={12} step={1} value={term} onValueChange={setTerm} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', marginBottom: 32 }}>
          <View>
            <Text style={{ color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 8, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 4 }}>Total Interest</Text>
            <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 14 }}>GH₵ {Math.round(interest).toLocaleString()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 8, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 4 }}>Total Payable</Text>
            <Text style={{ fontFamily: 'Display-Bold', color: '#f59e0b', fontSize: 14 }}>GH₵ {Math.round(total).toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: 'rgba(16,185,129,0.05)', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.1)' }}>
          <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 8 }}>Estimated Monthly</Text>
          <Text style={{ fontFamily: 'Display-Bold', color: '#10b981', fontSize: 32, letterSpacing: -1 }}>GH₵ {Math.round(monthly).toLocaleString()}</Text>
        </View>
      </View>
    </Card>
  );
}
