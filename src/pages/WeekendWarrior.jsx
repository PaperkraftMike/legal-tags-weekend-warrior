import { useState, useEffect, useRef } from 'react';

export default function WeekendWarrior() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    customerType: '',
    coupon: '',
    vehicleType: '',
    truckSize: '',
    vehicleAge: '',
    financing: '',
    importDocs: '',
    hasTitle: '',
    isSalvage: '',
    salvageClassification: '',
    salvageTempTag: '',
    physicalInspection: '',
    fullName: '',
    email: '',
    phone: '',
    termsAgreed: true
  });
  const [flashingOption, setFlashingOption] = useState(null);
  const [visitorCount, setVisitorCount] = useState(18);
  const [stepHistory, setStepHistory] = useState([0]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastIndex, setToastIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [showAnalyzing, setShowAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [timeToExpiry, setTimeToExpiry] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [offerExpired, setOfferExpired] = useState(false);
  const pendingRedirect = useRef(null);

  const clarityEvent = (name, data) => {
    if (window.clarity) {
      if (data) {
        window.clarity('set', name, typeof data === 'object' ? JSON.stringify(data) : String(data));
      }
      window.clarity('event', name);
    }
  };

  // Weekend gate: Friday 5 PM through Sunday 11:59 PM local
  // ?preview=true bypasses time gate for testing
  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';

  useEffect(() => {
    const calcExpiry = () => {
      const now = new Date();
      const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat

      // Weekend window: Friday 5 PM (17:00) through Sunday 23:59:59
      const isFridayEvening = day === 5 && now.getHours() >= 17;
      const isSaturday = day === 6;
      const isSunday = day === 0;

      if (!isFridayEvening && !isSaturday && !isSunday) {
        if (!isPreview) { setOfferExpired(true); return; }
        // Preview mode: fake 36 hours remaining
        setOfferExpired(false);
        setTimeToExpiry({ hours: 35, minutes: 59, seconds: 59 });
        return;
      }

      setOfferExpired(false);

      // Target: Sunday 23:59:59
      let target = new Date(now);
      if (day === 0) {
        // Already Sunday — expires end of today
        target.setHours(23, 59, 59, 0);
      } else if (day === 6) {
        // Saturday — expires end of tomorrow (Sunday)
        target.setDate(target.getDate() + 1);
        target.setHours(23, 59, 59, 0);
      } else if (day === 5) {
        // Friday evening — expires end of Sunday
        target.setDate(target.getDate() + 2);
        target.setHours(23, 59, 59, 0);
      }

      const diff = target - now;
      if (diff <= 0) {
        setOfferExpired(true);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeToExpiry({ hours: h, minutes: m, seconds: s });
    };

    calcExpiry();
    const interval = setInterval(calcExpiry, 1000);
    return () => clearInterval(interval);
  }, []);

  const [utmParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
    const fromUrl = {};
    let hasNewParams = false;
    keys.forEach(k => {
      const val = params.get(k) || '';
      fromUrl[k] = val;
      if (val) hasNewParams = true;
    });
    if (hasNewParams) {
      try { localStorage.setItem('legalTagsUtm', JSON.stringify(fromUrl)); } catch(e) {}
      return fromUrl;
    }
    try {
      const saved = localStorage.getItem('legalTagsUtm');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '', fbclid: '', gclid: '' };
  });

  const [eventId] = useState(() => {
    try {
      const stored = localStorage.getItem('legalTagsEventId');
      if (stored) return stored;
    } catch(e) {}
    const id = crypto.randomUUID();
    try { localStorage.setItem('legalTagsEventId', id); } catch(e) {}
    return id;
  });

  const socialProofItems = [
    { name: 'James T.', state: 'CA', time: '2 min ago' },
    { name: 'Lisa P.', state: 'FL', time: '5 min ago' },
    { name: 'Robert K.', state: 'TX', time: '8 min ago' },
    { name: 'Amanda L.', state: 'NY', time: '10 min ago' },
    { name: 'Steve H.', state: 'AZ', time: '13 min ago' },
    { name: 'Karen W.', state: 'NJ', time: '16 min ago' },
    { name: 'Tom B.', state: 'WA', time: '20 min ago' },
    { name: 'Michelle G.', state: 'CT', time: '24 min ago' },
  ];

  // ============================================================
  // STEP DEFINITIONS — identical to main funnel
  // ============================================================
  const getNextStep = (currentStep, data) => {
    const d = data || formData;
    switch (currentStep) {
      case 0:
        if (d.customerType === 'individual') return 2;
        return 1;
      case 1:
        if (d.coupon === 'volume') return 11;
        return 2;
      case 2: {
        const vt = d.vehicleType;
        if (vt === 'truck') return 3;
        if (vt === 'car' || vt === 'motorcycle') return 4;
        if (vt === 'lowspeed') return 11;
        if (vt === 'temptag') return 11;
        return 5;
      }
      case 3: return 4;
      case 4: return 5;
      case 5:
        if (d.financing === 'yes') return 11;
        return 6;
      case 6: return 7;
      case 7:
        if (d.isSalvage === 'no') return 11;
        return 8;
      case 8:
        if (d.salvageClassification === 'rebuilt') return 10;
        return 9;
      case 9: return 11;
      case 10: return 11;
      default: return 11;
    }
  };

  // ============================================================
  // REDIRECT URL LOGIC — identical to main funnel
  // ============================================================
  const getRedirectUrl = () => {
    const d = formData;
    if (d.financing === 'yes') return '/registration-south-dakota';
    if (d.customerType === 'dealer' && d.coupon === 'volume') return '/dealer';
    if (d.customerType === 'collector' && d.coupon === 'volume') return '/collector';
    if (d.vehicleType === 'temptag') return '/temp-tag';
    if (d.vehicleType === 'lowspeed') return '/registration-ebike';
    if (d.isSalvage === 'yes' && d.salvageClassification !== 'rebuilt') return '/temp-tag';
    const isSalvageRebuilt = d.isSalvage === 'yes' && d.salvageClassification === 'rebuilt';
    const hasTitle = d.hasTitle === 'yes';
    const age = d.vehicleAge;
    const isNewer = age === '2016+';
    const isMid = age === '1997-2015';
    const isClassic = age === '1996-';
    const isHeavyTruck = d.truckSize === 'yes';

    switch (d.vehicleType) {
      case 'car': {
        if (isNewer && hasTitle) return '/registration-car-newer';
        if (isNewer && !hasTitle) return '/retitle-car-newer';
        if (!isNewer && hasTitle) return '/registration-car-older';
        if (isMid && !hasTitle) return '/retitle-car-mid';
        if (isClassic && !hasTitle) return '/retitle-car-classic';
        if (isSalvageRebuilt) {
          if (isNewer && hasTitle) return '/registration-car-newer';
          if (isNewer && !hasTitle) return '/retitle-car-newer';
          if (hasTitle) return '/registration-car-older';
          if (isClassic) return '/retitle-car-classic';
        }
        return '/registration-car-newer';
      }
      case 'truck': {
        if (isHeavyTruck) {
          if (hasTitle) return '/registration-heavy-truck';
          return '/retitle-heavy-truck';
        }
        if (isNewer && hasTitle) return '/registration-truck-newer';
        if (!isNewer && hasTitle) return '/registration-truck-older';
        if (isNewer && !hasTitle) return '/retitle-truck-newer';
        if (isMid && !hasTitle) return '/retitle-truck-mid';
        if (isClassic && !hasTitle) return '/retitle-truck-classic';
        return '/registration-truck-newer';
      }
      case 'motorcycle': {
        if (hasTitle) return '/registration-motorcycle';
        if (isClassic && !hasTitle) return '/retitle-motorcycle-classic';
        if (!hasTitle) return '/retitle-motorcycle';
        return '/registration-motorcycle';
      }
      case 'trailer': return hasTitle ? '/registration-trailer' : '/retitle-trailer';
      case 'rv': return hasTitle ? '/registration-rv' : '/retitle-rv';
      case 'boat': return hasTitle ? '/registration-boat' : '/retitle-boat';
      case 'offroad': return hasTitle ? '/registration-off-road' : '/retitle-off-road';
      case 'semi': return hasTitle ? '/registration-semi' : '/retitle-semi';
      case 'military':
        if (hasTitle) return '/registration-military';
        if (!hasTitle && isSalvageRebuilt) return '/retitle-semi';
        return '/retitle-military';
      case 'import':
        if (d.importDocs === 'yes') return '/registration-import';
        return '/retitle-import';
      default: return '/registration-car-newer';
    }
  };

  // ============================================================
  // NAVIGATION
  // ============================================================
  const stepNames = {
    0: 'customer_type', 1: 'coupon_type', 2: 'vehicle_type', 3: 'truck_size',
    4: 'vehicle_age', 5: 'financing', 6: 'title_status', 7: 'salvage_status',
    8: 'salvage_classification', 9: 'salvage_temp_tag', 10: 'physical_inspection', 11: 'contact_info'
  };

  const navigateToStep = (targetStep) => {
    setStepHistory(prev => [...prev, targetStep]);
    setStep(targetStep);
    clarityEvent(`weekend_warrior_step_${stepNames[targetStep] || targetStep}`);
  };

  const handleNext = () => navigateToStep(getNextStep(step, formData));

  const handlePrev = () => {
    if (stepHistory.length > 1) {
      const fromStep = step;
      const newHistory = [...stepHistory];
      newHistory.pop();
      const toStep = newHistory[newHistory.length - 1];
      setStepHistory(newHistory);
      setStep(toStep);
      clarityEvent('weekend_warrior_back', `${stepNames[fromStep]}_to_${stepNames[toStep]}`);
    }
  };

  const handleRadioSelect = (field, value) => {
    if (!hasInteracted) { setHasInteracted(true); clarityEvent('weekend_warrior_survey_started'); }
    clarityEvent(`weekend_warrior_answer_${field}`, value);
    setFlashingOption(`${field}-${value}`);
    const newData = {...formData, [field]: value};
    setFormData(newData);
    setTimeout(() => {
      setFlashingOption(null);
      navigateToStep(getNextStep(step, newData));
    }, 120);
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => phone.replace(/\D/g, '').length >= 10;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    const nameParts = formData.fullName.trim().split(/\s+/);
    if (nameParts.length < 2 || nameParts[1].length === 0) errors.fullName = 'Please enter your first and last name';
    if (!isValidEmail(formData.email)) errors.email = 'Please enter a valid email address';
    if (!isValidPhone(formData.phone)) errors.phone = 'Please enter a valid 10-digit phone number';
    if (Object.keys(errors).length > 0) { setValidationErrors(errors); return; }
    setValidationErrors({});

    localStorage.setItem('legalTagsContact', JSON.stringify({ ...formData }));
    const redirectUrl = getRedirectUrl();
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // GHL Webhook
    fetch('https://services.leadconnectorhq.com/hooks/FJXRNO2Viulnk7Lv8orW/webhook-trigger/6dae9f7d-a0ed-4970-a145-fc0aee2e7840', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName, last_name: lastName,
        email: formData.email, phone: formData.phone.replace(/\D/g, ''),
        customer_type: formData.customerType, vehicle_type: formData.vehicleType,
        vehicle_age: formData.vehicleAge, truck_size: formData.truckSize,
        has_title: formData.hasTitle, financing: formData.financing,
        is_salvage: formData.isSalvage, salvage_classification: formData.salvageClassification,
        import_docs: formData.importDocs, coupon: formData.coupon,
        checkout_url: redirectUrl,
        utm_source: utmParams.utm_source, utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign, utm_content: utmParams.utm_content,
        utm_term: utmParams.utm_term, fbclid: utmParams.fbclid, gclid: utmParams.gclid,
        source: 'legaltags_weekend_warrior',
        offer_type: 'weekend_free_temptag',
        event_id: eventId,
        submitted_at: new Date().toISOString(),
        submitted_at_unix: Math.floor(Date.now() / 1000)
      })
    }).catch(() => {});

    clarityEvent('weekend_warrior_survey_complete', {
      vehicle_type: formData.vehicleType, has_title: formData.hasTitle,
      vehicle_age: formData.vehicleAge, checkout_destination: redirectUrl
    });

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'AddToCart', {
        content_name: formData.vehicleType,
        content_category: formData.hasTitle === 'yes' ? 'Registration' : 'Retitle',
        content_ids: [redirectUrl], content_type: 'product', currency: 'USD',
      }, { eventID: eventId + '_atc' });
    }

    pendingRedirect.current = redirectUrl;
    setShowAnalyzing(true);
    setAnalyzingStep(0);
    setAnalyzingProgress(0);
    setTimeout(() => setAnalyzingStep(1), 500);
    setTimeout(() => setAnalyzingStep(2), 1200);
    setTimeout(() => setAnalyzingStep(3), 1900);
    setTimeout(() => setAnalyzingStep(4), 2400);
    setTimeout(() => { window.location.href = pendingRedirect.current; }, 2800);

    let start = null;
    const duration = 2600;
    const animateProgress = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      setAnalyzingProgress(Math.min(100, (elapsed / duration) * 100));
      if (elapsed < duration) requestAnimationFrame(animateProgress);
    };
    requestAnimationFrame(animateProgress);
  };

  const canProceed = () => {
    switch(step) {
      case 0: return formData.customerType !== '';
      case 1: return formData.coupon !== '';
      case 2: return formData.vehicleType !== '';
      case 3: return formData.truckSize !== '';
      case 4: return formData.vehicleAge !== '';
      case 5: return formData.financing !== '';
      case 6: return formData.vehicleType === 'import' ? formData.importDocs !== '' : formData.hasTitle !== '';
      case 7: return formData.isSalvage !== '';
      case 8: return formData.salvageClassification !== '';
      case 9: return formData.salvageTempTag !== '';
      case 10: return formData.physicalInspection !== '';
      case 11: return formData.fullName.trim() !== '' && formData.email.trim() !== '' && formData.phone.trim() !== '' && formData.termsAgreed;
      default: return false;
    }
  };

  const getProgressPercent = () => Math.min(100, Math.round((stepHistory.length / 8) * 100));

  useEffect(() => {
    clarityEvent('weekend_warrior_page_view');
    const interval = setInterval(() => {
      setVisitorCount(prev => Math.max(10, Math.min(32, prev + Math.floor(Math.random() * 7) - 3)));
    }, 3000 + Math.random() * 2000);
    let toastTimeout;
    const showNextToast = () => {
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 4500);
      setToastIndex(prev => (prev + 1) % 8);
      toastTimeout = setTimeout(showNextToast, 18000 + Math.random() * 12000);
    };
    toastTimeout = setTimeout(showNextToast, 10000);
    return () => { clearInterval(interval); clearTimeout(toastTimeout); };
  }, []);

  const RadioOption = ({ field, value, selected, onChange, children }) => {
    const isFlashing = flashingOption === `${field}-${value}`;
    return (
      <button type="button" onClick={() => onChange(field, value)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
          padding: '16px 20px',
          background: isFlashing ? '#d97706' : selected ? '#fef3c7' : '#fffbeb',
          border: selected ? '2px solid #d97706' : '2px solid #e5d5a0',
          borderRadius: '8px', cursor: 'pointer',
          fontFamily: "'DM Mono', monospace", fontSize: '15px',
          color: isFlashing ? '#fff' : '#1a1a1a',
          textAlign: 'left', transition: 'all 0.15s ease',
          transform: isFlashing ? 'scale(1.02)' : 'scale(1)'
        }}>
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%',
          border: isFlashing ? '6px solid #fff' : selected ? '6px solid #d97706' : '2px solid #999',
          background: isFlashing ? '#d97706' : '#fff',
          flexShrink: 0, transition: 'all 0.15s ease'
        }} />
        {children}
      </button>
    );
  };

  const testimonials = [
    { name: 'Mike R.', location: 'California', text: 'Saved over $8,000 in sales tax on my RV. Legal Tags handled everything including the LLC setup. Plates arrived in 3 days!' },
    { name: 'Sarah T.', location: 'Texas', text: 'Had a car with no title that Texas said was impossible to register. Legal Tags got it done in 2 weeks. Amazing service.' },
    { name: 'James K.', location: 'Florida', text: 'The process was so simple. They set up my LLC, registered my boat, and I never had to leave my house. Highly recommend.' }
  ];

  const pad = (n) => String(n).padStart(2, '0');

  // ============================================================
  // OFFER EXPIRED STATE
  // ============================================================
  if (offerExpired) {
    return (
      <div style={{
        fontFamily: "'DM Mono', monospace", background: '#fdf6e3', minHeight: '100vh',
        color: '#1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '40px 20px', textAlign: 'center'
      }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Oswald:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>
        <div style={{ fontSize: '60px', marginBottom: '24px' }}>🏁</div>
        <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(28px, 7vw, 42px)', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
          The Weekend Warrior Deal Has Ended
        </h1>
        <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '16px', lineHeight: '1.7', color: '#666', maxWidth: '500px', marginBottom: '32px', fontStyle: 'italic' }}>
          The free Temp Tag bundle is only available Friday evening through Sunday. Come back this weekend!
        </p>
        <a href="https://legaltags.com/survey" style={{
          display: 'inline-block', background: '#d97706', color: '#fff', border: 'none',
          padding: '18px 40px', fontFamily: "'Oswald', sans-serif", fontWeight: '700',
          fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase',
          textDecoration: 'none', borderRadius: '4px'
        }}>
          Get $300 Off Now Instead →
        </a>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'DM Mono', monospace",
      background: '#fdf6e3',
      minHeight: '100vh',
      color: '#1a1a1a',
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Oswald:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .condensed { font-family: 'Oswald', sans-serif; }
        .serif { font-family: 'Libre Baskerville', serif; }
        .mono { font-family: 'DM Mono', monospace; }
        .stamp {
          display: inline-block; border: 3px solid #d97706; color: #d97706;
          padding: 6px 14px; font-family: 'Oswald', sans-serif; font-weight: 700;
          font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
          transform: rotate(-2deg); position: relative;
        }
        .stamp::before { content: ''; position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; border: 1px solid #d97706; opacity: 0.5; }
        .official-seal {
          width: 48px; height: 48px; border: 3px solid #92400e; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0;
        }
        .official-seal::before { content: ''; position: absolute; width: 58px; height: 58px; border: 1px dashed #92400e; border-radius: 50%; opacity: 0.5; }
        .form-input {
          background: #fffbeb; border: 2px solid #e5d5a0; padding: 16px 18px;
          font-size: 18px; font-family: 'DM Mono', monospace; width: 100%;
          color: #1a1a1a; transition: all 0.2s ease; border-radius: 8px; -webkit-appearance: none;
        }
        .form-input:focus { outline: none; border-color: #d97706; }
        .form-input::placeholder { color: #999; }
        select.form-input {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23d97706' stroke-width='2' fill='none'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px;
        }
        .striped-border { background: repeating-linear-gradient(-45deg, #92400e, #92400e 10px, #d97706 10px, #d97706 20px); height: 6px; }
        .btn-primary {
          background: #d97706; color: #fff; border: none; padding: 18px 32px;
          font-family: 'Oswald', sans-serif; font-weight: 700; font-size: 16px;
          letter-spacing: 2px; text-transform: uppercase; cursor: pointer;
          transition: all 0.2s ease; width: 100%; border-radius: 4px;
        }
        .btn-primary:hover { background: #b45309; }
        .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
        .check-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid #e5d5a0; }
        .check-item:last-child { border-bottom: none; }
        .checkmark { width: 24px; height: 24px; background: #d97706; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 2px; font-weight: 700; }
        .section { padding: 48px 20px; }
        .testimonial-card { background: #fff; border: 2px solid #e5d5a0; padding: 24px; border-radius: 8px; }
        .pulse-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
        .vehicle-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .vehicle-card {
          display: flex; flex-direction: column; align-items: center; padding: 12px 8px;
          background: #fffbeb; border: 2px solid #e5d5a0; border-radius: 8px; cursor: pointer;
          transition: all 0.15s ease; text-align: center; font-family: 'DM Mono', monospace;
        }
        .vehicle-card:hover { border-color: #d97706; }
        .vehicle-card.selected { border-color: #d97706; background: #fef3c7; }
        .vehicle-card.flashing { border-color: #d97706; background: #d97706; color: #fff; transform: scale(1.02); }
        .vehicle-card-label { font-family: 'Oswald', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 8px; line-height: 1.2; }
        .vehicle-card-emoji { font-size: 32px; }
        @media (min-width: 768px) {
          .section { padding: 80px 40px; }
          .process-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .testimonials-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .vehicle-grid { grid-template-columns: repeat(4, 1fr); }
          .social-proof-toast { bottom: 20px; left: 20px; }
        }
        .social-proof-toast {
          position: fixed; bottom: 12px; left: 12px; right: 12px; z-index: 90;
          background: #fff; border: 2px solid #d97706; border-radius: 10px;
          padding: 12px 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          transform: translateX(-120%); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; align-items: center; gap: 10px;
        }
        @media (min-width: 768px) { .social-proof-toast { max-width: 360px; right: auto; } }
        .social-proof-toast.visible { transform: translateX(0); }
        .toast-avatar {
          width: 36px; height: 36px; background: #d97706; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-family: 'Oswald', sans-serif; font-size: 14px; font-weight: 700; flex-shrink: 0;
        }
        .bonus-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #d97706, #b45309); color: #fff;
          padding: 8px 16px; border-radius: 20px;
          font-family: 'Oswald', sans-serif; font-size: 13px; font-weight: 700;
          letter-spacing: 1px; text-transform: uppercase;
        }
      `}</style>

      {/* Urgency Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #92400e, #78350f)',
        color: '#fff', padding: '10px 16px', textAlign: 'center',
        fontFamily: "'Oswald', sans-serif", fontSize: '13px', fontWeight: '600',
        letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        flexWrap: 'wrap'
      }}>
        <span>🏁 WEEKEND WARRIOR DEAL ENDS IN</span>
        <span style={{
          background: '#fff', color: '#92400e', padding: '3px 8px', borderRadius: '3px',
          fontWeight: '700', fontFamily: "'DM Mono', monospace", fontSize: '13px'
        }}>{pad(timeToExpiry.hours)}:{pad(timeToExpiry.minutes)}:{pad(timeToExpiry.seconds)}</span>
      </div>

      {/* Header */}
      <header style={{
        padding: '10px 20px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '2px solid #92400e', background: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="official-seal">
            <div className="condensed" style={{ fontSize: '8px', fontWeight: '700', color: '#92400e', textAlign: 'center', lineHeight: '1.2' }}>LEGAL<br/>TAGS</div>
          </div>
          <div className="condensed" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '2px' }}>LEGAL TAGS</div>
        </div>
        <a href="tel:406-510-0599" className="mono" onClick={() => clarityEvent('weekend_warrior_phone_click')} style={{ fontSize: '13px', color: '#d97706', textDecoration: 'none', fontWeight: '500' }}>📞 406-510-0599</a>
      </header>

      <div className="striped-border" />

      {/* Hero */}
      <section style={{ padding: '32px 20px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏁</div>
          <div className="stamp" style={{ marginBottom: '16px' }}>This Weekend Only</div>
          <h1 className="condensed" style={{
            fontSize: 'clamp(30px, 8vw, 48px)', fontWeight: '700', lineHeight: '0.95',
            letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px'
          }}>
            Weekend Warrior<br/><span style={{ color: '#d97706' }}>Free Temp Tag</span>
          </h1>
          <p className="serif" style={{ fontSize: '15px', lineHeight: '1.6', color: '#555', marginBottom: '12px', fontStyle: 'italic' }}>
            Register this weekend and get a <strong>free Temp Tag ($297 value)</strong> so you can drive immediately while your plates ship.
          </p>
          <div className="bonus-badge" style={{ marginBottom: '8px' }}>
            🏷️ Free Temp Tag · $297 Value
          </div>
          <p className="mono" style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
            Plus save $300 on LLC setup · No sales tax · No annual state inspections · No emissions
          </p>
        </div>
      </section>

      {/* Trust Bar */}
      <div style={{ maxWidth: '500px', margin: '16px auto 0', padding: '0 20px' }}>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap',
          padding: '10px 16px', background: '#92400e', borderRadius: '6px 6px 0 0'
        }}>
          {['🔒 10,000+ Registered', '✓ 99.5% Success Rate', '✓ Money-Back Guarantee'].map((t, i) => (
            <span key={i} className="condensed" style={{ fontSize: '12px', color: '#fff', letterSpacing: '1px', fontWeight: '600', textTransform: 'uppercase' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Survey Form */}
      <section style={{ padding: '0 20px 16px' }} data-survey-form>
        <div style={{
          maxWidth: '500px', margin: '0 auto', background: '#fff',
          border: '3px solid #92400e', boxShadow: '6px 6px 0 #92400e', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', background: '#fffbeb', borderBottom: '1px solid #e5d5a0' }}>
            <div style={{ background: '#e5d5a0', borderRadius: '2px', height: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${getProgressPercent()}%`, height: '100%', background: '#d97706', borderRadius: '2px', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          <div style={{ padding: '24px 20px', minHeight: '280px' }}>
            {step === 0 && (
              <div>
                <h2 className="condensed" style={{ fontSize: '20px', fontWeight: '700', textAlign: 'center', marginBottom: '16px' }}>
                  Complete the survey to claim your <span style={{ color: '#d97706' }}>free Temp Tag + $300 LLC credit</span>.
                </h2>
                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#555' }}>Are you a Car Dealer, Collector or an Individual?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <RadioOption field="customerType" value="dealer" selected={formData.customerType === 'dealer'} onChange={handleRadioSelect}>Car Dealer</RadioOption>
                  <RadioOption field="customerType" value="collector" selected={formData.customerType === 'collector'} onChange={handleRadioSelect}>Car Collector or Car Flipper</RadioOption>
                  <RadioOption field="customerType" value="individual" selected={formData.customerType === 'individual'} onChange={handleRadioSelect}>I'm an individual</RadioOption>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#555' }}>Do you want a volume discount for multiple vehicles, or do you only need help with one vehicle?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <RadioOption field="coupon" value="volume" selected={formData.coupon === 'volume'} onChange={handleRadioSelect}>Volume Discount</RadioOption>
                  <RadioOption field="coupon" value="one" selected={formData.coupon === 'one'} onChange={handleRadioSelect}>One Vehicle</RadioOption>
                  <RadioOption field="coupon" value="have_codes" selected={formData.coupon === 'have_codes'} onChange={handleRadioSelect}>I already have volume discount codes.</RadioOption>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="condensed" style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '8px', color: '#92400e' }}>Type of Vehicle</h2>
                <p style={{ marginBottom: '16px', fontSize: '14px', color: '#555' }}>What type of vehicle are you looking to Register or Retitle?</p>
                <div className="vehicle-grid">
                  {[
                    { id: 'car', label: 'Car / Van / SUV', emoji: '🚗' }, { id: 'truck', label: 'Truck', emoji: '🛻' },
                    { id: 'motorcycle', label: 'Street Legal Motorcycle', emoji: '🏍️' }, { id: 'trailer', label: 'Trailer / Toy Hauler', emoji: '🏕️' },
                    { id: 'rv', label: 'Bus / Motorhome / RV', emoji: '🚌' }, { id: 'boat', label: 'Yacht / Boat', emoji: '🚤' },
                    { id: 'offroad', label: 'Off Road Vehicle', emoji: '🏎️' }, { id: 'import', label: 'Japanese Or Euro Import', emoji: '🇯🇵' },
                    { id: 'lowspeed', label: 'Ebike', emoji: '🚲' }, { id: 'semi', label: 'Semi Truck / Semi Trailer', emoji: '🚛' },
                    { id: 'military', label: 'Military Vehicle', emoji: '🪖' }, { id: 'temptag', label: 'Need A Temp Tag', emoji: '🏷️' },
                  ].map((v) => (
                    <button key={v.id} type="button"
                      className={`vehicle-card ${formData.vehicleType === v.id ? 'selected' : ''} ${flashingOption === `vehicleType-${v.id}` ? 'flashing' : ''}`}
                      onClick={() => handleRadioSelect('vehicleType', v.id)}>
                      <div className="vehicle-card-emoji">{v.emoji}</div>
                      <div className="vehicle-card-label">{v.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="condensed" style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '8px', color: '#92400e' }}>Truck Size</h2>
                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#555' }}>Is your Truck Heavier than 1 ton?</p>
                <select className="form-input" value={formData.truckSize}
                  onChange={(e) => { const val = e.target.value; if (!hasInteracted) { setHasInteracted(true); clarityEvent('weekend_warrior_survey_started'); } clarityEvent('weekend_warrior_answer_truckSize', val); setFormData({...formData, truckSize: val}); setTimeout(() => navigateToStep(getNextStep(3, {...formData, truckSize: val})), 120); }}
                  style={{ color: formData.truckSize ? '#1a1a1a' : '#999' }}>
                  <option value="" disabled>Select an option</option>
                  <option value="yes">Yes</option><option value="no">No</option>
                </select>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="condensed" style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '8px', color: '#92400e' }}>Vehicle Age</h2>
                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#555' }}>When was your Vehicle Manufactured?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <RadioOption field="vehicleAge" value="2016+" selected={formData.vehicleAge === '2016+'} onChange={handleRadioSelect}>2016 or Newer</RadioOption>
                  <RadioOption field="vehicleAge" value="1997-2015" selected={formData.vehicleAge === '1997-2015'} onChange={handleRadioSelect}>1997 to 2015</RadioOption>
                  <RadioOption field="vehicleAge" value="1996-" selected={formData.vehicleAge === '1996-'} onChange={handleRadioSelect}>1996 & Older</RadioOption>
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="condensed" style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '8px', color: '#92400e' }}>Financing</h2>
                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#555' }}>Are you Financing your Vehicle?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <RadioOption field="financing" value="yes" selected={formData.financing === 'yes'} onChange={handleRadioSelect}>Yes</RadioOption>
                  <RadioOption field="financing" value="no" selected={formData.financing === 'no'} onChange={handleRadioSelect}>No</RadioOption>
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <h2 className="condensed" style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '20px', color: '#92400e' }}>Title Status</h2>
                {formData.vehicleType === 'import' ? (
                  <><p style={{ marginBottom: '12px', fontSize: '14px', color: '#555', fontWeight: '500' }}>Does your import have ALL import documentation? *</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <RadioOption field="importDocs" value="yes" selected={formData.importDocs === 'yes'} onChange={handleRadioSelect}>Yes</RadioOption>
                    <RadioOption field="importDocs" value="no" selected={formData.importDocs === 'no'} onChange={handleRadioSelect}>No</RadioOption>
                  </div></>
                ) : (
                  <><p style={{ marginBottom: '12px', fontSize: '14px', color: '#555', fontWeight: '500' }}>Do you currently have a Title or Certificate of Origin for your vehicle? *</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <RadioOption field="hasTitle" value="yes" selected={formData.hasTitle === 'yes'} onChange={handleRadioSelect}>Yes</RadioOption>
                    <RadioOption field="hasTitle" value="no" selected={formData.hasTitle === 'no'} onChange={handleRadioSelect}>No</RadioOption>
                  </div></>
                )}
              </div>
            )}

            {step === 7 && (
              <div>
                <h2 className="condensed" style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '8px', color: '#92400e' }}>Salvage Status</h2>
                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#555' }}>Is it a salvage vehicle? *</p>
                <select className="form-input" value={formData.isSalvage}
                  onChange={(e) => { const val = e.target.value; clarityEvent('weekend_warrior_answer_isSalvage', val); setFormData({...formData, isSalvage: val}); setTimeout(() => navigateToStep(getNextStep(7, {...formData, isSalvage: val})), 120); }}
                  style={{ color: formData.isSalvage ? '#1a1a1a' : '#999' }}>
                  <option value="" disabled>Select an option</option>
                  <option value="yes">Yes, it's a salvage vehicle.</option>
                  <option value="no">No, it is NOT a salvage vehicle.</option>
                </select>
              </div>
            )}

            {step === 8 && (
              <div>
                <h2 className="condensed" style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '8px', color: '#92400e' }}>Salvage Classification</h2>
                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#555' }}>How is the Salvage Vehicle Classified? *</p>
                <select className="form-input" value={formData.salvageClassification}
                  onChange={(e) => { const val = e.target.value; clarityEvent('weekend_warrior_answer_salvageClassification', val); setFormData({...formData, salvageClassification: val}); setTimeout(() => navigateToStep(getNextStep(8, {...formData, salvageClassification: val})), 120); }}
                  style={{ color: formData.salvageClassification ? '#1a1a1a' : '#999' }}>
                  <option value="" disabled>Select an option</option>
                  <option value="rebuilt">Rebuilt or Reconstructed</option>
                  <option value="cod">Certificate of Destruction (COD), Non-Repairable or Junk Title)</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            {step === 9 && (
              <div>
                <h2 className="condensed" style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '12px' }}>Salvage Vehicles</h2>
                <p style={{ marginBottom: '4px', fontSize: '14px', color: '#555', textAlign: 'center' }}>We're sorry but we are unable to help vehicles that are classified salvage.</p>
                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#555', textAlign: 'center' }}><strong style={{ color: '#d97706' }}>HOWEVER</strong>, we can get you a TEMP TAG!</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <RadioOption field="salvageTempTag" value="view_temp_tags" selected={formData.salvageTempTag === 'view_temp_tags'} onChange={handleRadioSelect}>View Temp Tags</RadioOption>
                </div>
              </div>
            )}

            {step === 10 && (
              <div>
                <h2 className="condensed" style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '12px' }}>Physical Inspection Needed</h2>
                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#555' }}>We are only able to help salvage vehicles that receive an in-person salvage vehicle inspection in the state of Montana.</p>
                <p style={{ marginBottom: '12px', fontSize: '14px', color: '#555' }}>Are you ready to make a trip to Montana?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <RadioOption field="physicalInspection" value="yes" selected={formData.physicalInspection === 'yes'} onChange={handleRadioSelect}>Yes, I'm willing to come to Montana for a Salvage Vehicle Inspection.</RadioOption>
                  <RadioOption field="physicalInspection" value="no" selected={formData.physicalInspection === 'no'} onChange={handleRadioSelect}>No</RadioOption>
                </div>
              </div>
            )}

            {step === 11 && (
              <div>
                <h2 className="condensed" style={{ fontSize: '20px', fontWeight: '700', textAlign: 'center', marginBottom: '8px' }}>
                  Last step to claim your <span style={{ color: '#d97706' }}>free Temp Tag + $300 credit!</span>
                </h2>
                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#555', textAlign: 'center' }}>What is the best way to reach you?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label className="mono" style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block', color: '#444' }}>Full Name *</label>
                    <input type="text" className="form-input" placeholder="First and Last Name" value={formData.fullName}
                      onChange={(e) => { const val = e.target.value; setFormData({...formData, fullName: val}); const parts = val.trim().split(/\s+/); if (val.length > 0 && (parts.length < 2 || !parts[1])) setValidationErrors(prev => ({...prev, fullName: 'Please enter your first and last name'})); else setValidationErrors(prev => ({...prev, fullName: undefined})); }}
                      style={validationErrors.fullName ? { borderColor: '#d97706', boxShadow: '0 0 0 2px rgba(217,119,6,0.15)' } : {}} autoFocus />
                    {validationErrors.fullName && <span className="mono" style={{ fontSize: '11px', color: '#d97706', marginTop: '2px', display: 'block' }}>{validationErrors.fullName}</span>}
                  </div>
                  <div>
                    <label className="mono" style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block', color: '#444' }}>Email *</label>
                    <input type="email" className="form-input" placeholder="Email" value={formData.email}
                      onChange={(e) => { const val = e.target.value; setFormData({...formData, email: val}); if (val.length > 0 && !isValidEmail(val)) setValidationErrors(prev => ({...prev, email: 'Please enter a valid email address'})); else setValidationErrors(prev => ({...prev, email: undefined})); }}
                      style={validationErrors.email ? { borderColor: '#d97706', boxShadow: '0 0 0 2px rgba(217,119,6,0.15)' } : {}} />
                    {validationErrors.email && <span className="mono" style={{ fontSize: '11px', color: '#d97706', marginTop: '2px', display: 'block' }}>{validationErrors.email}</span>}
                  </div>
                  <div>
                    <label className="mono" style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', display: 'block', color: '#444' }}>Phone *</label>
                    <input type="tel" className="form-input" placeholder="Phone" value={formData.phone}
                      onChange={(e) => { const val = e.target.value; setFormData({...formData, phone: val}); if (val.length > 0 && !isValidPhone(val)) setValidationErrors(prev => ({...prev, phone: 'Please enter a valid 10-digit phone number'})); else setValidationErrors(prev => ({...prev, phone: undefined})); }}
                      style={validationErrors.phone ? { borderColor: '#d97706', boxShadow: '0 0 0 2px rgba(217,119,6,0.15)' } : {}} />
                    {validationErrors.phone && <span className="mono" style={{ fontSize: '11px', color: '#d97706', marginTop: '2px', display: 'block' }}>{validationErrors.phone}</span>}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginTop: '8px' }}>
                    <input type="checkbox" checked={formData.termsAgreed} onChange={(e) => setFormData({...formData, termsAgreed: e.target.checked})}
                      style={{ width: '18px', height: '18px', marginTop: '3px', flexShrink: 0, cursor: 'pointer' }} />
                    <span className="mono" style={{ fontSize: '11px', color: '#666', lineHeight: '1.5' }}>I agree to receive calls, texts & emails from Legal Tags. Msg & data rates may apply. Reply STOP to opt out.</span>
                  </label>
                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <a href="#" className="mono" style={{ fontSize: '12px', color: '#d97706' }}>Privacy Policy</a>
                    <span className="mono" style={{ fontSize: '12px', color: '#999', margin: '0 8px' }}>|</span>
                    <a href="#" className="mono" style={{ fontSize: '12px', color: '#d97706' }}>Terms of Service</a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div style={{
            background: '#92400e', padding: '14px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <button type="button" onClick={handlePrev} disabled={stepHistory.length <= 1}
              style={{ background: 'transparent', border: 'none', color: stepHistory.length <= 1 ? 'rgba(255,255,255,0.3)' : '#fff', fontFamily: "'Oswald', sans-serif", fontSize: '14px', fontWeight: '500', letterSpacing: '1px', cursor: stepHistory.length <= 1 ? 'not-allowed' : 'pointer' }}>← PREV</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="pulse-dot" />
              <span className="mono" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}><strong style={{ color: '#fff' }}>{visitorCount}</strong> viewing</span>
            </div>
            {step !== 11 ? (
              <button type="button" onClick={handleNext} disabled={!canProceed()}
                style={{ background: 'transparent', border: 'none', color: canProceed() ? '#fff' : 'rgba(255,255,255,0.3)', fontFamily: "'Oswald', sans-serif", fontSize: '14px', fontWeight: '500', letterSpacing: '1px', cursor: canProceed() ? 'pointer' : 'not-allowed' }}>NEXT →</button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={!canProceed()}
                style={{ background: canProceed() ? '#d97706' : 'rgba(217,119,6,0.4)', border: 'none', color: '#fff', fontFamily: "'Oswald', sans-serif", fontSize: '14px', fontWeight: '700', letterSpacing: '1px', padding: '10px 20px', cursor: canProceed() ? 'pointer' : 'not-allowed', borderRadius: '4px' }}>SUBMIT →</button>
            )}
          </div>
        </div>
      </section>

      {/* Weekend Bonus Callout */}
      <section style={{ background: '#fff', padding: '32px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '24px', background: 'linear-gradient(135deg, #fef3c7, #fffbeb)', border: '2px dashed #d97706', borderRadius: '12px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏷️</div>
          <h3 className="condensed" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', color: '#92400e' }}>
            Weekend Bonus: Free Temp Tag
          </h3>
          <p className="serif" style={{ fontSize: '14px', lineHeight: '1.6', color: '#555', marginBottom: '12px', fontStyle: 'italic' }}>
            Every registration or retitle this weekend includes a <strong>free Temp Tag ($297 value)</strong>. Drive your vehicle legally while your permanent Montana plates are being processed and shipped.
          </p>
          <p className="mono" style={{ fontSize: '12px', color: '#888' }}>Temp Tag ships same-day · Valid for 30 days · All 50 states</p>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: '#fdf6e3', padding: '40px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 className="condensed" style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px' }}>Trusted by Thousands</h2>
          <p className="mono" style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginBottom: '32px' }}>10,000+ vehicles registered · 99.5% success rate</p>
          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div style={{ color: '#d97706', marginBottom: '8px' }}>★★★★★</div>
                <p className="serif" style={{ fontSize: '14px', lineHeight: '1.6', color: '#333', marginBottom: '12px', fontStyle: 'italic' }}>"{t.text}"</p>
                <div className="mono" style={{ fontSize: '12px', color: '#888' }}><strong>{t.name}</strong> · {t.location}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section style={{ background: '#92400e', color: '#fff', padding: '20px', textAlign: 'center' }}>
        <div className="condensed" style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1.5px', lineHeight: '2' }}>
          ✓ NO SALES TAX &nbsp;·&nbsp; ✓ NO ANNUAL STATE INSPECTIONS &nbsp;·&nbsp; ✓ FREE LLC SETUP &nbsp;·&nbsp; ✓ MONEY-BACK GUARANTEE
        </div>
      </section>

      {/* Why Montana */}
      <section className="section" style={{ background: '#fdf6e3' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="condensed" style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center', marginBottom: '32px' }}>Why 10,000+ Owners Choose Montana</h2>
          {[
            { title: 'Save Thousands in Sales Tax', desc: 'A $60,000 vehicle in California costs $5,400 in sales tax alone. Montana charges $0.' },
            { title: 'No Annual State Inspections, Ever', desc: 'No annual safety, emissions, or SMOG tests. No failed inspections holding up your registration.' },
            { title: 'Permanent Registration Available', desc: 'Vehicles 11+ years old can qualify for permanent registration — one payment, no renewals (qualifying vehicles).' },
            { title: 'Lost Title Recovery', desc: "Can't find your title? We retitle vehicles other states say are impossible — 99.5% success rate." }
          ].map((item, i) => (
            <div key={i} className="check-item">
              <div className="checkmark">✓</div>
              <div>
                <div className="condensed" style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px', color: '#92400e' }}>{item.title}</div>
                <p className="serif" style={{ fontSize: '14px', lineHeight: '1.5', color: '#555' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="section" style={{ background: '#92400e', color: '#fff' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 className="condensed" style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center', marginBottom: '12px' }}>How It Works</h2>
          <p className="serif" style={{ fontSize: '14px', textAlign: 'center', opacity: 0.85, marginBottom: '40px', fontStyle: 'italic' }}>Montana law allows out-of-state residents to register vehicles through an LLC. We handle everything remotely.</p>
          <div className="process-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {[
              { num: '1', title: 'Complete Survey', desc: 'Answer a few quick questions about your vehicle' },
              { num: '2', title: 'We Create Your LLC', desc: 'Montana LLC same-day (free — $300 value) + free Temp Tag ships immediately' },
              { num: '3', title: 'Vehicle Registered', desc: 'We register your vehicle under the LLC with Montana DMV' },
              { num: '4', title: 'Plates Delivered', desc: 'Permanent Montana plates ship to you in ~3 days' }
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', border: '3px solid #fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontFamily: "'Oswald', sans-serif", fontSize: '20px', fontWeight: '700' }}>{s.num}</div>
                <div className="condensed" style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{s.title}</div>
                <p className="mono" style={{ fontSize: '11px', opacity: 0.8, lineHeight: '1.4' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="section" style={{ textAlign: 'center', background: '#fdf6e3' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px' }}>
          <div className="stamp" style={{ marginBottom: '24px', transform: 'rotate(-2deg)' }}>Money-Back Guarantee</div>
          <h2 className="condensed" style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>If We Can't Title It,<br/>You Don't Pay</h2>
          <p className="serif" style={{ fontSize: '15px', lineHeight: '1.7', color: '#555', marginBottom: '16px', fontStyle: 'italic' }}>99.5% success rate. Full refund if we can't deliver. No questions asked.</p>
          <p className="mono" style={{ fontSize: '12px', color: '#888', marginBottom: '32px' }}>This weekend: Free Temp Tag ($297 value) + $300 LLC credit with every order</p>
          <button className="btn-primary" style={{ maxWidth: '320px' }} onClick={() => {
            clarityEvent('weekend_warrior_cta_guarantee');
            const el = document.querySelector('[data-survey-form]');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>Claim Free Temp Tag →</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1a1a1a', color: '#fdf6e3', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px' }}>
          <div className="condensed" style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '2px', marginBottom: '8px' }}>LEGAL TAGS</div>
          <div className="mono" style={{ fontSize: '12px', opacity: 0.7 }}>Montana Vehicle Registration & Titling</div>
        </div>
        <div className="mono" style={{ fontSize: '13px', marginBottom: '24px' }}>
          <a href="tel:406-510-0599" onClick={() => clarityEvent('weekend_warrior_phone_footer')} style={{ color: '#d97706', textDecoration: 'none', fontWeight: '500' }}>📞 406-510-0599</a>
          <span style={{ opacity: 0.5, margin: '0 12px' }}>|</span><span style={{ opacity: 0.7 }}>M-F 8am-8pm MT</span>
        </div>
        <div className="mono" style={{ fontSize: '11px', opacity: 0.5, marginBottom: '16px' }}>126 W Broadway #107, Philipsburg, MT 59858</div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '20px', marginTop: '20px' }}>
          <span className="mono" style={{ fontSize: '10px', opacity: 0.4 }}>© 2026 Legal Tags · All Rights Reserved</span>
        </div>
      </footer>

      {/* Social Proof Toast */}
      <div className={`social-proof-toast ${toastVisible ? 'visible' : ''}`}>
        <div className="toast-avatar">{socialProofItems[toastIndex].name.charAt(0)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{ fontSize: '12px', color: '#1a1a1a', lineHeight: '1.4' }}>
            <strong>{socialProofItems[toastIndex].name}</strong><span style={{ color: '#888' }}> from {socialProofItems[toastIndex].state}</span>
          </div>
          <div className="mono" style={{ fontSize: '11px', color: '#d97706', fontWeight: '500', marginTop: '2px' }}>just claimed free Temp Tag + $300 credit</div>
          <div className="mono" style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>{socialProofItems[toastIndex].time}</div>
        </div>
        <button onClick={() => setToastVisible(false)} style={{ position: 'absolute', top: '6px', right: '8px', background: 'none', border: 'none', fontSize: '14px', color: '#ccc', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}>×</button>
      </div>

      {/* Analyzing Overlay */}
      {showAnalyzing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'linear-gradient(135deg, #fdf6e3, #fef3c7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px dashed #92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'spin 2s linear infinite', marginBottom: '28px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
              <div className="condensed" style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', textAlign: 'center', lineHeight: '1.1', letterSpacing: '1px' }}>LEGAL<br/>TAGS</div>
            </div>
          </div>
          <h2 className="condensed" style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px' }}>Reserving Your Weekend Bundle</h2>
          <div style={{ width: '280px', height: '6px', borderRadius: '3px', background: '#e5d5a0', overflow: 'hidden', marginBottom: '28px' }}>
            <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #d97706, #b45309)', width: `${analyzingProgress}%`, transition: 'width 0.1s linear' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '280px' }}>
            {['Vehicle type confirmed', 'Matching registration package', 'Adding free Temp Tag', 'Applying $300 LLC credit'].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: analyzingStep > i ? 1 : 0.25, transform: analyzingStep > i ? 'translateX(0)' : 'translateX(-8px)', transition: 'all 0.35s ease' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: analyzingStep > i ? '#d97706' : '#ccc', color: analyzingStep > i ? '#fff' : '#888', fontSize: '12px', fontWeight: '700', transition: 'background 0.3s ease' }}>
                  {analyzingStep > i ? '✓' : '·'}
                </div>
                <span className="mono" style={{ fontSize: '13px', color: analyzingStep > i ? '#1a1a1a' : '#999', fontWeight: analyzingStep > i ? '500' : '400', transition: 'color 0.3s ease' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
