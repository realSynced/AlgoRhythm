"use client";
import { useEffect, useState, useRef } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// Music note component for the animation
interface MusicNoteProps {
  delay: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

const MusicNote = ({ delay, x, y, size, rotation }: MusicNoteProps) => {
  return (
    <motion.div
      className="absolute text-[#bca6cf]"
      initial={{ opacity: 0, x, y: y + 100 }}
      animate={{
        opacity: [0, 1, 0],
        x: x + (Math.random() * 200 - 100),
        y: y - 300,
        rotate: rotation,
      }}
      transition={{
        duration: 4,
        delay,
        ease: "easeOut",
        repeat: Infinity,
        repeatDelay: Math.random() * 5,
      }}
      style={{ fontSize: size }}
    >
      {["♪", "♫", "♬", "♩", "𝄞"][Math.floor(Math.random() * 5)]}
    </motion.div>
  );
};

// Small music note for hover effect
const SmallMusicNote = ({ index }: { index: number }) => {
  return (
    <motion.span
      className="absolute text-[#bca6cf]"
      initial={{ opacity: 0, y: 0, x: 0 }}
      animate={{
        opacity: [0, 1, 0],
        y: [-10, -30],
        x: index % 2 === 0 ? 10 : -10,
      }}
      transition={{
        duration: 1,
        ease: "easeOut",
        times: [0, 0.5, 1],
      }}
    >
      {["♪", "♫", "♬"][index % 3]}
    </motion.span>
  );
};

// Features nav link with hover animation
const FeaturesNavLink = ({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [notes, setNotes] = useState<number[]>([]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Create 3 notes with staggered animation
    setNotes([0, 1, 2]);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setNotes([]);
  };

  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.1 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        color="foreground"
        href="#features"
        className="hover:text-[#bca6cf] text-xl relative"
        onClick={onClick}
      >
        Features
      </Link>
      {isHovered && notes.map((i) => <SmallMusicNote key={i} index={i} />)}
    </motion.div>
  );
};

// Waveform animation component
const Waveform = () => {
  const bars = 40;

  return (
    <div className="flex items-end h-32 gap-1 mx-auto my-8 justify-center">
      {[...Array(bars)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 bg-[#bca6cf]/80 rounded-t-md"
          initial={{ height: 10 }}
          animate={{
            height: [
              10 + Math.random() * 30,
              10 + Math.random() * 100,
              10 + Math.random() * 50,
              10 + Math.random() * 80,
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
            delay: (i * 0.05) % 0.5,
          }}
        />
      ))}
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [musicNotes, setMusicNotes] = useState<MusicNoteProps[]>([]);
  const featuresRef = useRef<HTMLElement>(null);

  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Initialize music notes after component mounts to avoid window not defined error
    setMusicNotes(
      Array.from({ length: 15 }, (_, i) => ({
        delay: Math.random() * 5,
        x:
          Math.random() *
          (typeof window !== "undefined" ? window.innerWidth : 1000),
        y: Math.random() * 300 + 300,
        size: 20 + Math.random() * 30,
        rotation: Math.random() * 360,
      }))
    );

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="text-white min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 overflow-hidden">
      <Navbar shouldHideOnScroll className="p-4 z-50">
        <NavbarBrand>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            {/* <div className="w-10 h-10 rounded-full bg-[#bca6cf] flex items-center justify-center">
              <span className="text-black text-xl font-bold">A</span>
            </div> */}
            <p className="font-bold text-inherit text-xl">AlgoRhythm</p>
            <Link
              href="https://github.com/realSynced/HackTJ-2025"
              target="_blank"
              className="text-[#bca6cf] hover:text-[#bca6cf]/80"
            >
              GitHub
            </Link>
          </motion.div>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <FeaturesNavLink onClick={scrollToFeatures} />
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button
              as={Link}
              color="primary"
              href="/projects"
              variant="flat"
              className="bg-[#bca6cf] text-white hover:bg-[#bca6cf]/80 px-8 py-6 text-lg rounded-xl flex items-center justify-center"
            >
              Get Started
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <section className="flex flex-col justify-center items-center min-h-screen relative px-4">
        {/* Floating music notes animation */}
        {musicNotes.map((note, i) => (
          <MusicNote key={i} {...note} />
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center z-10"
        >
          <h1 className="text-5xl sm:text-7xl md:text-9xl font-bold mb-6">
            Welcome to{" "}
            <motion.span
              initial={{ backgroundPosition: "0% 0%" }}
              animate={{ backgroundPosition: "100% 0%" }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#bca6cf] via-purple-400 to-[#bca6cf]"
            >
              AlgoRhythm.
            </motion.span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto"
          >
            Create stunning music with the power of AI. Upload, mix, and compose
            like never before.
          </motion.p>

          {/* Animated waveform */}
          <Waveform />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          >
            <Button
              size="lg"
              className="bg-[#bca6cf] text-white hover:bg-[#bca6cf]/80 px-8 py-6 text-lg rounded-xl flex items-center justify-center"
              onClick={() => router.push("/projects")}
            >
              Start Creating
            </Button>
          </motion.div>
        </motion.div>

        {/* Background circular gradient */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[#bca6cf]/20 blur-[100px] -top-[100px] -left-[100px]"></div>
          <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[120px] -bottom-[200px] -right-[100px]"></div>
        </div>
      </section>

      <section id="features" className="py-20 px-4" ref={featuresRef}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            viewport={{ once: true }}
            className="mb-16 text-right"
          >
            <h2 className="text-4xl md:text-6xl font-bold">
              <span className="text-[#bca6cf]">Features</span> that inspire
            </h2>
            <div className="h-1 w-24 bg-[#bca6cf] mt-4 ml-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "MIDI Support",
                description:
                  "Upload and visualize MIDI files with our interactive piano roll editor.",
                icon: "🎹",
              },
              {
                title: "AI Composition",
                description:
                  "Let our algorithms compose original music based on your preferences.",
                icon: "🧠",
              },
              {
                title: "Multi-track Mixing",
                description:
                  "Mix multiple audio tracks with precise control over timing and effects.",
                icon: "🎚️",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className="bg-neutral-800/50 backdrop-blur-sm p-6 rounded-2xl border border-neutral-700 hover:border-[#bca6cf]/50 transition-all hover:shadow-lg hover:shadow-[#bca6cf]/10"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-neutral-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Web Interface Section - Sticky Scroll Animation */}
      <section className="relative h-[100vh] overflow-hidden bg-neutral-900/30">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="sticky top-0 h-screen flex flex-col justify-center items-center px-4"
        >
          <div className="max-w-6xl w-full mx-auto">
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="text-4xl md:text-6xl font-bold">
                <span className="text-[#bca6cf]">Web</span> Interface
              </h2>
              <div className="h-1 w-24 bg-[#bca6cf] mt-4 rounded-full"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <p className="text-xl text-neutral-300 mb-6">
                  Our powerful web interface combines modern technologies to
                  deliver a seamless music creation experience.
                </p>
                <ul className="space-y-4">
                  {[
                    "NextJS, TypeScript, React, JSX for robust development",
                    "NextJS SSR and Client-side rendering for optimal performance",
                    "Audio processing for MIDI and MID files",
                    "Framer Motion animations for engaging UI",
                    "Supabase with PostgreSQL's realtime websocket for live updates",
                    "Supabase storage buckets for secure file management",
                    "React Fragments for efficient component composition",
                  ].map((feature, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * i }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3"
                    >
                      <div className="h-2 w-2 rounded-full bg-[#bca6cf]"></div>
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-neutral-800 rounded-3xl p-1 shadow-xl shadow-[#bca6cf]/10"
              >
                <div className="bg-neutral-900 rounded-2xl p-6 h-[350px] flex items-center justify-center overflow-hidden">
                  <motion.div
                    initial={{ y: 20, opacity: 0.5 }}
                    animate={{
                      y: [20, -20, 20],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                    className="text-center"
                  >
                    <div className="text-6xl mb-4">💻</div>
                    <p className="text-neutral-400">Interactive UI Mockup</p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Backend Section - Scroll-triggered Animation */}
      <section className="py-20 px-4 bg-neutral-900/50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl md:text-6xl font-bold">
              Machine <span className="text-[#bca6cf]">Learning</span>/Backend
            </h2>
            <div className="h-1 w-24 bg-[#bca6cf] mt-4 mx-auto rounded-full"></div>
          </motion.div>

          {/* Animated code block */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-neutral-800 rounded-2xl p-6 mb-12 shadow-xl shadow-black/20 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-neutral-400 text-sm">
                audio2midi.py
              </span>
            </div>
            <div className="font-mono text-sm overflow-x-auto">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-blue-400"
              >
                from basic_pitch import ICASSP_2022_MODEL_PATH
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-blue-400"
              >
                import pretty_midi
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                viewport={{ once: true }}
                className="text-blue-400"
              >
                def spltts(midi_data, ts):
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                viewport={{ once: true }}
                className="pl-4 text-neutral-300"
              >
                instr = midi_data.instruments[0]
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                viewport={{ once: true }}
                className="pl-4 text-neutral-300"
              >
                ts = sorted(ts)
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                viewport={{ once: true }}
                className="pl-4 text-neutral-300"
              >
                duration = 0
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                viewport={{ once: true }}
                className="pl-4 text-neutral-300"
              >
                for note in instr.notes:
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                viewport={{ once: true }}
                className="pl-8 text-green-400"
              >
                duration = max(duration, note.end)
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                viewport={{ once: true }}
                className="pl-4 text-neutral-300"
              >
                ts = [0] + ts + [duration]
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                viewport={{ once: true }}
                className="pl-4 text-green-400"
              >
                # Create time intervals for joystick input
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.3 }}
                viewport={{ once: true }}
                className="pl-4 text-neutral-300"
              >
                intervals = []
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.4 }}
                viewport={{ once: true }}
                className="pl-4 text-neutral-300"
              >
                for i in range(len(ts) - 1):
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                viewport={{ once: true }}
                className="pl-8 text-neutral-300"
              >
                intervals.append((ts[i], ts[i + 1]))
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.6 }}
                viewport={{ once: true }}
                className="pl-4 text-neutral-300"
              >
                maxinduration = [(0, 0, 0, 0) for i in range(len(intervals))]
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.7 }}
                viewport={{ once: true }}
                className="pl-4 text-neutral-300"
              >
                ninstr = pretty_midi.Instrument(program = 0)
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.8 }}
                viewport={{ once: true }}
                className="text-blue-400"
              >
                # Generate MIDI from hardware joystick input
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.9 }}
                viewport={{ once: true }}
                className="text-neutral-300"
              >
                model_output, midi_data, note_events = predict('qowp.mp3')
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 2.0 }}
                viewport={{ once: true }}
                className="text-neutral-300"
              >
                spltts(midi_data, [.9, 1.5, 2.1, 2.8, 3.4, 4.1, 4.6, 5.3, 6.3,
                7.0, 7.6, 8.2, 8.6, 9.4, 10.1])
              </motion.div>
            </div>
          </motion.div>

          {/* Backend features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-semibold mb-3 flex items-center">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="inline-block mr-3 text-[#bca6cf]"
                  >
                    ⚙️
                  </motion.span>
                  Suno API Integration
                </h3>
                <p className="text-neutral-400">
                  Seamless integration with Suno's AI vocal generation API,
                  featuring robust error handling and retry mechanisms for
                  reliable performance.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3 flex items-center">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: 1,
                    }}
                    className="inline-block mr-3 text-[#bca6cf]"
                  >
                    🔒
                  </motion.span>
                  Secure Authentication
                </h3>
                <p className="text-neutral-400">
                  Environment-based API token management with secure Bearer
                  authentication for all external API calls, protecting
                  sensitive operations.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-semibold mb-3 flex items-center">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: 2,
                    }}
                    className="inline-block mr-3 text-[#bca6cf]"
                  >
                    ⚡
                  </motion.span>
                  Asynchronous Processing
                </h3>
                <p className="text-neutral-400">
                  Efficient task management with asynchronous processing and
                  polling system to handle long-running operations without
                  blocking the UI.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3 flex items-center">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: 3,
                    }}
                    className="inline-block mr-3 text-[#bca6cf]"
                  >
                    🧠
                  </motion.span>
                  AI Audio Generation
                </h3>
                <p className="text-neutral-400">
                  Advanced AI-powered vocal synthesis from lyrics, with
                  customizable parameters for voice style, tempo, and emotional
                  expression.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Animated connection lines */}
          <div className="absolute inset-0 -z-10">
            <svg className="w-full h-full opacity-10">
              <motion.path
                d="M0,100 Q400,300 800,100 T1600,300"
                stroke="#bca6cf"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2 }}
                viewport={{ once: true }}
              />
              <motion.path
                d="M100,200 Q500,50 900,200 T1700,50"
                stroke="#bca6cf"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
                viewport={{ once: true }}
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Hardware Section - Parallax Effect */}
      <section className="py-20 px-4 bg-neutral-950 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto relative z-10"
        >
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            viewport={{ once: true }}
            className="mb-16 text-right"
          >
            <h2 className="text-4xl md:text-6xl font-bold">
              <span className="text-[#bca6cf]">Hardware</span> Integration
            </h2>
            <div className="h-1 w-24 bg-[#bca6cf] mt-4 ml-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-neutral-800/50 backdrop-blur-sm p-8 rounded-2xl border border-neutral-700 hover:border-[#bca6cf]/50 transition-all hover:shadow-lg hover:shadow-[#bca6cf]/10"
            >
              <h3 className="text-2xl font-semibold mb-4">
                Custom Hardware Controller
              </h3>
              <ul className="space-y-3">
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start"
                >
                  <span className="text-[#bca6cf] mr-2">→</span>
                  <span className="text-neutral-300">
                    Began by breadboarding an ESP, 9-axis IMU, and Joystick
                  </span>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="flex items-start"
                >
                  <span className="text-[#bca6cf] mr-2">→</span>
                  <span className="text-neutral-300">
                    Integrated acceleration into position
                  </span>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="flex items-start"
                >
                  <span className="text-[#bca6cf] mr-2">→</span>
                  <span className="text-neutral-300">
                    Designed "wand" controller body
                  </span>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="flex items-start"
                >
                  <span className="text-[#bca6cf] mr-2">→</span>
                  <span className="text-neutral-300">
                    3D printed, soldered, and used Kalman filtering to refine
                    data (26 dimension matrix)
                  </span>
                </motion.li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative h-[350px] overflow-hidden rounded-2xl"
            >
              <div className="w-full h-full bg-cover bg-center rounded-2xl" 
                   style={{ backgroundImage: "url('/images/img_hardware.jpg')" }}>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative h-[350px] overflow-hidden rounded-2xl"
            >
              <div className="w-full h-full bg-cover bg-center rounded-2xl" 
                   style={{ backgroundImage: "url('/images/img_hardware2.jpg')" }}>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-neutral-800/50 backdrop-blur-sm p-8 rounded-2xl border border-neutral-700 hover:border-[#bca6cf]/50 transition-all hover:shadow-lg hover:shadow-[#bca6cf]/10"
            >
              <h3 className="text-2xl font-semibold mb-4">
                Technical Specifications
              </h3>
              <ul className="space-y-3">
                <motion.li
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start"
                >
                  <span className="text-[#bca6cf] mr-2">→</span>
                  <span className="text-neutral-300">
                    ESP32 microcontroller with WiFi connectivity
                  </span>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="flex items-start"
                >
                  <span className="text-[#bca6cf] mr-2">→</span>
                  <span className="text-neutral-300">
                    MPU-9250 9-axis IMU (accelerometer, gyroscope, magnetometer)
                  </span>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="flex items-start"
                >
                  <span className="text-[#bca6cf] mr-2">→</span>
                  <span className="text-neutral-300">
                    Custom PCB design with analog joystick input
                  </span>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="flex items-start"
                >
                  <span className="text-[#bca6cf] mr-2">→</span>
                  <span className="text-neutral-300">
                    Real-time data processing with 100Hz sampling rate
                  </span>
                </motion.li>
              </ul>
            </motion.div>
          </div>

          {/* Floating hardware elements - parallax effect */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.3 }}
                animate={{
                  y: [
                    Math.random() * 100,
                    Math.random() * -100,
                    Math.random() * 100,
                  ],
                  x: [
                    Math.random() * 100,
                    Math.random() * -100,
                    Math.random() * 100,
                  ],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 20 + Math.random() * 10,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
                className="absolute text-[#bca6cf]/10 text-8xl"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
              >
                {["🎛️", "🎚️", "🎧", "🎹", "🎷", "🎸"][i % 6]}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-20 px-4 bg-neutral-900/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-6xl mx-auto text-center h-[40rem] flex flex-col items-center justify-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to create your{" "}
            <span className="text-[#bca6cf]">masterpiece</span>?
          </h2>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Button
              size="lg"
              className="bg-[#bca6cf] text-white hover:bg-[#bca6cf]/80 px-10 py-7 text-xl rounded-xl flex items-center justify-center"
              onClick={() => router.push("/projects")}
            >
              Get Started Now
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-6 md:mb-0">
            {/* <div className="w-8 h-8 rounded-full bg-[#bca6cf] flex items-center justify-center">
              <span className="text-black text-sm font-bold">A</span>
            </div> */}
            <p className="font-bold text-xl">AlgoRhythm</p>
          </div>

          {/* <div className="flex gap-8 text-neutral-400">
            <Link href="#" className="hover:text-[#bca6cf]">
              Terms
            </Link>
            <Link href="#" className="hover:text-[#bca6cf]">
              Privacy
            </Link>
            <Link href="#" className="hover:text-[#bca6cf]">
              Contact
            </Link>
          </div> */}

          <div className="mt-6 md:mt-0 text-neutral-500 text-sm">
            &copy; 2025 AlgoRhythm. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
