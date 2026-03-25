/**
 * Phoneme to VRM Blendshape mapping
 * Maps common speech sounds to VRM viseme blendshapes
 */

const PHONEME_MAP = {
  // Vowels
  a: "aa",            // "ah"
  e: "ee",            // "eh"
  i: "ih",            // "ee"
  o: "oh",            // "oh"
  u: "ou",            // "oo"
  
  // Consonants
  m: "aa",            // closed / small movement fallback
  p: "ou",            // rounded fallback
  b: "ou",            // rounded fallback
  f: "ee",            // narrow fallback
  v: "ee",            // narrow fallback
  
  // Approximations for other sounds
  s: "ee",            // narrow
  t: "ee",            // narrow
  n: "ih",            // nasal-like
  l: "ih",            // tongue-like
  r: "oh",            // rounded mid
  y: "ih",            // front vowel-like
  w: "ou",            // rounded
  d: "ee",            // narrow
  g: "aa",            // open
  k: "aa",            // open
  h: "aa",            // open
  
  // Affricates
  ch: "ee",           // narrow
  sh: "ee",           // narrow
  zh: "ee",           // narrow
  th: "ee",           // narrow
};

const VISEME_KEYS = ["aa", "ih", "ou", "ee", "oh", "a", "i", "u", "e", "o"];

/**
 * Extract phonemes from text with approximate timing
 * Returns array of { phoneme, start, duration, blendshape }
 */
export function analyzeTextForVisemes(text, totalDuration) {
  if (!text || totalDuration <= 0) {
    return [];
  }

  const visemes = [];
  const cleanText = text.toLowerCase().replace(/[^a-z\s]/g, "");
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length === 0) {
    return [];
  }

  const timePerWord = totalDuration / Math.max(words.length, 1);
  let currentTime = 0;

  words.forEach((word) => {
    const timePerChar = timePerWord / Math.max(word.length, 1);
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      
      // Try two-character phoneme first
      let phoneme = null;
      let charCount = 1;
      
      if (i < word.length - 1) {
        const twoChar = word.slice(i, i + 2);
        if (PHONEME_MAP[twoChar]) {
          phoneme = twoChar;
          charCount = 2;
        }
      }
      
      // Fall back to single character
      if (!phoneme) {
        phoneme = char;
      }
      
      const blendshape = PHONEME_MAP[phoneme] || "aa";
      
      visemes.push({
        phoneme,
        blendshape,
        start: currentTime,
        duration: timePerChar * charCount,
      });
      
      currentTime += timePerChar * charCount;
    }
  });

  return visemes;
}

/**
 * Create a viseme animators from text
 * Returns a function that can be called with current time to apply blendshapes
 */
export function createVisemeAnimator(text, totalDuration) {
  const visemes = analyzeTextForVisemes(text, totalDuration);
  
  return (currentTime) => {
    let activeViseme = "aa";
    
    for (const v of visemes) {
      if (currentTime >= v.start && currentTime < v.start + v.duration) {
        activeViseme = v.blendshape;
        break;
      }
    }
    
    return activeViseme;
  };
}

/**
 * Get all available VRM viseme blendshapes from a VRM model
 */
export function detectVRMVisemes(vrm) {
  if (!vrm || !vrm.expressionManager) {
    return [];
  }

  const presets = vrm.expressionManager.presetExpressionMap;
  const visemes = [];

  for (const [key, exp] of Object.entries(presets)) {
    if (VISEME_KEYS.includes(key.toLowerCase()) || key.toLowerCase().includes("viseme")) {
      visemes.push(key);
    }
  }

  return visemes.length > 0 ? visemes : Object.keys(presets);
}

/**
 * Apply a blendshape to a VRM model
 */
export function applyVisemeToVRM(vrm, blendshapeName, weight = 1.0) {
  if (!vrm || !vrm.expressionManager) {
    return;
  }

  const presets = vrm.expressionManager.presetExpressionMap;
  
  // Reset all visemes to 0
  for (const key of Object.keys(presets)) {
    if (VISEME_KEYS.includes(key.toLowerCase()) || key.toLowerCase().includes("viseme")) {
      vrm.expressionManager.setValue(key, 0);
    }
  }

  // Apply target viseme
  if (presets[blendshapeName]) {
    vrm.expressionManager.setValue(blendshapeName, weight);
  } else {
    const fallbackCandidates = {
      aa: ["aa", "a", "viseme_a"],
      ih: ["ih", "i", "viseme_i"],
      ou: ["ou", "u", "viseme_u"],
      ee: ["ee", "e", "viseme_e"],
      oh: ["oh", "o", "viseme_o"]
    };
    const keys = Object.keys(presets);
    const candidates = fallbackCandidates[blendshapeName] || [blendshapeName];
    const match = keys.find((key) => candidates.includes(key.toLowerCase()));
    if (match) {
      vrm.expressionManager.setValue(match, weight);
    }
  }
}

/**
 * Reset all visemes to neutral
 */
export function resetVisemes(vrm) {
  if (!vrm || !vrm.expressionManager) {
    return;
  }

  const presets = vrm.expressionManager.presetExpressionMap;
  
  for (const key of Object.keys(presets)) {
    if (VISEME_KEYS.includes(key.toLowerCase()) || key.toLowerCase().includes("viseme")) {
      vrm.expressionManager.setValue(key, 0);
    }
  }
}
