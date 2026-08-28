// Landmarks and stories for the EM comparison observatory. Everything here is
// data, not behavior: each landmark is a physical thing with an honest spectral
// shape (a line, a band, or a broad spectrum), a representative frequency, and
// one sentence on why it belongs. The page derives all numbers from these.
window.SPECTRUM_DATA = (() => {
  const C = 299792458;
  const nm = w => C / (w * 1e-9);           // wavelength in nm -> Hz
  const um = w => C / (w * 1e-6);           // wavelength in µm -> Hz
  const keV = e => e * 1e3 / 4.135667696e-15; // photon energy in keV -> Hz

  // type: 'line'   — effectively monochromatic, drawn as a line
  //       'band'   — a defined allocation or range, drawn as a translucent span
  //       'spectrum' — a broad emission, drawn as a soft footprint; the marker
  //                    sits at an approximate peak or representative value
  const LANDMARKS = [
    // --- Dust Off and patent world -------------------------------------
    { id: 'separator-gold', name: 'Separator, gold band', cat: 'dust off',
      type: 'line', hz: 18e6,
      why: 'The gold band from the Separator, tuned near 18 MHz shortwave.' },
    { id: 'dust-off', name: 'Dust Off beam', cat: 'dust off',
      type: 'line', hz: nm(532),
      why: 'The 532 nm green beam itself — the reason this page exists.' },
    { id: 'red-laser', name: 'Red laser', cat: 'dust off',
      type: 'line', hz: nm(633),
      why: 'A classic 633 nm helium–neon red, the lab-bench standard.' },
    { id: 'blue-laser', name: 'Blue laser', cat: 'dust off',
      type: 'line', hz: nm(450),
      why: '450 nm diode blue, the color inside most laser projectors.' },
    { id: 'ir-illuminator', name: 'IR illuminator', cat: 'dust off',
      type: 'line', hz: nm(940),
      why: '940 nm near-infrared: sensing and illumination light cameras see and eyes do not.' },

    // --- Everyday technology -------------------------------------------
    { id: 'am-radio', name: 'AM radio', cat: 'technology',
      type: 'band', lo: 540e3, hi: 1.7e6, hz: 1e6,
      why: 'The AM broadcast band, 540 kHz to 1.7 MHz. Waves hundreds of meters long.' },
    { id: 'fm-radio', name: 'FM radio', cat: 'technology',
      type: 'band', lo: 87.5e6, hi: 108e6, hz: 100e6,
      why: 'The FM broadcast band, 87.5 to 108 MHz. 100 MHz is the classic representative.' },
    { id: 'gps', name: 'GPS', cat: 'technology',
      type: 'line', hz: 1.57542e9,
      why: 'The GPS L1 carrier at 1575.42 MHz, whispering down from orbit.' },
    { id: 'cellular', name: 'Cellular', cat: 'technology',
      type: 'band', lo: 600e6, hi: 6e9, hz: 1.9e9,
      why: 'Phone networks scatter across many allocations from 600 MHz to 6 GHz.' },
    { id: 'wifi', name: 'Wi-Fi', cat: 'technology',
      type: 'band', lo: 2.4e9, hi: 5.9e9, hz: 2.4e9,
      why: 'Wi-Fi lives in defined bands near 2.4 and 5–6 GHz, not at one point.' },
    { id: 'microwave-oven', name: 'Microwave oven', cat: 'technology',
      type: 'line', hz: 2.45e9,
      why: '2.45 GHz — almost exactly where Wi-Fi sits. The difference is power, not place.' },
    { id: 'radar', name: 'Radar', cat: 'technology',
      type: 'band', lo: 1e9, hi: 40e9, hz: 10e9,
      why: 'Radar bands run from about 1 to 40 GHz depending on the job.' },
    { id: 'tv-remote', name: 'TV remote', cat: 'technology',
      type: 'line', hz: nm(940),
      why: 'Your remote blinks at ~940 nm infrared, invisible but a camera shows it.' },

    // --- Body and nature -------------------------------------------------
    { id: 'lightning', name: 'Lightning (radio crackle)', cat: 'nature',
      type: 'spectrum', lo: 1e4, hi: 3e5, hz: 1e4,
      why: 'A stroke is a colossal current pulse, so it radiates real radio waves — the static you hear on AM during a storm — peaking near 10 kHz.' },
    { id: 'cmb', name: 'Cosmic microwave background', cat: 'nature',
      type: 'spectrum', lo: 1e9, hi: 1e12, hz: 160.23e9,
      why: 'The afterglow of the Big Bang: a thermal spectrum peaking at 160 GHz.' },
    { id: 'body-heat', name: 'Human body heat', cat: 'nature',
      type: 'spectrum', lo: 3e12, hi: 1e14, hz: um(9.5),
      why: 'You glow, broadly, in the infrared — peaking near 9.5 µm at skin temperature.' },
    { id: 'fire', name: 'Campfire', cat: 'nature',
      type: 'spectrum', lo: 1e13, hi: 5e14, hz: um(1.9),
      why: 'A fire’s thermal spectrum peaks in the near-infrared; the visible flicker is its high tail.' },
    { id: 'sunlight', name: 'Sunlight', cat: 'nature',
      type: 'spectrum', lo: 1e14, hi: 1.5e15, hz: nm(500),
      why: 'Sunlight spans infrared through ultraviolet, peaking right in the visible.' },
    { id: 'sodium-line', name: 'Sodium streetlight line', cat: 'nature',
      type: 'line', hz: nm(589),
      why: 'The 589 nm sodium doublet — the amber of old streetlights and flame tests.' },
    { id: 'h-alpha', name: 'Hydrogen-alpha line', cat: 'nature',
      type: 'line', hz: nm(656.3),
      why: '656.3 nm — the red glow of hydrogen, painting nebulae across the sky.' },

    // --- Medicine and high energy ----------------------------------------
    { id: 'uvb', name: 'UVB (sunburn)', cat: 'high energy',
      type: 'band', lo: nm(315), hi: nm(280), hz: nm(300),
      why: 'The 280–315 nm band that sunburns skin. Non-ionizing, yet clearly not harmless.' },
    { id: 'uvc', name: 'Germicidal UVC', cat: 'high energy',
      type: 'line', hz: nm(254),
      why: '254 nm mercury-lamp light, used to sterilize because it shreds DNA bonds.' },
    { id: 'dental-xray', name: 'Dental x-ray', cat: 'high energy',
      type: 'spectrum', lo: keV(10), hi: keV(70), hz: keV(30),
      why: 'An x-ray tube emits a distribution of energies; a dental set peaks near 30 keV.' },
    { id: 'ct-xray', name: 'CT scan x-rays', cat: 'high energy',
      type: 'spectrum', lo: keV(10), hi: keV(140), hz: keV(60),
      why: 'CT scanners run at 80–140 kVp, a broad braking-radiation spectrum.' },
    { id: 'tc99m-gamma', name: 'Medical gamma (Tc-99m)', cat: 'high energy',
      type: 'line', hz: keV(140),
      why: 'The 140 keV gamma line of technetium-99m, the workhorse of nuclear medicine.' },
  ];

  // Curated pairs, each with an insight that only makes sense for that pair.
  // a/b are landmark ids; the page falls back to a generic insight otherwise.
  const STORIES = [
    { a: 'fm-radio', b: 'dust-off',
      name: 'FM radio vs the Dust Off beam',
      insight: 'The beam sits 6.75 orders of magnitude — 22.4 doublings — above FM radio. Same phenomenon, wildly different address.' },
    { a: 'wifi', b: 'microwave-oven',
      name: 'Wi-Fi vs a microwave oven',
      insight: 'These operate at almost the same frequency. Their radically different effects come from power, confinement, geometry, and exposure — not from living in a more dangerous part of the spectrum.' },
    { a: 'red-laser', b: 'blue-laser',
      name: 'Red vs blue',
      insight: 'The entire human-visible rainbow spans only about one octave of frequency — one doubling, out of the 53 in this view.' },
    { a: 'body-heat', b: 'dust-off',
      name: 'You vs the beam',
      insight: 'You are glowing continuously in infrared, about 18 times lower in frequency than the beam. Your eyes simply did not receive the memo.' },
    { a: 'cmb', b: 'microwave-oven',
      name: 'The Big Bang vs your kitchen',
      insight: 'The afterglow of the Big Bang peaks a mere 65× above your oven’s frequency. Your kitchen outshines the early universe — locally, and only because of power.' },
    { a: 'am-radio', b: 'tc99m-gamma',
      name: 'AM radio vs medical gamma',
      insight: 'Thirteen and a half orders of magnitude apart, yet both are the same phenomenon: an electromagnetic wave, differing only in frequency.' },
  ];

  // Familiar objects for the wavelength scale ladder. size is a representative
  // length in meters; each marker's wavelength is compared against the nearest
  // object in log space, with the honest ratio stated rather than hidden.
  const SCALE_OBJECTS = [
    { id: 'city',      name: 'a city',            size: 5e3,    img: 'scale/city.png' },
    { id: 'person',    name: 'a person',          size: 1.7,    img: 'scale/person.png' },
    { id: 'apple',     name: 'an apple',          size: 0.08,   img: 'apple.png' },
    { id: 'finger',    name: 'a finger’s width',  size: 0.016,  img: 'scale/finger.png' },
    { id: 'sand',      name: 'a grain of sand',   size: 5e-4,   img: 'scale/sand.png' },
    { id: 'cell',      name: 'a living cell',     size: 1.5e-5, img: 'scale/cell.png' },
    { id: 'bacterium', name: 'a bacterium',       size: 2e-6,   img: 'scale/bacterium.png' },
    { id: 'atom',      name: 'an atom',           size: 1e-10,  img: 'scale/atom.png' },
    // an atomic nucleus (~10 fm) sits below any wavelength in the displayed
    // 10 kHz–100 EHz window — it is here so the ladder keeps its footing if
    // the window ever grows, and as a reminder the spectrum does not end here
    { id: 'nucleus',   name: 'an atomic nucleus', size: 1e-14,  img: 'scale/nucleus.png' },
  ];

  return { LANDMARKS, STORIES, SCALE_OBJECTS };
})();
