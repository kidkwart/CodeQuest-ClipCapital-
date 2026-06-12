import React, { useState } from "react";
import { View, Text, Platform } from "react-native";
import { Card } from "./card";
import Slider from "@react-native-community/slider";

export function LoanCalculator({ defaultAmount = 500, maxAmount = 5000 }) {
  const [amount, setAmount] = useState(defaultAmount);
  const [term, setTerm] = useState(3);
  const interestRate = 15; // 15% monthly interest

  const interest = amount * (interestRate / 100) * term;
  const total = amount + interest;
  const monthly = total / term;

  // Custom Web Slider to prevent React 19 findDOMNode crash
  const CustomSlider = ({ value, onValueChange, min, max, step }: any) => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onValueChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: '10px',
            accentColor: '#10B981',
            cursor: 'pointer',
            marginTop: '10px',
            marginBottom: '10px'
          }}
        />
      );
    }
    return (
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#10B981"
        maximumTrackTintColor="#404040"
        thumbTintColor="#10B981"
      />
    );
  };

  return (
    <Card className="bg-surface border-white/5 shadow-2xl">
      <View className="flex-row items-center gap-2 mb-6">
        <View className="h-6 w-6 rounded-full bg-primary/20 items-center justify-center border border-primary/30">
          <Text className="text-[10px] text-primary font-black">%</Text>
        </View>
        <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-sm uppercase tracking-widest">Loan Estimator</Text>
      </View>

      <View className="space-y-8">
        <View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Requested Amount</Text>
            <Text style={{ fontFamily: 'Display-Bold' }} className="text-lg text-primary">GH₵ {Math.round(amount).toLocaleString()}</Text>
          </View>
          <CustomSlider
            min={100}
            max={maxAmount}
            step={50}
            value={amount}
            onValueChange={setAmount}
          />
        </View>

        <View className="mt-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Repayment Term</Text>
            <Text style={{ fontFamily: 'Display-Bold' }} className="text-lg text-gold">{Math.round(term)} Months</Text>
          </View>
          <CustomSlider
            min={1}
            max={12}
            step={1}
            value={term}
            onValueChange={setTerm}
          />
        </View>

        <View className="flex-row justify-between pt-6 border-t border-white/5 mt-4">
          <View>
            <Text className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Total Interest</Text>
            <Text style={{ fontFamily: 'Display-Bold' }} className="text-sm text-white">GH₵ {Math.round(interest).toLocaleString()}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Total Payable</Text>
            <Text style={{ fontFamily: 'Display-Bold' }} className="text-sm text-gold">GH₵ {Math.round(total).toLocaleString()}</Text>
          </View>
        </View>

        <View className="bg-primary/10 border border-primary/20 p-5 rounded-[24px] items-center mt-6 overflow-hidden">
          <View className="absolute top-[-20] right-[-20] w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
          <Text className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-2">Estimated Monthly</Text>
          <Text style={{ fontFamily: 'Display-Bold' }} className="text-3xl text-primary tracking-tighter">GH₵ {Math.round(monthly).toLocaleString()}</Text>
        </View>
      </View>
    </Card>
  );
}
