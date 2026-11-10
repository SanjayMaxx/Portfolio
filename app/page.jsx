"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Copy, Mail, Menu, X } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import * as THREE from "three";
import { defaultPortfolioContent, mergePortfolioContent } from "../lib/portfolio-content";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

gsap.registerPlugin(ScrollTrigger);

// The original hero remains the source of truth. This only controls the temporary intro layer.
const ENABLE_CINEMATIC_INTRO = true;
const DEBUG_GLOBE_TRAVEL = false;

const chapters = ["Start", "About", "Systems", "Work", "Toolkit", "Contact"];

function SignalCore({ mountRef }) {
  return <div ref={mountRef} className="signal-core" role="img" aria-label="Interactive 3D visualization of a quality signal moving through connected systems" />;
}

export default function Home() {
  const mountRef = useRef(null);
  const cursorRef = useRef(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState(0);
  const [chapter, setChapter] = useState(0);
  const [copied, setCopied] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const progressRef = useRef(null);
  const [portfolio, setPortfolio] = useState(defaultPortfolioContent);
  const skill = useMemo(() => portfolio.skills[activeSkill] || portfolio.skills[0], [activeSkill, portfolio.skills]);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("portfolio_content").select("content").eq("id", "main").eq("published", true).maybeSingle().then(({ data }) => {
      if (data?.content) setPortfolio(mergePortfolioContent(data.content));
    });
  }, [supabase]);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || window.matchMedia("(pointer: coarse)").matches) return;
    let pulseTimer;
    let frame = 0;
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = currentX;
    let targetY = currentY;
    const moveCursor = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.classList.remove("is-pulsing");
      void cursor.offsetWidth;
      cursor.classList.add("is-pulsing");
      clearTimeout(pulseTimer);
      pulseTimer = setTimeout(() => cursor.classList.remove("is-pulsing"), 520);
    };
    const animateCursor = () => {
      currentX += (targetX - currentX) * .16;
      currentY += (targetY - currentY) * .16;
      cursor.style.setProperty("--cursor-x", `${currentX}px`);
      cursor.style.setProperty("--cursor-y", `${currentY}px`);
      frame = requestAnimationFrame(animateCursor);
    };
    const pressCursor = () => { cursor.classList.add("is-pressed"); setTimeout(() => cursor.classList.remove("is-pressed"), 340); };
    const setCursorMode = (event) => {
      const target = event.target.closest("a,button,.flow-node,.project-card,.tool-list button");
      cursor.dataset.mode = target ? (target.matches("button,.tool-list button") ? "button" : "interactive") : "default";
    };
    window.addEventListener("pointermove", moveCursor, { passive: true });
    window.addEventListener("pointerdown", pressCursor, { passive: true });
    window.addEventListener("pointerover", setCursorMode, { passive: true });
    animateCursor();
    return () => { clearTimeout(pulseTimer); cancelAnimationFrame(frame); window.removeEventListener("pointermove", moveCursor); window.removeEventListener("pointerdown", pressCursor); window.removeEventListener("pointerover", setCursorMode); };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    camera.position.set(0, 0, 8.5);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff3df, 1.8));
    const coral = new THREE.PointLight(0xff684a, 28, 18);
    coral.position.set(3, 2, 5);
    scene.add(coral);
    const cyan = new THREE.PointLight(0x78d9dc, 20, 18);
    cyan.position.set(-4, -1, 2);
    scene.add(cyan);
    const core = new THREE.Group();
    scene.add(core);
    let orb = null;
    let shell = null;
    let inner = null;
    let rings = [];
    let dust = null;
    const nodes = new THREE.Group();
    core.add(nodes);
    let workflowCurve = null;
    let workflowPulse = null;
    // The rejected workflow-core experiment remains below for reference only.
    // Both flag states use the original globe geometry; the flag controls entrance timing only.
    if (false) {
      const points = [new THREE.Vector3(-2.25, 1.35, .1), new THREE.Vector3(-1.1, .62, .32), new THREE.Vector3(0, -.08, .08), new THREE.Vector3(1.12, -.72, .3), new THREE.Vector3(2.25, -1.34, .04)];
      workflowCurve = new THREE.CatmullRomCurve3(points);
      const pathMat = new THREE.LineBasicMaterial({ color: 0x9be1da, transparent: true, opacity: .72 });
      const pathGeo = new THREE.BufferGeometry().setFromPoints(workflowCurve.getPoints(80));
      core.add(new THREE.Line(pathGeo, pathMat));
      const parallelCurve = new THREE.CatmullRomCurve3(points.map((point, index) => point.clone().add(new THREE.Vector3(0, .16 * Math.sin(index), -.08))));
      const parallelGeo = new THREE.BufferGeometry().setFromPoints(parallelCurve.getPoints(80));
      core.add(new THREE.Line(parallelGeo, new THREE.LineBasicMaterial({ color: 0xfb684d, transparent: true, opacity: .35 })));
      const nodeMat = new THREE.MeshPhysicalMaterial({ color: 0x122129, emissive: 0x285a5d, emissiveIntensity: .55, metalness: .36, roughness: .2, clearcoat: 1 });
      points.forEach((point, index) => {
        const node = new THREE.Mesh(new THREE.IcosahedronGeometry(index === 2 ? .22 : .16, 1), nodeMat);
        node.position.copy(point);
        node.userData.phase = index * .7;
        nodes.add(node);
        const marker = new THREE.Mesh(new THREE.TorusGeometry(index === 2 ? .34 : .26, .018, 8, 48), new THREE.MeshStandardMaterial({ color: index === 2 ? 0xfb684d : 0x9be1da, emissive: index === 2 ? 0x8f210f : 0x164c50, emissiveIntensity: .7 }));
        marker.rotation.x = Math.PI / 2;
        marker.position.copy(point);
        marker.userData.phase = index * .7;
        nodes.add(marker);
      });
      workflowPulse = new THREE.Mesh(new THREE.SphereGeometry(.075, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfb684d }));
      core.add(workflowPulse);
      const dustPositions = new Float32Array(55 * 3);
      for (let i = 0; i < 55; i++) { dustPositions[i*3] = (Math.random() - .5) * 5.8; dustPositions[i*3+1] = (Math.random() - .5) * 4.2; dustPositions[i*3+2] = (Math.random() - .5) * 1.4; }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
      dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xd6cffd, size: .022, transparent: true, opacity: .55 }));
      scene.add(dust);
    } else {
      const glass = new THREE.MeshPhysicalMaterial({ color: 0xe2d7c5, metalness: .48, roughness: .16, transmission: .12, clearcoat: 1, clearcoatRoughness: .08 });
      orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.17, 2), glass);
      core.add(orb);
      shell = new THREE.Mesh(new THREE.SphereGeometry(1.42, 32, 20), new THREE.MeshPhysicalMaterial({ color: 0x86d6d0, transparent: true, opacity: .12, transmission: .38, roughness: .08, metalness: .2, clearcoat: 1, wireframe: true }));
      core.add(shell);
      inner = new THREE.Mesh(new THREE.IcosahedronGeometry(.63, 1), new THREE.MeshStandardMaterial({ color: 0xff684a, emissive: 0x8f210f, emissiveIntensity: 1.3, metalness: .5, roughness: .22, wireframe: true }));
      core.add(inner);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xf2c975, metalness: .68, roughness: .26, emissive: 0x604019, emissiveIntensity: .3 });
      rings = [[1.68, .022, .15, -.35], [2.08, .012, 1.14, .45], [2.48, .009, -.7, .18]].map(([radius, tube, rx, ry]) => { const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, 180), ringMat); mesh.rotation.set(rx, ry, .1); core.add(mesh); return mesh; });
      const nodeGeo = new THREE.OctahedronGeometry(.105, 0);
      const nodeMat = new THREE.MeshStandardMaterial({ color: 0x9be1da, emissive: 0x164c50, emissiveIntensity: .8, metalness: .35, roughness: .25 });
      [[-2.1,.9,.5],[1.6,1.3,.1],[2,-.8,.3],[-1.65,-1.2,.4],[.3,2,.1]].forEach(([x,y,z]) => { const node = new THREE.Mesh(nodeGeo, nodeMat); node.position.set(x,y,z); nodes.add(node); });
      const dustPositions = new Float32Array(240 * 3);
      for (let i = 0; i < 240; i++) { const radius = 2.8 + Math.random() * 2.2; const angle = Math.random() * Math.PI * 2; dustPositions[i*3] = Math.cos(angle) * radius; dustPositions[i*3+1] = (Math.random() - .5) * 5.6; dustPositions[i*3+2] = (Math.random() - .5) * 3.2; }
      const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions,3)); dust = new THREE.Points(dustGeo,new THREE.PointsMaterial({ color: 0xffd8b0, size: .018, transparent: true, opacity: .68 })); scene.add(dust);
    }

    let width = 0;
    let height = 0;
    const resize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width,height);
      camera.aspect = width/height;
      camera.updateProjectionMatrix();
    };
    resize();
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (event) => {
      const rect = mount.getBoundingClientRect();
      pointer.tx = ((event.clientX - rect.left) / rect.width - .5) * .65;
      pointer.ty = ((event.clientY - rect.top) / rect.height - .5) * .4;
    };
    mount.addEventListener("pointermove", onMove);
    window.addEventListener("resize",resize);
    const clock = new THREE.Clock();
    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      if (mount.dataset.cinematicFreeze === "true") {
        if (clock.running) clock.stop();
        renderer.render(scene,camera);
        return;
      }
      if (!clock.running) clock.start();
      const t = clock.getElapsedTime();
      core.rotation.y += (pointer.x - core.rotation.y) * .025;
      core.rotation.x += (pointer.y - core.rotation.x) * .025;
      pointer.x += (pointer.tx-pointer.x)*.025;
      pointer.y += (pointer.ty-pointer.y)*.025;
      if (false && workflowCurve && workflowPulse) {
        workflowPulse.position.copy(workflowCurve.getPointAt((t * .08) % 1));
        nodes.children.forEach((node) => { node.rotation.y += .006; node.rotation.x += .003; node.scale.setScalar(1 + Math.sin(t * 1.4 + node.userData.phase) * .06); });
      } else {
        orb.rotation.y = t*.12;
        shell.rotation.set(t*.05, -t*.08, t*.03);
        shell.scale.setScalar(1 + Math.sin(t * 1.2) * .035);
        inner.rotation.set(t*.18,t*.3,t*.08);
        rings.forEach((ring,i)=>{ ring.rotation.z += .0015*(i%2 ? -1 : 1); });
      }
      nodes.rotation.y = t*.08;
      dust.rotation.y = t*.008;
      renderer.render(scene,camera);
    };
    render();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis;
    let smoothFrame = 0;
    if (!reduced) {
      lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      const smooth = (time) => { lenis.raf(time); smoothFrame=requestAnimationFrame(smooth); };
      smoothFrame=requestAnimationFrame(smooth);
      document.querySelectorAll("[data-reveal]").forEach((el)=>gsap.fromTo(el,{y:28,opacity:0},{y:0,opacity:1,duration:.85,ease:"power3.out",scrollTrigger:{trigger:el,start:"top 88%",once:true}}));
      gsap.to(".signal-core",{yPercent:-8,scale:1.04,ease:"none",scrollTrigger:{trigger:".hero",scrub:true}});
    } else {
      document.querySelectorAll("[data-reveal]").forEach((el)=>{el.style.opacity=1;});
    }
    const sections = gsap.utils.toArray(".chapter-section");
    const triggers = sections.map((section,index)=>ScrollTrigger.create({trigger:section,start:"top 55%",end:"bottom 45%",onEnter:()=>setChapter(index),onEnterBack:()=>setChapter(index)}));
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize",onResize);
    return ()=>{
      cancelAnimationFrame(raf); cancelAnimationFrame(smoothFrame);
      mount.removeEventListener("pointermove",onMove); window.removeEventListener("resize",resize); window.removeEventListener("resize",onResize);
      lenis?.destroy(); triggers.forEach((trigger)=>trigger.kill());
      scene.traverse((object)=>{object.geometry?.dispose(); if(object.material){(Array.isArray(object.material)?object.material:[object.material]).forEach((material)=>material.dispose());}});
      renderer.dispose(); renderer.domElement.remove();
    };
  },[]);

  useEffect(() => {
    if (DEBUG_GLOBE_TRAVEL || !ENABLE_CINEMATIC_INTRO) return undefined;
    const globe = mountRef.current;
    if (!globe) return undefined;
    const hero = globe.closest(".hero");
    const portfolioRoot = globe.closest(".portfolio");
    const progress = progressRef.current;
    if (!hero || !portfolioRoot) return undefined;
    let firstFrame = 0;
    let secondFrame = 0;
    let holdTimer;
    let finishTimer;
    let textTimeline;
    const originalTransform = globe.style.transform;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const logState = (phase) => {
      if (process.env.NODE_ENV === "production") return;
      const globeStyle = getComputedStyle(globe);
      const heroStyle = getComputedStyle(hero);
      const text = hero.querySelector(".hero-copy");
      const textStyle = text ? getComputedStyle(text) : null;
      const bodyStyle = getComputedStyle(document.body);
      const rect = globe.getBoundingClientRect();
      console.table({
        phase,
        globeTransform: globeStyle.transform,
        globeOpacity: globeStyle.opacity,
        globeVisibility: globeStyle.visibility,
        globeDisplay: globeStyle.display,
        globeZIndex: globeStyle.zIndex,
        globePosition: globeStyle.position,
        globeWidth: globeStyle.width,
        globeHeight: globeStyle.height,
        globeX: rect.x,
        globeY: rect.y,
        globeCenterX: rect.left + rect.width / 2,
        globeCenterY: rect.top + rect.height / 2,
        heroOpacity: heroStyle.opacity,
        heroVisibility: heroStyle.visibility,
        heroTransform: heroStyle.transform,
        heroZIndex: heroStyle.zIndex,
        heroOverflow: heroStyle.overflow,
        textOpacity: textStyle?.opacity,
        textVisibility: textStyle?.visibility,
        textDisplay: textStyle?.display,
        bodyOpacity: bodyStyle.opacity,
        cinematicClasses: `${portfolioRoot.className} / ${document.body.className}`,
      });
    };
    const beginCinematicTravel = () => {
      const rect = globe.getBoundingClientRect();
      const globeCenterX = rect.left + rect.width / 2;
      const globeCenterY = rect.top + rect.height / 2;
      const deltaX = window.innerWidth / 2 - globeCenterX;
      const deltaY = window.innerHeight / 2 - globeCenterY;
      logState("before-travel");
      document.body.classList.add("cinematic-opening");
      hero.classList.add("cinematic-active");
      if (reduced) {
        finishTimer = window.setTimeout(() => {
          hero.classList.remove("cinematic-active");
          document.body.classList.remove("cinematic-opening");
          portfolioRoot.classList.add("cinematic-complete");
        }, 180);
        return;
      }
      gsap.set(globe, { x: deltaX, y: deltaY, scale: 1.16 });
      if (progress) {
        const centeredRect = globe.getBoundingClientRect();
        progress.style.left = `${centeredRect.left + centeredRect.width / 2}px`;
        progress.style.top = `${centeredRect.bottom + 22}px`;
      }
      holdTimer = window.setTimeout(() => {
        document.body.classList.add("cinematic-travel");
        hero.classList.add("cinematic-revealing");
        textTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        textTimeline.fromTo(hero.querySelectorAll(".hero-copy [data-reveal]"), { y: 24, opacity: 0, filter: "blur(5px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: .85, stagger: .1 }, .12);
        gsap.to(globe, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 2.3,
          ease: "power3.inOut",
          overwrite: false,
          onComplete: () => {
            if (process.env.NODE_ENV !== "production") {
              logState("final-animation-frame");
              requestAnimationFrame(() => {
                logState("immediate-post-completion");
              });
            }
          },
        });
      }, 4500);
      finishTimer = window.setTimeout(() => {
        hero.classList.remove("cinematic-active", "cinematic-revealing");
        document.body.classList.remove("cinematic-opening", "cinematic-travel");
        portfolioRoot.classList.add("cinematic-complete");
        if (progress) { progress.style.removeProperty("left"); progress.style.removeProperty("top"); }
      }, 7000);
    };
    firstFrame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(beginCinematicTravel); });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(holdTimer);
      window.clearTimeout(finishTimer);
      textTimeline?.kill();
      gsap.killTweensOf(globe);
      hero.classList.remove("cinematic-active", "cinematic-revealing");
      document.body.classList.remove("cinematic-opening", "cinematic-travel");
      if (progress) { progress.style.removeProperty("left"); progress.style.removeProperty("top"); }
      gsap.set(globe, { clearProps: "transform" });
      globe.style.transform = originalTransform;
    };
  }, []);

  const goTo = (id)=>{setMenuOpen(false);document.getElementById(id)?.scrollIntoView({behavior:"smooth"});};
  const copyEmail = async ()=>{try{await navigator.clipboard.writeText(portfolio.contact.email);setCopied(true);setTimeout(()=>setCopied(false),1600);}catch{setCopied(false);}};

  return <main className={`portfolio ${ENABLE_CINEMATIC_INTRO ? "cinematic-enabled" : ""}`}>
    <div className="read-progress" style={{transform:`scaleX(${(chapter+1)/chapters.length})`}} />
    <header className="topbar"><button className="brand-mark" onClick={()=>goTo("opening")} aria-label="Back to start">SBV<span>®</span></button><div className="availability"><i/> QA AUTOMATION / INDIA</div><div className="topbar-actions"><button className="top-admin" onClick={()=>setAdminOpen(true)}>ADMIN</button><button className="menu-toggle" onClick={()=>setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>{menuOpen?<X size={17}/>:<Menu size={17}/>}<span>{menuOpen?"CLOSE":"INDEX"}</span></button></div></header>
    <nav className={`full-index ${menuOpen?"open":""}`} aria-hidden={!menuOpen}><p>FIELD NOTES / 2026</p>{chapters.map((name,i)=><button key={name} onClick={()=>goTo(["opening","about","systems","work","toolkit","contact"][i])}><small>0{i+1}</small>{name}<ArrowUpRight/></button>)}<span>SANJAY BHARGAV VARMA / QA AUTOMATION ENGINEER</span></nav>
    <aside className="chapter-rail">{chapters.map((name,i)=><button key={name} className={chapter===i?"current":""} onClick={()=>goTo(["opening","about","systems","work","toolkit","contact"][i])}><span>0{i+1}</span><b>{name}</b></button>)}</aside>

    <section className="hero chapter-section" id="opening">
      <div className="hero-backdrop"/><div className="hero-copy"><p className="micro-label" data-reveal><span>01 / 06</span> PERSONAL QUALITY ENGINEERING</p><h1 data-reveal>I make<br/><em>quality</em><br/>visible.</h1><p className="hero-intro" data-reveal>I’m {portfolio.profile.name}. I test the details between systems, people and the moment a release goes live.</p><button className="enter-button" onClick={()=>goTo("about")} data-reveal>EXPLORE MY WORK <ArrowDown size={15}/></button></div>
      <div className="hero-art"><div className="core-label label-top">SIGNAL / 01 <span>LIVE SYSTEM</span></div><SignalCore mountRef={mountRef}/><div className="core-caption"><span>QUALITY IS A<br/>CONNECTED SYSTEM</span><b>SBV — 001</b></div><div className="core-orbit-text">OBSERVE · VALIDATE · RELEASE ·</div></div>
      <div className="cinematic-progress" ref={progressRef} aria-hidden="true"><span>LOADING / PROGRESS</span><i><b/></i></div>
      <div className="hero-foot"><span>QA AUTOMATION ENGINEER</span><span>1.7 YEARS / NFORCE ONE</span><span>SCROLL TO FOLLOW THE SIGNAL ↓</span></div>
    </section>

    <section className="about chapter-section" id="about"><div className="content-wrap about-grid"><div className="chapter-tag" data-reveal>02 / A LITTLE ABOUT ME</div><div className="about-copy"><h2 data-reveal>I look for what<br/>the happy path<br/><em>doesn’t show.</em></h2><p data-reveal>{portfolio.profile.summary}</p><div className="about-stats" data-reveal><div><b>{portfolio.profile.experience.replace(" years in QA", "")}</b><span>YEARS IN QA</span></div><div><b>{portfolio.metrics.automated}</b><span>TEST CASES AUTOMATED</span></div><div><b>{portfolio.metrics.domainCount}</b><span>CONNECTED DOMAIN / {portfolio.profile.domain.toUpperCase()}</span></div></div></div><div className="about-figure" data-reveal><img src="/sbv-generated-fullbody.png" alt="Sanjay holding a glowing quality signal"/><span>THE PERSON / THE SIGNAL</span></div><div className="about-stamp">TEST<br/>WITH<br/><i>INTENT</i></div></div></section>

    <section className="systems chapter-section" id="systems"><div className="content-wrap"><div className="section-head" data-reveal><div className="chapter-tag">03 / FOLLOW THE SIGNAL</div><p>ONE CUSTOMER ISSUE.<br/>A LOT OF IMPORTANT HAND-OFFS.</p></div><div className="systems-intro"><div><h2 className="systems-headline" data-reveal>I follow the work<br/><em>all the way through.</em></h2><p className="systems-lede" data-reveal>For Dispatch Desktop, I validate the movement from field activity through triage and into the CRM record—especially where status can drift between systems.</p></div><div className="inspection-visual" data-reveal aria-label="Abstract end-to-end quality inspection visual"><span className="visual-kicker">QUALITY CONTROL / LIVE TRACE</span><svg viewBox="0 0 520 330" role="img" aria-hidden="true"><path className="inspection-path" d="M55 248 C120 88 188 275 260 126 S400 76 465 178"/><path className="inspection-path faint" d="M55 248 C150 205 170 76 260 126 S380 270 465 178"/><g className="inspection-node" transform="translate(55 248)"><circle r="16"/><path d="M-5 0l4 4 8-9"/></g><g className="inspection-node" transform="translate(165 190)"><circle r="13"/><path d="M-5 0l4 4 8-9"/></g><g className="inspection-node" transform="translate(260 126)"><circle r="18"/><path d="M-5 0l4 4 8-9"/></g><g className="inspection-node" transform="translate(370 120)"><circle r="13"/><path d="M-5 0l4 4 8-9"/></g><g className="inspection-node" transform="translate(465 178)"><circle r="16"/><path d="M-5 0l4 4 8-9"/></g><circle className="inspection-particle" r="5"><animateMotion dur="4.5s" repeatCount="indefinite" path="M55 248 C120 88 188 275 260 126 S400 76 465 178"/></circle></svg><span className="visual-status">PASS / VALIDATED / HAND-OFFS CLEAR</span></div></div><div className="flow-map" data-reveal><div className="flow-track"><i/></div>{[["01","OFSC","Activity source"],["02","DISPATCH","Technician workflow"],["03","JEP / TRIAGE","Exception handling"],["04","PEGA CRM","Case + work order"],["05","NOC / TSD","Status sync"]].map(([n,title,caption])=><div className="flow-node" key={n}><span className="flow-dot"><Check size={12}/></span><small>{n}</small><b>{title}</b><span>{caption}</span></div>)}</div><div className="flow-note"><span>WHAT I CHECK</span><b>HAND-OFFS</b><b>EDGE CASES</b><b>STATUS ACCURACY</b><b>REGRESSION</b></div></div></section>

    <section className="work chapter-section" id="work"><div className="content-wrap"><div className="section-head light" data-reveal><div className="chapter-tag">04 / SELECTED WORK</div><p>REAL SYSTEMS. ABSTRACT VISUALS.<br/>NO CONFIDENTIAL SCREENSHOTS.</p></div><div className="work-intro"><h2 className="work-title" data-reveal>Work that<br/><em>keeps moving.</em></h2><div className="automation-visual" data-reveal aria-label="Abstract continuous QA automation loop"><span className="visual-kicker">CONTINUOUS AUTOMATION / LOOP</span><svg viewBox="0 0 460 300" role="img" aria-hidden="true"><path className="automation-path" d="M230 34 C355 34 410 86 410 150 C410 220 345 266 230 266 C115 266 50 220 50 150 C50 86 105 34 230 34Z"/><path className="automation-path inner" d="M230 78 C314 78 355 107 355 150 C355 194 310 222 230 222 C150 222 105 194 105 150 C105 107 146 78 230 78Z"/><circle className="automation-particle" r="5"><animateMotion dur="5s" repeatCount="indefinite" path="M230 34 C355 34 410 86 410 150 C410 220 345 266 230 266 C115 266 50 220 50 150 C50 86 105 34 230 34Z"/></circle><g className="automation-labels"><text x="230" y="28">TEST</text><text x="388" y="154">AUTOMATE</text><text x="230" y="286">RELEASE</text><text x="49" y="154">REGRESSION</text></g><g className="automation-nodes"><circle cx="230" cy="34" r="8"/><circle cx="410" cy="150" r="8"/><circle cx="230" cy="266" r="8"/><circle cx="50" cy="150" r="8"/></g></svg><span className="visual-status">TEST → AUTOMATE → VALIDATE → RELEASE</span></div></div>
      <article className="project-card" data-reveal><div className="project-top"><span>CASE 01 / 02</span><span>TELECOM · FIELD SERVICE · PEGA CRM</span></div><div className="project-body"><div><h3>Dispatch<br/><em>{portfolio.projects[0].accent}</em></h3><p>{portfolio.projects[0].description}</p><a href="#systems" onClick={(e)=>{e.preventDefault();goTo("systems")}}>TRACE THE WORKFLOW <ArrowUpRight size={15}/></a></div><div className="project-graphic dispatch-graphic"><span className="graphic-kicker">WORK ORDER / SYNC PATH</span><div className="graphic-ring ring-one"/><div className="graphic-ring ring-two"/><div className="graphic-node n1">OFSC</div><div className="graphic-node n2">JEP</div><div className="graphic-node n3">CRM</div><div className="graphic-datapoint"/><div className="graphic-bottom">VALIDATION / 05 CHECKPOINTS</div></div></div><div className="project-meta"><span>{portfolio.projects[0].client}</span><span>{portfolio.projects[0].duration}</span><span>{portfolio.projects[0].role}</span><span>{portfolio.projects[0].responsibilities}</span></div></article>
      <article className="project-card second" data-reveal><div className="project-top"><span>CASE 02 / 02</span><span>WEB APP · SERVICE OPERATIONS</span></div><div className="project-body"><div><h3>Ticketing<br/><em>{portfolio.projects[1].accent}</em></h3><p>{portfolio.projects[1].description}</p><span className="project-context">{portfolio.projects[1].client} / {portfolio.projects[1].role} / {portfolio.projects[1].duration}</span></div><div className="ticket-flow"><span className="graphic-kicker">TICKET LIFECYCLE / CHECKPOINTS</span>{["NEW","ASSIGNED","IN PROGRESS","ESCALATED","RESOLVED"].map((s,i)=><div className="ticket-stage" key={s}><small>0{i+1}</small><b>{s}</b><span className={i<3?"checked":""}>{i<3?<Check size={12}/>:"·"}</span></div>)}</div></div><div className="project-meta"><span>{portfolio.projects[1].responsibilities}</span><span>{portfolio.projects[1].workflow}</span></div></article>
    </div></section>

    <section className="toolkit chapter-section" id="toolkit"><div className="content-wrap"><div className="section-head" data-reveal><div className="chapter-tag">05 / HOW I WORK</div><p>TOOLS FOLLOW THE QUESTION.<br/>NOT THE OTHER WAY AROUND.</p></div><div className="tool-layout"><div className="tool-intro" data-reveal><h2>A practical<br/><em>toolkit.</em></h2><p>Select a tool to see where it fits in my work.</p><div className="selected-tool"><small>0{activeSkill+1} / CURRENTLY SELECTED</small><b>{skill[0]}</b><span>{skill[1]}</span></div></div><div className="tool-list" data-reveal>{portfolio.skills.map(([name],i)=><button className={activeSkill===i?"selected":""} key={name} onClick={()=>setActiveSkill(i)}><small>0{i+1}</small><b>{name}</b><ArrowUpRight size={16}/></button>)}</div></div><div className="experience-row" data-reveal><div className="chapter-tag">THE PATH SO FAR</div>{portfolio.experienceEntries.map((entry)=><div className="experience-entry" key={entry.year}><span>{entry.year}</span><div><b>{entry.role}</b><p>{entry.detail}</p></div></div>)}<div className="education-entry"><span>FOUNDATION</span><p>{portfolio.education}<br/>{portfolio.certifications}</p></div></div></div></section>

    <section className="contact chapter-section" id="contact"><div className="contact-sun"/><div className="content-wrap contact-wrap"><div className="chapter-tag" data-reveal>06 / LET’S CONNECT</div><h2 data-reveal>Let’s make<br/>the next release<br/><em>feel certain.</em></h2><p data-reveal>If you’re working through a quality problem, an integration, or a tricky release, I’d be glad to talk.</p><div className="contact-links" data-reveal><a href={`mailto:${portfolio.contact.email}`} className="email-cta"><Mail size={17}/> EMAIL SANJAY <ArrowRight size={17}/></a><a href={portfolio.contact.linkedin} target="_blank" rel="noreferrer">LINKEDIN <ArrowUpRight size={15}/></a><button onClick={copyEmail}>{copied?<Check size={15}/>:<Copy size={15}/>} {copied?"COPIED":"COPY EMAIL"}</button></div><footer><span>SBV® / QA AUTOMATION ENGINEER</span><span>BUILT AROUND QUALITY / 2026</span><a className="admin-access" href="/admin">ADMIN</a><button onClick={()=>goTo("opening")}>BACK TO TOP ↑</button></footer></div></section>
    <div className="cursor-orb" ref={cursorRef} aria-hidden="true"><span/><i/></div>
    {adminOpen && <div className="admin-overlay" role="dialog" aria-modal="true" aria-label="SBV Admin"><button className="admin-overlay-close" onClick={()=>setAdminOpen(false)}>CLOSE <X size={15}/></button><div className="admin-overlay-panel"><iframe title="SBV Admin" src="/admin/" /></div></div>}
  </main>;
}
