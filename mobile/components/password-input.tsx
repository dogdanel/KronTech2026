import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

const muted = '#5b667a';
const text = '#0b1220';
const line = '#e7e9ef';
const bg = '#f6f7fb';

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoComplete?: 'password' | 'new-password' | 'password-new';
};

export default function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Parolă',
  autoComplete = 'password',
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoComplete={autoComplete}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        style={styles.eyeBtn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ascunde parola' : 'Arată parola'}>
        <Image
          source={require('../assets/icons/lane.png')}
          style={[styles.eyeIcon, { tintColor: visible ? '#f97316' : '#22c55e' }]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: line,
    borderRadius: 10,
    backgroundColor: bg,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: text,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: { width: 24, height: 24, resizeMode: 'contain' },
});
