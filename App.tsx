import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Linking from 'expo-linking';

const STREAM_URL = 'https://radiotvstream.com:8040/;';
const CONTACT_EMAIL = 'info@bonytafm.com';

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/roberto.geronimo1/',
  instagram: 'https://www.instagram.com/geronimoshow/',
  youtube: 'https://www.youtube.com/c/geronimoshowofficial',
};

const C = {
  bg: '#0A0F05',
  card: 'rgba(20,35,15,0.9)',
  green: '#2DB543',
  greenDim: 'rgba(45,181,67,0.15)',
  greenBorder: 'rgba(45,181,67,0.25)',
  yellow: '#FFD700',
  red: '#E63946',
  white: '#F0F0F0',
  muted: '#8A9B85',
  dim: '#5A6A55',
  border: '#1E2A1A',
  liveGreen: '#4ADE80',
  liveRed: '#F87171',
};

// Wave bar colors cycling green/yellow/red for a festive radio look
const BAR_COLORS = [
  C.green, C.yellow, C.red, C.green, C.yellow, C.red, C.green, C.yellow, C.red,
];

type Tab = 'home' | 'contact' | 'about';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const glowAnim = useRef(new Animated.Value(0)).current;
  const waves = [
    useRef(new Animated.Value(0.1)).current,
    useRef(new Animated.Value(0.1)).current,
    useRef(new Animated.Value(0.1)).current,
    useRef(new Animated.Value(0.1)).current,
    useRef(new Animated.Value(0.1)).current,
    useRef(new Animated.Value(0.1)).current,
    useRef(new Animated.Value(0.1)).current,
    useRef(new Animated.Value(0.1)).current,
    useRef(new Animated.Value(0.1)).current,
  ];

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  useEffect(() => {
    if (!playing) {
      waves.forEach(w => w.setValue(0.1));
      glowAnim.setValue(0);
      return;
    }

    const timings = [400, 550, 350, 600, 450, 380, 520, 420, 480];
    const ranges: [number, number][] = [
      [0.2, 0.9], [0.15, 0.85], [0.25, 0.95], [0.1, 0.8], [0.3, 0.9],
      [0.2, 0.85], [0.15, 0.9], [0.25, 0.8], [0.2, 0.95],
    ];
    const anims = waves.map((w, i) =>
      Animated.loop(Animated.sequence([
        Animated.timing(w, { toValue: ranges[i][1], duration: timings[i], easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(w, { toValue: ranges[i][0], duration: timings[i] * 0.8, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]))
    );
    anims.forEach(a => a.start());

    const glow = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    glow.start();

    return () => { anims.forEach(a => a.stop()); glow.stop(); };
  }, [playing]);

  const togglePlay = useCallback(async () => {
    if (loading) return;
    if (playing && soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setPlaying(false);
      return;
    }
    setLoading(true);
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: STREAM_URL }, { shouldPlay: true });
      soundRef.current = sound;
      setPlaying(true);
    } catch {
      Alert.alert('Error', 'No se pudo conectar con la radio. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [playing, loading]);

  const openLink = (url: string) => Linking.openURL(url);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ImageBackground source={require('./assets/background.png')} style={s.bg} resizeMode="cover">
        <View style={s.overlay} />
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <Text style={s.headerTitle}>BONYTA FM</Text>
            <Text style={s.headerSub}>CREANDO Y RECORDANDO EXITOS!</Text>
          </View>

          <View style={s.content}>
            {tab === 'home' && (
              <ScrollView style={s.scroll} contentContainerStyle={s.scrollPad} showsVerticalScrollIndicator={false}>
                <Text style={s.tagline}>Creando y Recordando Exitos!</Text>
                <Text style={s.taglineDesc}>Tu estacion de radio favorita</Text>

                {/* Player */}
                <View style={s.playerWrap}>
                  {playing && <Animated.View style={[s.playerGlow, { opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }) }]} />}
                  <View style={s.player}>
                    <View style={s.badge}>
                      <View style={[s.dot, playing && s.dotOn]} />
                      <Text style={[s.badgeText, playing && s.badgeTextOn]}>{playing ? 'EN VIVO' : 'OFFLINE'}</Text>
                    </View>

                    <View style={s.waveRow}>
                      {waves.map((w, i) => (
                        <Animated.View key={i} style={[s.bar, {
                          backgroundColor: BAR_COLORS[i],
                          height: w.interpolate({ inputRange: [0, 1], outputRange: [4, 28] }),
                          opacity: playing ? 1 : 0.3,
                        }]} />
                      ))}
                    </View>

                    <Text style={s.stationName}>BONYTA FM</Text>
                    <Text style={s.stationSub}>Radio en Vivo</Text>

                    <TouchableOpacity style={[s.playBtn, playing && s.playBtnStop]} onPress={togglePlay} activeOpacity={0.8} disabled={loading}>
                      {loading ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={s.playIcon}>{playing ? '■' : '▶'}</Text>}
                    </TouchableOpacity>
                    <Text style={s.playLabel}>{loading ? 'Conectando...' : playing ? 'Detener' : 'Escuchar Ahora'}</Text>
                  </View>
                </View>

                {/* Social */}
                <Text style={s.secTitle}>Siguenos</Text>
                <View style={s.socialRow}>
                  {[
                    { key: 'facebook', bg: '#1877F2', label: 'Facebook', icon: 'f' },
                    { key: 'instagram', bg: '#E4405F', label: 'Instagram', icon: 'IG' },
                    { key: 'youtube', bg: '#FF0000', label: 'YouTube', icon: 'YT' },
                  ].map(item => (
                    <TouchableOpacity key={item.key} style={s.socialBtn} onPress={() => openLink(SOCIAL_LINKS[item.key as keyof typeof SOCIAL_LINKS])} activeOpacity={0.7}>
                      <View style={[s.socialIcon, { backgroundColor: item.bg }]}>
                        <Text style={s.socialIconText}>{item.icon}</Text>
                      </View>
                      <Text style={s.socialLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Programacion Card (replaces Mensaje del Dia) */}
                <View style={s.progCard}>
                  <Text style={s.progIcon}>🎵</Text>
                  <Text style={s.progTitle}>Programacion</Text>
                  <View style={s.progDivider} />
                  <View style={s.progRow}>
                    <Text style={s.progDay}>Lunes a Viernes</Text>
                    <Text style={s.progTime}>6AM - 10PM</Text>
                  </View>
                  <View style={s.progRow}>
                    <Text style={s.progDay}>Sabados y Domingos</Text>
                    <Text style={s.progTime}>8AM - 12AM</Text>
                  </View>
                  <View style={s.progDivider} />
                  <Text style={s.progFooter}>La mejor musica, las 24 horas</Text>
                </View>
                <View style={{ height: 24 }} />
              </ScrollView>
            )}

            {tab === 'contact' && <ContactScreen />}
            {tab === 'about' && <AboutScreen openLink={openLink} />}
          </View>

          <View style={s.nav}>
            {([['home', '📻', 'Radio'], ['contact', '✉', 'Contacto'], ['about', 'ℹ', 'Info']] as [Tab, string, string][]).map(([k, ico, lbl]) => (
              <TouchableOpacity key={k} style={s.navItem} onPress={() => setTab(k)} activeOpacity={0.7}>
                <Text style={s.navIcon}>{ico}</Text>
                <Text style={[s.navLabel, tab === k && s.navLabelOn]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </ImageBackground>
    </SafeAreaProvider>
  );
}

function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const send = async () => {
    if (!name.trim() || !message.trim()) {
      Alert.alert('Campos requeridos', 'Por favor, ingresa tu nombre y mensaje.');
      return;
    }
    Keyboard.dismiss();
    const body = `Nombre: ${name}\nCorreo: ${email}\n\n${message}`;
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject || 'Contacto desde la App')}&body=${encodeURIComponent(body)}`;
    try {
      await Linking.openURL(mailto);
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch {
      Alert.alert('Error', 'No se pudo abrir el cliente de correo.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.secTitle}>Contactanos</Text>
        <Text style={s.contactDesc}>Envianos un mensaje. Nos encantaria saber de ti.</Text>
        <View style={s.formCard}>
          {[
            { label: 'Nombre', val: name, set: setName, ph: 'Tu nombre' },
            { label: 'Correo', val: email, set: setEmail, ph: 'tu@correo.com', kb: 'email-address' as const },
            { label: 'Titulo', val: subject, set: setSubject, ph: 'Asunto del mensaje' },
          ].map(f => (
            <View key={f.label} style={s.inputGroup}>
              <Text style={s.inputLabel}>{f.label}</Text>
              <TextInput style={s.input} value={f.val} onChangeText={f.set} placeholder={f.ph} placeholderTextColor={C.dim} keyboardType={f.kb} autoCapitalize={f.kb ? 'none' : 'sentences'} />
            </View>
          ))}
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Mensaje</Text>
            <TextInput style={[s.input, s.inputMulti]} value={message} onChangeText={setMessage} placeholder="Escribe tu mensaje aqui..." placeholderTextColor={C.dim} multiline numberOfLines={5} textAlignVertical="top" />
          </View>
          <TouchableOpacity style={s.submitBtn} onPress={send} activeOpacity={0.8}>
            <Text style={s.submitText}>Enviar Mensaje</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AboutScreen({ openLink }: { openLink: (url: string) => void }) {
  const links = [
    { icon: 'f', bg: '#1877F2', title: 'Facebook', url: SOCIAL_LINKS.facebook, sub: 'facebook.com/roberto.geronimo1' },
    { icon: 'IG', bg: '#E4405F', title: 'Instagram', url: SOCIAL_LINKS.instagram, sub: 'instagram.com/geronimoshow' },
    { icon: 'YT', bg: '#FF0000', title: 'YouTube', url: SOCIAL_LINKS.youtube, sub: 'youtube.com/geronimoshowofficial' },
  ];
  const contacts = [
    { icon: '@', bg: C.green, title: 'Email', url: `mailto:${CONTACT_EMAIL}`, sub: CONTACT_EMAIL },
    { icon: 'W', bg: '#326BFF', title: 'Sitio Web', url: 'https://bonytafm.com', sub: 'bonytafm.com' },
  ];

  const LinkRow = ({ items }: { items: typeof links }) => (
    <>
      {items.map((l, i) => (
        <TouchableOpacity key={i} style={s.aboutLink} onPress={() => openLink(l.url)} activeOpacity={0.7}>
          <View style={[s.aboutLinkIcon, { backgroundColor: l.bg }]}>
            <Text style={s.aboutLinkIconText}>{l.icon}</Text>
          </View>
          <View style={s.aboutLinkInfo}>
            <Text style={s.aboutLinkTitle}>{l.title}</Text>
            <Text style={s.aboutLinkSub}>{l.sub}</Text>
          </View>
          <Text style={s.aboutArrow}>→</Text>
        </TouchableOpacity>
      ))}
    </>
  );

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollPad} showsVerticalScrollIndicator={false}>
      <Text style={s.secTitle}>Sobre Nosotros</Text>
      <View style={s.aboutCard}>
        <Text style={s.aboutTitle}>BONYTA FM</Text>
        <Text style={s.aboutSub}>CREANDO Y RECORDANDO EXITOS!</Text>
        <View style={s.divider} />
        <Text style={s.aboutText}>BONYTA FM es tu estacion de radio favorita, dedicada a traerte la mejor musica para crear nuevos recuerdos y revivir los mejores momentos. Transmitimos los exitos de ayer, hoy y siempre.</Text>
        <Text style={s.aboutText}>Sintonizanos desde cualquier lugar del mundo y disfruta de la mejor programacion musical con los mejores locutores y DJs.</Text>
      </View>
      <View style={s.aboutCard}>
        <Text style={s.aboutCardTitle}>Nuestras Redes</Text>
        <LinkRow items={links} />
      </View>
      <View style={s.aboutCard}>
        <Text style={s.aboutCardTitle}>Contacto</Text>
        <LinkRow items={contacts} />
      </View>
      <Text style={s.footer}>© 2026 BONYTA FM{'\n'}Todos los derechos reservados</Text>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,15,5,0.88)' },
  safe: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.greenDim },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.green, letterSpacing: 1 },
  headerSub: { fontSize: 10, color: C.muted, letterSpacing: 2.5, marginTop: 2 },
  content: { flex: 1 },
  scroll: { flex: 1 },
  scrollPad: { paddingHorizontal: 20, paddingTop: 20 },

  tagline: { fontSize: 28, fontWeight: '700', color: C.white, textAlign: 'center', letterSpacing: 0.5 },
  taglineDesc: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 6, marginBottom: 24, fontStyle: 'italic' },

  playerWrap: { borderRadius: 20, overflow: 'hidden', marginBottom: 28, position: 'relative' },
  playerGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 20, borderWidth: 2, borderColor: C.green, shadowColor: C.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10 },
  player: { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.greenBorder, padding: 28, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.greenDim, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.dim, marginRight: 6 },
  dotOn: { backgroundColor: C.liveGreen },
  badgeText: { fontSize: 11, fontWeight: '800', color: C.dim, letterSpacing: 2 },
  badgeTextOn: { color: C.liveGreen },

  waveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 36, marginBottom: 20 },
  bar: { width: 5, borderRadius: 3, backgroundColor: C.green, marginHorizontal: 2 },

  stationName: { fontSize: 20, fontWeight: '800', color: C.green, letterSpacing: 2, textAlign: 'center' },
  stationSub: { fontSize: 13, color: C.muted, marginTop: 4, marginBottom: 22 },
  playBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', shadowColor: C.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  playBtnStop: { backgroundColor: C.red },
  playIcon: { fontSize: 24, color: C.bg, fontWeight: '900' },
  playLabel: { fontSize: 13, color: C.muted, marginTop: 10, fontWeight: '600' },

  secTitle: { fontSize: 20, fontWeight: '700', color: C.green, marginBottom: 16, letterSpacing: 0.5 },

  socialRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 28 },
  socialBtn: { alignItems: 'center', marginHorizontal: 10 },
  socialIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  socialIconText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  socialLabel: { fontSize: 12, color: C.muted, fontWeight: '600', marginTop: 8 },

  progCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.greenBorder, padding: 24, alignItems: 'center' },
  progIcon: { fontSize: 28, marginBottom: 10 },
  progTitle: { fontSize: 16, fontWeight: '700', color: C.yellow, marginBottom: 12, letterSpacing: 1 },
  progDivider: { height: 1, backgroundColor: C.greenBorder, width: '80%', marginVertical: 12 },
  progRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 12, marginVertical: 4 },
  progDay: { fontSize: 14, color: C.white, fontWeight: '600' },
  progTime: { fontSize: 14, color: C.yellow, fontWeight: '700' },
  progFooter: { fontSize: 13, color: C.muted, fontStyle: 'italic', marginTop: 4 },

  nav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.greenDim, backgroundColor: 'rgba(10,15,5,0.95)', paddingBottom: 4 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 11, color: C.dim, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  navLabelOn: { color: C.green },

  contactDesc: { fontSize: 14, color: C.muted, marginBottom: 20, marginTop: -8 },
  formCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.muted, marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.greenBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: C.white },
  inputMulti: { minHeight: 120, paddingTop: 14 },
  submitBtn: { backgroundColor: C.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4, shadowColor: C.green, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitText: { fontSize: 16, fontWeight: '700', color: C.bg, letterSpacing: 0.5 },

  aboutCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 22, marginBottom: 16 },
  aboutTitle: { fontSize: 22, fontWeight: '800', color: C.green, textAlign: 'center', letterSpacing: 1 },
  aboutSub: { fontSize: 11, color: C.yellow, textAlign: 'center', marginTop: 4, letterSpacing: 2.5 },
  divider: { height: 1, backgroundColor: C.greenBorder, marginVertical: 18 },
  aboutText: { fontSize: 14, color: C.white, lineHeight: 22, marginBottom: 12 },
  aboutCardTitle: { fontSize: 16, fontWeight: '700', color: C.green, marginBottom: 16, letterSpacing: 0.5 },
  aboutLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  aboutLinkIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  aboutLinkIconText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  aboutLinkInfo: { flex: 1, marginLeft: 14 },
  aboutLinkTitle: { fontSize: 15, fontWeight: '600', color: C.white },
  aboutLinkSub: { fontSize: 12, color: C.dim, marginTop: 1 },
  aboutArrow: { fontSize: 18, color: C.dim },
  footer: { fontSize: 12, color: C.dim, textAlign: 'center', marginTop: 8, lineHeight: 18 },
});
