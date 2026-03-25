# VRoid Voice Assistant Frontend

A modern React.js landing page with:

- Full-screen dark UI
- Interactive, slowly rotating 3D avatar area (VRM/GLB)
- Bottom text input and Speak button
- Bot response rendering on screen
- Browser text-to-speech using Web Speech API
- Glassmorphism styling and smooth animations

## Tech Stack

- React + Vite
- Three.js via `@react-three/fiber` and `@react-three/drei`
- VRoid support with `@pixiv/three-vrm`
- Vanilla CSS (no Bootstrap)

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Using Your VRoid Model

1. Host your `.vrm` (or `.glb`) file so it is accessible by URL.
2. Paste the model URL in the "VRoid Model URL" input at the top.
3. The 3D scene will load your model automatically.

## Notes

- If a model URL is empty or fails to load, a fallback animated 3D object is displayed.
- Speech synthesis depends on browser support and user/device voice availability.