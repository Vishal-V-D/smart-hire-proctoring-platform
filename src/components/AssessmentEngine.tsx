import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    Html,
    OrbitControls,
    Sphere,
    Torus,
    Stars,
    Float
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Code, Eye, CheckCircle, FileText } from 'lucide-react';

// --- CONFIGURATION ---
const ROTATION_SPEED = 4000; // ms between auto-switch
const ORBIT_RADIUS = 5.5;    // Size of the orbit

const STEPS = [
    { id: 1, icon: Mail, label: "INVITE", sub: "Sourcing", color: "#06b6d4", desc: "Send secure, one-click assessment invites." }, // Cyan
    { id: 2, icon: Code, label: "ASSESS", sub: "Environment", color: "#f8fafc", desc: "Real-time coding environment with 40+ langs." }, // White/Slate
    { id: 3, icon: Eye, label: "MONITOR", sub: "Proctoring", color: "#a855f7", desc: "AI-driven fraud detection & tab monitoring." }, // Purple
    { id: 4, icon: CheckCircle, label: "ANALYZE", sub: "Insights", color: "#22c55e", desc: "Detailed candidate performance heatmaps." }, // Green
    { id: 5, icon: FileText, label: "HIRE", sub: "Onboarding", color: "#3b82f6", desc: "Generate ranked reports and offer letters." }   // Blue
];

// --- 3D COMPONENTS ---

// 1. The Glowing Sun/Core
const SunCore = ({ activeColor }: { activeColor: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            // Slow pulse rotation
            meshRef.current.rotation.y += 0.002;
            meshRef.current.rotation.z += 0.001;
        }
    });

    return (
        <group>
            {/* Inner Hot Core */}
            <Sphere args={[1.2, 64, 64]}>
                <meshStandardMaterial
                    color={"#000"}
                    emissive={activeColor}
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </Sphere>

            {/* Outer Energy Shell */}
            <Sphere args={[1.4, 64, 64]} ref={meshRef}>
                <meshStandardMaterial
                    color={activeColor}
                    transparent
                    opacity={0.3}
                    wireframe
                />
            </Sphere>

            {/* Glow Halo (Point Light) */}
            <pointLight distance={15} intensity={5} color={activeColor} />
        </group>
    );
};

// 2. The Professional Planet Node
const PlanetNode = ({ step, index, total, activeStep, onClick, onHover }: any) => {
    const isActive = activeStep === index;
    const angle = (index / total) * Math.PI * 2;
    const x = Math.cos(angle) * ORBIT_RADIUS;
    const z = Math.sin(angle) * ORBIT_RADIUS;

    const meshRef = useRef<THREE.Group>(null);

    // Subtle local rotation for the planet
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
        }
    });

    return (
        <group position={[x, 0, z]}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                <group
                    ref={meshRef}
                    onClick={() => onClick(index)}
                    onPointerOver={() => onHover(true)}
                    onPointerOut={() => onHover(false)}
                >
                    {/* Main Planet Body */}
                    <Sphere args={[0.5, 32, 32]}>
                        <meshPhysicalMaterial
                            color={isActive ? step.color : "#334155"}
                            metalness={0.4}
                            roughness={0.2}
                            emissive={isActive ? step.color : "#000"}
                            emissiveIntensity={isActive ? 0.5 : 0}
                            clearcoat={1}
                        />
                    </Sphere>

                    {/* Technologic Ring around planet */}
                    <Torus args={[0.8, 0.02, 16, 32]} rotation={[Math.PI / 2.5, 0, 0]}>
                        <meshBasicMaterial color={isActive ? step.color : "#64748b"} transparent opacity={isActive ? 0.8 : 0.2} />
                    </Torus>

                    {/* Connection Line to Center (Only when active) */}
                    {isActive && (
                        <mesh position={[-x / 2, 0, -z / 2]} rotation={[0, -angle, 0]}>
                            <boxGeometry args={[ORBIT_RADIUS, 0.02, 0.02]} />
                            <meshBasicMaterial color={step.color} transparent opacity={0.5} />
                        </mesh>
                    )}
                </group>
            </Float>

            {/* Floating Label (3D Text) */}
            <Html position={[0, -1, 0]} center distanceFactor={12} zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
                <div className={`transition-all duration-500 ${isActive ? 'opacity-100 transform scale-100' : 'opacity-40 scale-75'}`}>
                    <div
                        className="px-2 py-1 rounded text-[10px] font-bold tracking-widest border backdrop-blur-sm whitespace-nowrap"
                        style={{
                            borderColor: isActive ? step.color : '#334155',
                            color: isActive ? step.color : '#94a3b8',
                            background: 'rgba(0,0,0,0.5)'
                        }}
                    >
                        {step.label}
                    </div>
                </div>
            </Html>
        </group>
    );
};

