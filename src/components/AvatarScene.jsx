import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMHumanBoneName, VRMUtils } from "@pixiv/three-vrm";
import * as THREE from "three";
import { createVisemeAnimator, applyVisemeToVRM, resetVisemes } from "../utils/visemeUtils";

function setNaturalArmPose(vrm) {
  if (!vrm?.humanoid) {
    return;
  }

  const leftUpperArm = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm);
  const rightUpperArm = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm);
  const leftLowerArm = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm);
  const rightLowerArm = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm);
  const leftHand = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftHand);
  const rightHand = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightHand);

  if (leftUpperArm) {
    leftUpperArm.rotation.z = 1.15;
    leftUpperArm.rotation.x = 0.04;
    leftUpperArm.rotation.y = -0.04;
  }
  if (rightUpperArm) {
    rightUpperArm.rotation.z = -1.15;
    rightUpperArm.rotation.x = 0.04;
    rightUpperArm.rotation.y = 0.04;
  }
  if (leftLowerArm) {
    leftLowerArm.rotation.z = 0.08;
    leftLowerArm.rotation.x = -0.02;
  }
  if (rightLowerArm) {
    rightLowerArm.rotation.z = -0.08;
    rightLowerArm.rotation.x = -0.02;
  }
  if (leftHand) {
    leftHand.rotation.x = -0.02;
  }
  if (rightHand) {
    rightHand.rotation.x = -0.02;
  }
}

function Model({ modelUrl, isSpeaking, speechText, speechStartTime, onInteract }) {
  const [modelState, setModelState] = useState({
    object3D: null,
    scale: 1,
    offset: [0, 0, 0]
  });
  const modelRootRef = useRef();
  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const vrmRef = useRef(null);
  const visemeAnimatorRef = useRef(null);

  useEffect(() => {
    if (!modelUrl) {
      setModelState({ object3D: null, scale: 1, offset: [0, 0, 0] });
      vrmRef.current = null;
      return;
    }

    let active = true;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      modelUrl,
      (gltf) => {
        if (!active) {
          return;
        }

        let loadedObject = gltf.scene;
        const vrm = gltf.userData?.vrm;
        if (vrm) {
          VRMUtils.rotateVRM0(vrm);
          setNaturalArmPose(vrm);
          vrmRef.current = vrm;
          loadedObject = vrm.scene;
        } else {
          vrmRef.current = null;
        }

        loadedObject.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(loadedObject);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const targetHeight = 2.2;
        const normalizedScale = size.y > 0 ? targetHeight / size.y : 1;

        setModelState({
          object3D: loadedObject,
          scale: normalizedScale,
          offset: [-center.x, -box.min.y, -center.z]
        });
      },
      undefined,
      (error) => {
        console.error("Failed to load model:", error);
        setModelState({ object3D: null, scale: 1, offset: [0, 0, 0] });
        vrmRef.current = null;
      }
    );

    return () => {
      active = false;
    };
  }, [modelUrl]);

  // Create/update viseme animator when speech text changes
  useEffect(() => {
    if (isSpeaking && speechText) {
      // Estimate speech duration: ~150ms per word is typical
      const wordCount = speechText.trim().split(/\s+/).length;
      const estimatedDuration = Math.max(wordCount * 0.15, 1.5); // seconds
      visemeAnimatorRef.current = createVisemeAnimator(speechText, estimatedDuration);
    } else {
      visemeAnimatorRef.current = null;
      // Reset visemes when speech ends
      if (vrmRef.current) {
        resetVisemes(vrmRef.current);
      }
    }
  }, [isSpeaking, speechText]);

  useFrame((_, delta) => {
    if (vrmRef.current) {
      vrmRef.current.update(delta);

      // Apply viseme animation if speech is active
      if (isSpeaking && visemeAnimatorRef.current && speechStartTime > 0) {
        const elapsedSeconds = (Date.now() - speechStartTime) / 1000;
        const viseme = visemeAnimatorRef.current(elapsedSeconds);
        applyVisemeToVRM(vrmRef.current, viseme, 1.0);
      }
    }

    if (modelRootRef.current) {
      const t = Date.now() * 0.001;
      modelRootRef.current.position.y = -1.28 + Math.sin(t * 2.2) * 0.004;
      modelRootRef.current.rotation.y += (pointerTargetRef.current.x - modelRootRef.current.rotation.y) * 0.07;
      modelRootRef.current.rotation.x += (pointerTargetRef.current.y - modelRootRef.current.rotation.x) * 0.07;
    }
  });

  const fallback = useMemo(
    () => (
      <mesh castShadow receiveShadow>
        <torusKnotGeometry args={[0.9, 0.3, 128, 24]} />
        <meshPhysicalMaterial color="#5cf2ff" roughness={0.25} metalness={0.35} />
      </mesh>
    ),
    []
  );

  return (
    <group
      ref={modelRootRef}
      position={[0, -1.28, 0]}
      onPointerMove={(event) => {
        pointerTargetRef.current.x = THREE.MathUtils.clamp(event.point.x * 0.15, -0.22, 0.22);
        pointerTargetRef.current.y = THREE.MathUtils.clamp((event.point.y - 1.2) * -0.08, -0.08, 0.12);
      }}
      onPointerLeave={() => {
        pointerTargetRef.current.x = 0;
        pointerTargetRef.current.y = 0;
      }}
      onPointerDown={() => {
        if (onInteract) {
          onInteract();
        }
      }}
    >
      {modelState.object3D ? (
        <group scale={modelState.scale}>
          <primitive object={modelState.object3D} position={modelState.offset} />
        </group>
      ) : (
        fallback
      )}
    </group>
  );
}

export default function AvatarScene({
  modelUrl,
  isSpeaking = false,
  speechText = "",
  speechStartTime = 0,
  onInteract
}) {
  return (
    <Canvas camera={{ position: [0, 1.24, 2.95], fov: 34 }}>
      <ambientLight intensity={0.88} />
      <directionalLight position={[1.8, 3.8, 1.6]} intensity={2.6} castShadow />
      <spotLight position={[-1.8, 3.2, 1.8]} intensity={2} color="#4fd6ff" />
      <Environment preset="warehouse" />
      <Model
        modelUrl={modelUrl}
        isSpeaking={isSpeaking}
        speechText={speechText}
        speechStartTime={speechStartTime}
        onInteract={onInteract}
      />
      <ContactShadows
        position={[0, -1.28, 0]}
        opacity={0.35}
        scale={10}
        blur={2.1}
        far={6}
        resolution={512}
      />
      <OrbitControls
        enablePan={false}
        enableRotate={false}
        enableZoom={false}
        target={[0, 1.05, 0]}
        minDistance={2.5}
        maxDistance={3.4}
        minPolarAngle={Math.PI / 2.25}
        maxPolarAngle={Math.PI / 1.7}
      />
    </Canvas>
  );
}
