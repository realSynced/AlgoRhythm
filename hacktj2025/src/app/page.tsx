"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="text-[#bca6cf]">Features</span> that inspire
          </h2>

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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
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