// 3. The Scene Container (Handles Rotation & Orbit)
const SceneSystem = ({ activeStep, setActiveStep, setIsPaused }: any) => {
    const groupRef = useRef<THREE.Group>(null);

    // Smoothly rotate the entire group so the ACTIVE planet is always at the "Front" (approx -Math.PI/2)
    useFrame((state) => {
        if (groupRef.current) {
            // Calculate target rotation: We want the active index to be at the front
            // Basic angle per step = (PI * 2) / Total
            const anglePerStep = (Math.PI * 2) / STEPS.length;
            // Target is negative so we rotate counter-clockwise to bring it to front
            // We add Math.PI / 2 to align it to the camera's Z-axis view
            const targetRotation = - (activeStep * anglePerStep) + (Math.PI / 2);

            // Smooth Lerp
            groupRef.current.rotation.y = THREE.MathUtils.lerp(
                groupRef.current.rotation.y,
                targetRotation,
                0.05
            );
        }
    });

    return (
        <>
            <group ref={groupRef}>
                {/* Orbital Ring Track */}
                <Torus args={[ORBIT_RADIUS, 0.02, 64, 100]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshBasicMaterial color="#334155" transparent opacity={0.3} />
                </Torus>

                {STEPS.map((step, index) => (
                    <PlanetNode
                        key={step.id}
                        step={step}
                        index={index}
                        total={STEPS.length}
                        activeStep={activeStep}
                        onClick={setActiveStep}
                        onHover={setIsPaused}
                    />
                ))}
            </group>

            {/* Central Sun stays static relative to rotation, or rotates independently */}
            <SunCore activeColor={STEPS[activeStep].color} />
        </>
    );
};

// --- MAIN PAGE COMPONENT ---

const SolarSystemHero = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const activeData = STEPS[activeStep];

    // Auto-Rotation Timer
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % STEPS.length);
        }, ROTATION_SPEED);
        return () => clearInterval(interval);
    }, [isPaused, activeStep]);

    return (
        <div className="relative w-full h-[600px] xl:h-[700px] overflow-hidden font-sans bg-transparent">
            {/* --- 3D CANVAS --- */}
            <div className="absolute inset-0 z-10">
                <Canvas camera={{ position: [0, 6, 10], fov: 40 }} dpr={[1, 2]}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />

                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                    <SceneSystem
                        activeStep={activeStep}
                        setActiveStep={setActiveStep}
                        setIsPaused={setIsPaused}
                    />

                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        minPolarAngle={Math.PI / 3}
                        maxPolarAngle={Math.PI / 2.2}
                    />
                </Canvas>
            </div>

            {/* --- UI OVERLAY (Bottom Center Card) --- */}
            <div className="absolute inset-x-0 bottom-8 z-20 flex justify-center px-4 pointer-events-none">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        className={`
                            pointer-events-auto relative max-w-2xl w-full p-1 rounded-2xl shadow-2xl
                            before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:blur-xl before:opacity-50
                        `}
                        style={{
                            background: `linear-gradient(to right, ${activeData.color}20, transparent)`,
                        }}
                    >
                        <div
                            className="relative flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 rounded-xl border backdrop-blur-xl bg-zinc-900/80 border-slate-700"
                        >
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3"
                                style={{ backgroundColor: activeData.color }}
                            >
                                <activeData.icon size={32} className="text-white" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                    <span className="text-xs font-bold tracking-widest uppercase text-slate-400">
                                        Step 0{activeData.id}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                                    <span className="text-xs font-bold uppercase" style={{ color: activeData.color }}>
                                        {activeData.sub}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black tracking-tight mb-2 text-white">
                                    {activeData.label}
                                </h2>
                                <p className="text-sm leading-relaxed text-slate-300">
                                    {activeData.desc}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SolarSystemHero;