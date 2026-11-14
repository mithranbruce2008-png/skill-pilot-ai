import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CoreLearnerSphereProps {
  coreColor: string;
  fresnelColor: string;
  dangerColor: string;
  emailFocused: boolean;
  passwordFocused: boolean;
  invalidTrigger: number;
  reducedMotion: boolean;
}

const VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uBaseColor;
  uniform vec3 uFresnelColor;
  uniform vec3 uDangerColor;
  uniform float uBrighten;
  uniform float uDangerMix;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPos;

  void main() {
    vec3 viewDir = normalize(vViewPos);
    float ndotv = clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - ndotv, 2.4);
    float pulse = 0.92 + 0.08 * sin(uTime * 1.8);
    vec3 base = mix(uBaseColor, uFresnelColor, 0.25 + uBrighten * 0.25);
    vec3 rim = mix(uFresnelColor, uDangerColor, uDangerMix);
    vec3 finalColor = mix(base, rim * (1.2 + uBrighten * 0.4), fresnel) * pulse;
    gl_FragColor = vec4(finalColor, 0.96);
  }
`;

/**
 * Glowing learner core sphere with custom Fresnel-rim shader, password shield-ring, and invalid-login ripple.
 */
export function CoreLearnerSphere({
  coreColor,
  fresnelColor,
  dangerColor,
  emailFocused,
  passwordFocused,
  invalidTrigger,
  reducedMotion,
}: CoreLearnerSphereProps) {
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const shieldGroupRef = useRef<THREE.Group>(null);
  const rippleMeshRef = useRef<THREE.Mesh>(null);
  const rippleProgressRef = useRef<number>(1);
  const lastTriggerRef = useRef<number>(invalidTrigger);

  const shaderMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uBaseColor: { value: new THREE.Color(coreColor) },
          uFresnelColor: { value: new THREE.Color(fresnelColor) },
          uDangerColor: { value: new THREE.Color(dangerColor) },
          uBrighten: { value: 0 },
          uDangerMix: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
      }),
    [],
  );

  useEffect(() => {
    shaderMat.uniforms.uBaseColor.value.set(coreColor);
    shaderMat.uniforms.uFresnelColor.value.set(fresnelColor);
    shaderMat.uniforms.uDangerColor.value.set(dangerColor);
  }, [coreColor, fresnelColor, dangerColor, shaderMat]);

  useEffect(() => {
    if (invalidTrigger !== lastTriggerRef.current) {
      lastTriggerRef.current = invalidTrigger;
      rippleProgressRef.current = 0;
    }
  }, [invalidTrigger]);

  useEffect(() => {
    return () => {
      shaderMat.dispose();
    };
  }, [shaderMat]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    if (!reducedMotion) {
      shaderMat.uniforms.uTime.value = state.clock.elapsedTime;
    }

    const targetBright = emailFocused ? 1.0 : 0.0;
    shaderMat.uniforms.uBrighten.value = THREE.MathUtils.damp(
      shaderMat.uniforms.uBrighten.value,
      targetBright,
      6,
      dt,
    );

    if (rippleProgressRef.current < 1) {
      rippleProgressRef.current = Math.min(1, rippleProgressRef.current + (reducedMotion ? 1 : dt * 1.4));
    }
    const dangerActive = rippleProgressRef.current < 1 ? 1 - rippleProgressRef.current : 0;
    shaderMat.uniforms.uDangerMix.value = dangerActive;

    if (rippleMeshRef.current) {
      const p = rippleProgressRef.current;
      rippleMeshRef.current.visible = p < 1 && !reducedMotion;
      const scale = 1.1 + p * 3.8;
      rippleMeshRef.current.scale.setScalar(scale);
      const mat = rippleMeshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - p) * 0.85;
    }

    if (shieldGroupRef.current) {
      const targetScale = passwordFocused ? 1 : 0.001;
      const s = reducedMotion
        ? targetScale
        : THREE.MathUtils.damp(shieldGroupRef.current.scale.x, targetScale, 8, dt);
      shieldGroupRef.current.scale.setScalar(Math.max(0.001, s));
      shieldGroupRef.current.visible = s > 0.02;
      if (!reducedMotion && passwordFocused) {
        shieldGroupRef.current.rotation.z += dt * 0.65;
        shieldGroupRef.current.rotation.y -= dt * 0.4;
      }
    }

    if (coreMeshRef.current && !reducedMotion) {
      coreMeshRef.current.rotation.y += dt * 0.12;
    }
  });

  return (
    <group>
      <mesh ref={coreMeshRef} material={shaderMat}>
        <sphereGeometry args={[0.92, 32, 32]} />
      </mesh>

      <group ref={shieldGroupRef} visible={passwordFocused}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.28, 0.04, 12, 48]} />
          <meshStandardMaterial
            color={fresnelColor}
            emissive={fresnelColor}
            emissiveIntensity={1.1}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        <mesh rotation={[0.45, 0.6, 0]}>
          <torusGeometry args={[1.42, 0.025, 10, 6]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={0.85}
            roughness={0.25}
            metalness={0.85}
          />
        </mesh>
      </group>

      <mesh ref={rippleMeshRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.95, 1.15, 48]} />
        <meshBasicMaterial color={dangerColor} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
