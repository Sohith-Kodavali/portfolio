import ShellCanvas from "@/components/ShellCanvasLazy";
import HeroBackdrop from "@/components/HeroBackdrop";
import ColorGrade from "@/components/ColorGrade";
import ScrollSmear from "@/components/ScrollSmear";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Statement from "@/components/Statement";
import Work from "@/components/Work";
import Capabilities from "@/components/Capabilities";
import Marquee from "@/components/Marquee";
import ZoomTransition from "@/components/ZoomTransition";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <HeroBackdrop />
      <ColorGrade />
      <ScrollSmear />
      <ShellCanvas />
      <Nav />
      <main>
        <Hero />
        <Statement />
        <Work />
        <Capabilities />
        <Marquee />
        <ZoomTransition />
        <About />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
