import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import L from "leaflet";
import {
  ArrowRight, MapPin, ShieldCheck, Wrench, Truck, Search, Menu, X,
  Navigation, Phone, Clock3, CheckCircle2, AlertTriangle, CarFront,
  PackageSearch, UserRound, ChevronRight, WifiOff, LocateFixed, Mic, Zap
} from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const smsNumber = import.meta.env.VITE_DISPATCH_SMS_NUMBER || "+2348000000000";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState("Location not captured yet");
  const [locating, setLocating] = useState(false);
  const [sosState, setSosState] = useState("idle");
  const [countdown, setCountdown] = useState(5);
  const [issue, setIssue] = useState("Breakdown");
  const [vehicle, setVehicle] = useState("");
  const [phone, setPhone] = useState("");
  const [notice, setNotice] = useState("");
  const [requestId, setRequestId] = useState("");
  const [mapReady, setMapReady] = useState(false);

  const services = [
    { icon: Truck, title: "Roadside rescue", desc: "Get help when your car breaks down, overheats or refuses to start.", tag: "Emergency help", href: "#rescue" },
    { icon: Wrench, title: "Find a mechanic", desc: "Connect with a mechanic by craft, location and availability.", tag: "Verified providers", href: "#mechanics" },
    { icon: PackageSearch, title: "Find spare parts", desc: "Request difficult-to-find parts and get help sourcing them.", tag: "Part finder", href: "#parts" },
    { icon: CarFront, title: "Towing assistance", desc: "Request a tow when your vehicle cannot safely continue.", tag: "Vehicle recovery", href: "#rescue" }
  ];

  const captureLocation = () => {
    setNotice("");
    if (!navigator.geolocation) {
      setNotice("This browser does not support GPS location. You can still enter your location when requesting help.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        setLocation(point);
        setLocationLabel(`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
        setLocating(false);
        setNotice("Your location is ready to attach to a request.");
      },
      () => {
        setLocating(false);
        setNotice("We couldn't access your location. Check your browser permission or use SMS with your location.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    if (!location || !document.getElementById("map")) return;
    const map = L.map("map", { zoomControl: false, scrollWheelZoom: false }).setView([location.lat, location.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.marker([location.lat, location.lng]).addTo(map).bindPopup("Your shared location").openPopup();
    setMapReady(true);
    return () => map.remove();
  }, [location]);

  useEffect(() => {
    if (sosState !== "counting") return;
    if (countdown <= 0) {
      dispatchRequest();
      return;
    }
    const timer = setTimeout(() => setCountdown(v => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [sosState, countdown]);

  const startSOS = () => {
    if (!location) {
      setNotice("Capture your GPS location first so responders know where to find you.");
      captureLocation();
      return;
    }
    setCountdown(5);
    setSosState("counting");
    setNotice("SOS will be sent in 5 seconds. Cancel if this was accidental.");
  };
  const cancelSOS = () => {
    setSosState("idle");
    setCountdown(5);
    setNotice("SOS cancelled. No request was sent.");
  };

  async function dispatchRequest() {
    setSosState("sending");
    const payload = {
      issue_type: issue, vehicle_details: vehicle || null, phone: phone || null,
      latitude: location?.lat, longitude: location?.lng, status: "waiting",
      created_at: new Date().toISOString()
    };
    try {
      if (supabase) {
        const { data, error } = await supabase.from("rescue_requests").insert(payload).select("id").single();
        if (error) throw error;
        setRequestId(data.id);
        setSosState("sent");
        setNotice("Your request has been submitted. A dispatcher will need to confirm a responder.");
      } else {
        const localId = `AR-${Date.now().toString().slice(-6)}`;
        setRequestId(localId);
        setSosState("sent");
        setNotice("Demo request created on this device only. Connect Supabase before accepting real emergencies.");
      }
    } catch (e) {
      setSosState("idle");
      setNotice("We couldn't submit the request online. Use the SMS fallback below or call your local emergency contact.");
    }
  }

  const sendSMSFallback = () => {
    const coords = location ? `${location.lat}, ${location.lng}` : "GPS unavailable";
    const body = `AUTORELIEF SOS. I need roadside assistance. Issue: ${issue}. Vehicle: ${vehicle || "Not provided"}. Location: ${coords}. Phone: ${phone || "Not provided"}.`;
    window.location.href = `sms:${smsNumber}?body=${encodeURIComponent(body)}`;
  };

  const startVoiceSOS = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) { setNotice("Voice activation is not supported in this browser. Use the SOS button instead."); return; }
    const recognition = new Speech();
    recognition.lang = "en-NG";
    recognition.continuous = false;
    recognition.onresult = e => {
      const spoken = e.results?.[0]?.[0]?.transcript?.toLowerCase() || "";
      if (spoken.includes("help") || spoken.includes("emergency")) startSOS();
      else setNotice(`Heard: “${spoken}”. Say “Help” or use the SOS button.`);
    };
    recognition.onerror = () => setNotice("Voice recognition stopped. Please use the SOS button.");
    recognition.start();
    setNotice("Listening briefly for “Help”. Voice activation is experimental; it does not dispatch until the countdown completes.");
  };

  const submitProvider = async (e) => {
    e.preventDefault();
    setNotice("Provider registration is a prototype form. Connect Supabase and add identity verification before accepting applications.");
  };

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark"><Zap size={21} fill="currentColor"/></span><span>Auto<span>Relief</span><small>ROAD SUPPORT, REIMAGINED</small></span></a>
        <nav className={menuOpen ? "nav nav-open" : "nav"}>
          <a href="#services" onClick={() => setMenuOpen(false)}>Our services</a>
          <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#providers" onClick={() => setMenuOpen(false)}>For providers</a>
          <a href="#safety" onClick={() => setMenuOpen(false)}>Safety</a>
        </nav>
        <div className="nav-actions"><a className="nav-call" href="tel:+2348000000000"><Phone size={15}/> Get support</a><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X/> : <Menu/>}</button></div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse-dot"></span> LAGOS PILOT • BUILT FOR THE UNEXPECTED</div>
            <h1>When the road<br/>lets you down,<br/><em>we show up.</em></h1>
            <p className="hero-lede">Reliable roadside help, trusted mechanics and hard-to-find car parts — all in one place.</p>
            <div className="hero-buttons"><a className="btn btn-primary" href="#rescue">Get roadside help <ArrowRight size={17}/></a><a className="btn btn-quiet" href="#services">Explore services <ChevronRight size={17}/></a></div>
            <div className="hero-trust"><span><ShieldCheck size={17}/> Provider verification planned</span><span><MapPin size={17}/> Starting in Lagos</span></div>
          </div>
          <div className="hero-art">
            <div className="hero-orbit orbit-one"></div><div className="hero-orbit orbit-two"></div>
            <div className="hero-car"><div className="car-glow"></div><CarFront size={190} strokeWidth={1.05}/></div>
            <div className="float-card card-top"><span className="float-icon"><MapPin size={17}/></span><span><b>Location first</b><small>Share your GPS in one tap</small></span></div>
            <div className="float-card card-bottom"><span className="float-icon orange"><Wrench size={17}/></span><span><b>Help is on the way</b><small>Human-led dispatch</small></span><span className="live-dot"></span></div>
            <div className="hero-stamp">YOUR<br/>ROAD<br/>PARTNER</div>
          </div>
        </section>

        <section className="quick-strip">
          <div><span className="strip-icon"><Clock3/></span><span><b>Simple when it matters</b><small>Low-friction help request</small></span></div>
          <div><span className="strip-icon"><LocateFixed/></span><span><b>Location-aware</b><small>GPS-enabled requests</small></span></div>
          <div><span className="strip-icon"><ShieldCheck/></span><span><b>Safety-led</b><small>Human dispatcher oversight</small></span></div>
        </section>

        <section className="section services-section" id="services">
          <div className="section-head"><div><div className="eyebrow dark-eyebrow">ONE PLATFORM. MORE PEACE OF MIND.</div><h2>Whatever the car needs,<br/><em>start here.</em></h2></div><p>From a sudden breakdown to a part you have searched everywhere for, AutoRelief helps you take the next step.</p></div>
          <div className="service-grid">{services.map((s, i) => <a className="service-card" href={s.href} key={s.title}><div className="service-top"><span className="service-icon"><s.icon size={23}/></span><span className="service-number">0{i+1}</span></div><div className="service-tag">{s.tag}</div><h3>{s.title}</h3><p>{s.desc}</p><span className="service-link">Explore service <ArrowRight size={16}/></span></a>)}</div>
        </section>

        <section className="rescue-section" id="rescue">
          <div className="rescue-copy"><div className="eyebrow light-eyebrow">NEED HELP RIGHT NOW?</div><h2>One tap to start.<br/><em>Help without the hassle.</em></h2><p>Share your location, tell us what happened and send a request. A real dispatcher should review and coordinate the response.</p><ul className="rescue-points"><li><CheckCircle2/> GPS location attached to your request</li><li><CheckCircle2/> Five-second cancellation window</li><li><CheckCircle2/> SMS fallback if mobile data fails</li></ul><div className="rescue-note"><AlertTriangle size={16}/> This prototype is not connected to a live dispatch centre. Do not rely on it for emergencies.</div></div>
          <div className="sos-panel">
            <div className="panel-heading"><div><span className="panel-kicker">ROADSIDE ASSISTANCE</span><h3>Request emergency help</h3></div><span className="secure-pill"><ShieldCheck size={14}/> Secure flow</span></div>
            <div className="location-box"><div className="location-icon"><MapPin/></div><div className="location-text"><b>Your current location</b><small>{locationLabel}</small></div><button className="locate-btn" onClick={captureLocation} disabled={locating}>{locating ? "Locating…" : "Capture GPS"}</button></div>
            {location && <div id="map" className="map-box" aria-label="Map showing your current location"></div>}
            <label className="field-label" htmlFor="issue">What happened?</label><select id="issue" value={issue} onChange={e=>setIssue(e.target.value)}><option>Breakdown</option><option>Flat tyre</option><option>Battery / won't start</option><option>Overheating</option><option>Accident / recovery</option><option>Need towing</option><option>Other</option></select>
            <div className="field-row"><div><label className="field-label" htmlFor="vehicle">Vehicle (optional)</label><input id="vehicle" value={vehicle} onChange={e=>setVehicle(e.target.value)} placeholder="e.g. Toyota Corolla 2010"/></div><div><label className="field-label" htmlFor="phone">Phone number</label><input id="phone" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+234…" inputMode="tel"/></div></div>
            {notice && <div className="notice" role="status">{notice}</div>}
            {sosState === "counting" ? <div className="countdown-wrap"><div className="countdown-number">{countdown}</div><div><b>Sending your SOS shortly</b><small>Cancel now if this was accidental.</small></div><button className="cancel-btn" onClick={cancelSOS}>Cancel</button></div> :
             sosState === "sent" ? <div className="sent-state"><CheckCircle2 size={22}/><span><b>Request recorded</b><small>Reference: {requestId} · Demo / pending dispatcher integration</small></span></div> :
             <button className="sos-button" onClick={startSOS} disabled={sosState==="sending"}><span className="sos-pulse"></span><span>{sosState==="sending" ? "Sending request…" : "HOLD ON — REQUEST HELP"}</span><ArrowRight size={18}/></button>}
            <div className="panel-bottom"><button onClick={sendSMSFallback}><MessageIcon/> Use SMS fallback</button><button onClick={startVoiceSOS}><Mic size={15}/> Try voice “Help”</button></div>
            <p className="tiny-disclaimer">GPS is shared only when you request help. Exact location retention must be configured on the live backend.</p>
          </div>
        </section>

        <section className="section how-section" id="how"><div className="section-head"><div><div className="eyebrow dark-eyebrow">NO LONG FORMS. NO GUESSWORK.</div><h2>Help, in <em>three steps.</em></h2></div><p>Designed for stressful roadside moments, with clear actions and as little typing as possible.</p></div>
          <div className="steps"><div className="step"><span>01</span><div className="step-icon"><LocateFixed/></div><h3>Share your location</h3><p>Tap once to capture your GPS coordinates. You can also use the SMS fallback.</p></div><div className="step"><span>02</span><div className="step-icon"><AlertTriangle/></div><h3>Tell us what happened</h3><p>Choose the issue, add your vehicle details if you can, then send your request.</p></div><div className="step"><span>03</span><div className="step-icon"><Truck/></div><h3>Dispatcher coordinates help</h3><p>A human dispatcher reviews the request and assigns an available, suitable provider.</p></div></div>
        </section>

        <section className="provider-section" id="providers"><div className="provider-copy"><div className="eyebrow light-eyebrow">FOR THE PEOPLE WHO KEEP LAGOS MOVING</div><h2>Are you a mechanic,<br/>tow operator or parts<br/><em>specialist?</em></h2><p>Join the AutoRelief provider network. Register your craft, service area and availability so drivers can find the right help.</p><a className="btn btn-light" href="#provider-form">Become a provider <ArrowRight size={17}/></a></div>
          <form className="provider-form" id="provider-form" onSubmit={submitProvider}><div className="form-title"><span className="service-icon"><UserRound/></span><div><h3>Provider interest form</h3><small>Start your registration</small></div></div><label className="field-label">Your name<input required placeholder="Full name"/></label><label className="field-label">Phone number<input required inputMode="tel" placeholder="+234…"/></label><label className="field-label">Your craft<select><option>Mechanic</option><option>Auto electrician</option><option>Tyre specialist</option><option>Towing / recovery</option><option>Spare parts dealer</option><option>Panel beater</option><option>Other</option></select></label><label className="field-label">Area you serve<input placeholder="e.g. Gbagada, Lagos"/></label><button className="btn btn-primary full-btn" type="submit">Submit interest <ArrowRight size={17}/></button><small className="form-foot">Identity and credential checks must be completed before activation.</small></form>
        </section>

        <section className="section parts-section" id="parts"><div className="parts-card"><div><div className="eyebrow dark-eyebrow">THE PART YOU CAN'T FIND?</div><h2>Let’s track it <em>down.</em></h2><p>Tell us the vehicle, part name and location. AutoRelief is designed to help source hard-to-find spare parts from trusted sellers.</p><a className="btn btn-primary" href="mailto:hello@autorelief.ng?subject=Spare%20part%20request">Request a part <ArrowRight size={17}/></a></div><div className="parts-visual"><div className="parts-ring"></div><PackageSearch size={105} strokeWidth={1}/><span className="parts-chip">PART FINDER</span></div></div></section>

        <section className="section safety-section" id="safety"><div className="section-head"><div><div className="eyebrow dark-eyebrow">BUILT AROUND TRUST</div><h2>Safety is not<br/><em>an add-on.</em></h2></div><p>AutoRelief is being designed with privacy, accountability and responsible dispatch at its core.</p></div><div className="safety-grid"><div><ShieldCheck/><h3>Verified providers</h3><p>Mechanic identity and credentials should be reviewed before provider activation, with OCR-assisted document capture and human approval.</p></div><div><MapPin/><h3>Location privacy</h3><p>Use precise location only for an active request. The live backend should automatically expire location records after the session.</p></div><div><Zap/><h3>Abuse protection</h3><p>Rate-limit SOS requests, detect duplicate accounts and flag unusual payment patterns for review.</p></div><div><WifiOff/><h3>Low-connectivity fallback</h3><p>Keep the core page lightweight and offer a prefilled SMS containing the request and GPS coordinates when data is unavailable.</p></div></div></section>

        <section className="final-cta"><div><div className="eyebrow light-eyebrow">THE ROAD IS UNPREDICTABLE. HELP SHOULDN'T BE.</div><h2>Drive with a little<br/><em>more peace of mind.</em></h2></div><a className="btn btn-light" href="#rescue">Get started <ArrowRight size={17}/></a></section>
      </main>

      <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><Zap size={20} fill="currentColor"/></span><span>Auto<span>Relief</span><small>RELIABLE HELP. WHEREVER THE ROAD TAKES YOU.</small></span></a><div className="footer-links"><a href="#services">Services</a><a href="#providers">Join as provider</a><a href="#safety">Safety & privacy</a><a href="mailto:hello@autorelief.ng">Contact</a></div><small className="copyright">© {new Date().getFullYear()} AutoRelief. Lagos, Nigeria.</small></footer>
    </div>
  );
}

function MessageIcon(){ return <Phone size={15}/>; }
export default App;
