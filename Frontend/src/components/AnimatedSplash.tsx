import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
} from "react-native";

interface AnimatedSplashProps {
  onFinish?: () => void;
}

const WORD = "Emprendo";
const LETTERS = WORD.split("");

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onFinish }) => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Animaciones individuales para cada letra: opacidad y desplazamiento vertical
  const letterAnims = useRef(
    LETTERS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(12),
    }))
  ).current;

  // Animación de latido para toda la palabra
  const heartbeatAnim = useRef(new Animated.Value(1)).current;

  // Animaciones para la línea inferior: escala horizontal (desde el centro) y opacidad
  const lineWidthAnim = useRef(new Animated.Value(0)).current;
  const lineOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    let reduceMotionTimeout: ReturnType<typeof setTimeout>;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!isMounted) return;

        if (enabled) {
          setIsReducedMotion(true);
          // Modo accesibilidad: muestra texto estático y finaliza tras ~800ms
          reduceMotionTimeout = setTimeout(() => {
            if (isMounted) {
              onFinish?.();
            }
          }, 800);
        } else {
          startEntranceAnimation();
        }
      })
      .catch(() => {
        if (isMounted) {
          startEntranceAnimation();
        }
      });

    const startEntranceAnimation = () => {
      // 1. Animación escalonada de las letras (fade-in + translateY hacia arriba)
      const letterAnimations = letterAnims.map((anim, index) =>
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 380,
            delay: index * 70,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 380,
            delay: index * 70,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      );

      // 2. Expansión de la línea morada inferior desde el centro hacia los lados
      const lineAnimations = Animated.parallel([
        Animated.timing(lineOpacityAnim, {
          toValue: 1,
          duration: 300,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(lineWidthAnim, {
          toValue: 1,
          duration: 750,
          delay: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      // 3. Efecto latido (heartbeat) tras aparecer todas las letras (~1000ms de inicio)
      // Escala suave de 1 -> 1.04 -> 1 y breve pausa final para completar ~1.9s en total
      const heartbeatAnimation = Animated.sequence([
        Animated.delay(1020),
        Animated.timing(heartbeatAnim, {
          toValue: 1.04,
          duration: 200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1.0,
          duration: 220,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(360),
      ]);

      // Ejecutar en paralelo todas las secuencias
      Animated.parallel([
        Animated.parallel(letterAnimations),
        lineAnimations,
        heartbeatAnimation,
      ]).start(({ finished }) => {
        if (finished && isMounted) {
          onFinish?.();
        }
      });
    };

    return () => {
      isMounted = false;
      if (reduceMotionTimeout) {
        clearTimeout(reduceMotionTimeout);
      }
    };
  }, [onFinish]);

  if (isReducedMotion) {
    return (
      <View
        style={styles.container}
        accessible={true}
        accessibilityLabel="Emprendo"
        accessibilityRole="header"
      >
        <View style={styles.wordRow}>
          {LETTERS.map((letter, index) => (
            <Animated.Text key={index} style={styles.letter}>
              {letter}
            </Animated.Text>
          ))}
        </View>
        <View style={[styles.underline, styles.underlineStatic]} />
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel="Emprendo"
      accessibilityRole="header"
    >
      <Animated.View
        style={[
          styles.wordRow,
          {
            transform: [{ scale: heartbeatAnim }],
          },
        ]}
      >
        {LETTERS.map((letter, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.letter,
              {
                opacity: letterAnims[index].opacity,
                transform: [{ translateY: letterAnims[index].translateY }],
              },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
      </Animated.View>

      <Animated.View
        style={[
          styles.underline,
          {
            opacity: lineOpacityAnim,
            transform: [{ scaleX: lineWidthAnim }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#6D28D9",
    letterSpacing: 2,
  },
  underline: {
    height: 2,
    width: 60,
    backgroundColor: "#6D28D9",
    borderRadius: 999,
    marginTop: 14,
  },
  underlineStatic: {
    opacity: 1,
  },
});
